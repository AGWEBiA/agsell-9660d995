-- Create a more generic automation enqueue function
CREATE OR REPLACE FUNCTION public.enqueue_automations(
  v_org_id uuid,
  v_trigger_type text,
  v_contact_id uuid,
  v_trigger_data jsonb DEFAULT '{}'::jsonb
)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  auto_rec RECORD;
  v_execution_id uuid;
  v_actions jsonb;
  v_enqueued_count int := 0;
  v_tag_name text;
BEGIN
  IF v_org_id IS NULL OR v_trigger_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Special handling for tag_added to match tag_name if configured
  IF v_trigger_type = 'tag_added' AND v_trigger_data ? 'tag_id' THEN
    SELECT name INTO v_tag_name FROM public.tags WHERE id = (v_trigger_data->>'tag_id')::uuid;
  END IF;

  FOR auto_rec IN
    SELECT a.id, a.actions, a.trigger_config
    FROM public.automations a
    WHERE a.is_active = true
      AND a.trigger_type = v_trigger_type
      AND (a.organization_id = v_org_id OR a.organization_id IS NULL)
      AND (
        v_trigger_type != 'tag_added'
        OR v_tag_name IS NULL
        OR COALESCE(NULLIF(btrim(a.trigger_config->>'tag_name'), ''), '') = ''
        OR lower(btrim(a.trigger_config->>'tag_name')) = lower(btrim(v_tag_name))
      )
  LOOP
    v_actions := COALESCE(auto_rec.actions, '[]'::jsonb);
    IF jsonb_array_length(v_actions) = 0 THEN
      CONTINUE;
    END IF;

    -- Create execution record
    INSERT INTO public.automation_executions (
      automation_id, contact_id, trigger_event, status, total_steps, current_step, organization_id
    ) VALUES (
      auto_rec.id, v_contact_id, v_trigger_type, 'pending',
      jsonb_array_length(v_actions), 0, v_org_id
    )
    RETURNING id INTO v_execution_id;

    -- Schedule immediate processing
    INSERT INTO public.automation_scheduled_steps (
      automation_id, execution_id, contact_id, organization_id,
      current_step, scheduled_at, status, actions
    ) VALUES (
      auto_rec.id, v_execution_id, v_contact_id, v_org_id,
      0, now(), 'pending', v_actions
    );

    -- Increment counter
    UPDATE public.automations
       SET executions_count = COALESCE(executions_count, 0) + 1
     WHERE id = auto_rec.id;
     
    v_enqueued_count := v_enqueued_count + 1;
  END LOOP;

  RETURN v_enqueued_count;
END;
$function$;

-- Update handle_form_submission to enqueue automations
CREATE OR REPLACE FUNCTION public.handle_form_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
 DECLARE
   form_record RECORD;
   existing_contact RECORD;
   contact_first_name TEXT;
   contact_email TEXT;
   contact_phone TEXT;
   contact_whatsapp TEXT;
   new_contact_id UUID;
   submission_data JSONB;
   k TEXT;
   v TEXT;
   raw_phone TEXT;
   v_tag_id UUID;
   v_tag_name TEXT;
   v_settings JSONB;
 BEGIN
   -- Increment submissions count
   UPDATE public.forms
   SET submissions_count = COALESCE(submissions_count, 0) + 1
   WHERE id = NEW.form_id;
 
   SELECT user_id, organization_id, settings INTO form_record
   FROM public.forms WHERE id = NEW.form_id;
 
   IF form_record IS NULL THEN RETURN NEW; END IF;
 
   submission_data := NEW.data;
   v_settings := COALESCE(form_record.settings, '{}'::jsonb);
 
   FOR k, v IN SELECT * FROM jsonb_each_text(submission_data)
   LOOP
     CONTINUE WHEN v IS NULL OR btrim(v) = '';
     CASE lower(btrim(k))
       WHEN 'nome', 'name', 'first_name', 'nome completo', 'nome_completo', 'full_name' THEN
         IF contact_first_name IS NULL THEN contact_first_name := btrim(v); END IF;
       WHEN 'email', 'e-mail', 'e_mail', 'correo' THEN
         IF contact_email IS NULL THEN contact_email := lower(btrim(v)); END IF;
       WHEN 'telefone', 'phone', 'celular', 'tel', 'fone', 'número', 'numero', 'phone_number' THEN
         IF contact_phone IS NULL THEN contact_phone := btrim(v); END IF;
       WHEN 'whatsapp', 'wpp', 'zap' THEN
         IF contact_whatsapp IS NULL THEN contact_whatsapp := btrim(v); END IF;
       ELSE NULL;
     END CASE;
   END LOOP;
 
   IF contact_phone IS NOT NULL AND contact_whatsapp IS NULL THEN
     contact_whatsapp := contact_phone;
   ELSIF contact_whatsapp IS NOT NULL AND contact_phone IS NULL THEN
     contact_phone := contact_whatsapp;
   END IF;
 
   IF contact_phone IS NOT NULL THEN
     raw_phone := regexp_replace(contact_phone, '[^0-9]', '', 'g');
     IF length(raw_phone) >= 10 AND length(raw_phone) <= 11 AND raw_phone !~ '^55' THEN
       raw_phone := '55' || raw_phone;
     END IF;
     contact_phone := raw_phone;
   END IF;
   IF contact_whatsapp IS NOT NULL THEN
     raw_phone := regexp_replace(contact_whatsapp, '[^0-9]', '', 'g');
     IF length(raw_phone) >= 10 AND length(raw_phone) <= 11 AND raw_phone !~ '^55' THEN
       raw_phone := '55' || raw_phone;
     END IF;
     contact_whatsapp := raw_phone;
   END IF;
 
   IF COALESCE(NULLIF(contact_first_name, ''), NULLIF(contact_email, '')) IS NULL THEN
     RETURN NEW;
   END IF;
 
   IF contact_email IS NOT NULL AND contact_email <> '' THEN
     SELECT id, phone, whatsapp INTO existing_contact
     FROM public.contacts
     WHERE organization_id = form_record.organization_id
       AND lower(email) = contact_email
     LIMIT 1;
   END IF;
 
   IF existing_contact.id IS NOT NULL THEN
     new_contact_id := existing_contact.id;
     UPDATE public.contacts SET
       phone = CASE WHEN COALESCE(NULLIF(phone, ''), '') = '' AND COALESCE(NULLIF(contact_phone, ''), '') <> '' THEN contact_phone ELSE phone END,
       whatsapp = CASE WHEN COALESCE(NULLIF(whatsapp, ''), '') = '' AND COALESCE(NULLIF(contact_whatsapp, ''), '') <> '' THEN contact_whatsapp ELSE whatsapp END,
       first_name = CASE WHEN COALESCE(NULLIF(first_name, ''), '') = '' AND COALESCE(NULLIF(contact_first_name, ''), '') <> '' THEN contact_first_name ELSE first_name END,
       updated_at = now()
     WHERE id = existing_contact.id;
   ELSE
     INSERT INTO public.contacts (first_name, email, phone, whatsapp, user_id, organization_id, source)
     VALUES (
       COALESCE(NULLIF(contact_first_name, ''), 'Lead Formulário'),
       NULLIF(contact_email, ''), NULLIF(contact_phone, ''), NULLIF(contact_whatsapp, ''),
       form_record.user_id, form_record.organization_id, 'formulario'
     ) RETURNING id INTO new_contact_id;
   END IF;
 
   -- Apply tag from form settings
   v_tag_id := NULL;
   IF v_settings ? 'tag_id' AND NULLIF(v_settings->>'tag_id', '') IS NOT NULL THEN
     BEGIN
       v_tag_id := (v_settings->>'tag_id')::uuid;
       IF NOT EXISTS (SELECT 1 FROM public.tags WHERE id = v_tag_id AND organization_id = form_record.organization_id) THEN
         v_tag_id := NULL;
       END IF;
     EXCEPTION WHEN OTHERS THEN
       v_tag_id := NULL;
     END;
   END IF;
 
   IF v_tag_id IS NULL AND v_settings ? 'tag_name' AND NULLIF(btrim(v_settings->>'tag_name'), '') IS NOT NULL THEN
     v_tag_name := btrim(v_settings->>'tag_name');
     SELECT id INTO v_tag_id FROM public.tags
       WHERE organization_id = form_record.organization_id AND lower(name) = lower(v_tag_name)
       LIMIT 1;
     IF v_tag_id IS NULL THEN
       INSERT INTO public.tags (name, color, user_id, organization_id)
       VALUES (v_tag_name, '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'), form_record.user_id, form_record.organization_id)
       RETURNING id INTO v_tag_id;
     END IF;
   END IF;
 
   IF v_tag_id IS NOT NULL THEN
     INSERT INTO public.contact_tags (contact_id, tag_id)
     VALUES (new_contact_id, v_tag_id)
     ON CONFLICT DO NOTHING;
   END IF;
 
   -- DISPATCH AUTOMATION
   PERFORM public.enqueue_automations(form_record.organization_id, 'form_submitted', new_contact_id, jsonb_build_object('form_id', NEW.form_id));
 
   UPDATE public.form_submissions SET contact_id = new_contact_id WHERE id = NEW.id;
   RETURN NEW;
 END;
 $function$;

-- Update tag_added trigger to use generic function
CREATE OR REPLACE FUNCTION public.enqueue_tag_added_automations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.contacts WHERE id = NEW.contact_id;
  
  PERFORM public.enqueue_automations(
    v_org_id, 
    'tag_added', 
    NEW.contact_id, 
    jsonb_build_object('tag_id', NEW.tag_id)
  );

  RETURN NEW;
END;
$function$;

-- Add trigger for contact_created
CREATE OR REPLACE FUNCTION public.on_contact_created_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.enqueue_automations(NEW.organization_id, 'contact_created', NEW.id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_on_contact_created ON public.contacts;
CREATE TRIGGER tr_on_contact_created
AFTER INSERT ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.on_contact_created_trigger();

-- Add trigger for deal_stage_changed
CREATE OR REPLACE FUNCTION public.on_deal_stage_changed_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    PERFORM public.enqueue_automations(
      NEW.organization_id, 
      'deal_stage_changed', 
      NEW.contact_id, 
      jsonb_build_object('deal_id', NEW.id, 'old_stage_id', OLD.stage_id, 'new_stage_id', NEW.stage_id)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_on_deal_stage_changed ON public.deals;
CREATE TRIGGER tr_on_deal_stage_changed
AFTER UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.on_deal_stage_changed_trigger();
