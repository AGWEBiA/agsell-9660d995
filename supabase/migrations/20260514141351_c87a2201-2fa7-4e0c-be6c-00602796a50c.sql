CREATE OR REPLACE FUNCTION public.normalize_form_submission_data(_payload jsonb)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _payload IS NULL OR jsonb_typeof(_payload) <> 'object' THEN '{}'::jsonb
    WHEN jsonb_typeof(_payload->'data') = 'object'
      AND (
        _payload->>'event' = 'form_submission'
        OR (_payload->'data') ?| ARRAY['name','Name','nome','Nome','email','Email','phone','Phone','telefone','Telefone','whatsapp','celular']
      ) THEN _payload->'data'
    WHEN jsonb_typeof(_payload->'fields') = 'object' THEN _payload->'fields'
    WHEN jsonb_typeof(_payload->'submission') = 'object' THEN _payload->'submission'
    ELSE _payload
  END;
$$;

CREATE OR REPLACE FUNCTION public.process_form_submission_contact_and_tag(
  _submission_id uuid,
  _increment_count boolean DEFAULT false,
  _enqueue_automations boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_record RECORD;
  form_record RECORD;
  existing_contact RECORD;
  submission_data jsonb;
  k text;
  v text;
  contact_first_name text;
  contact_last_name text;
  contact_email text;
  contact_phone text;
  contact_whatsapp text;
  raw_phone text;
  new_contact_id uuid;
  v_tag_id uuid;
  v_tag_name text;
  v_settings jsonb;
BEGIN
  SELECT * INTO submission_record
  FROM public.form_submissions
  WHERE id = _submission_id;

  IF submission_record IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id, user_id, organization_id, name, settings INTO form_record
  FROM public.forms
  WHERE id = submission_record.form_id;

  IF form_record IS NULL THEN
    RETURN submission_record.contact_id;
  END IF;

  IF _increment_count THEN
    UPDATE public.forms
       SET submissions_count = COALESCE(submissions_count, 0) + 1
     WHERE id = form_record.id;
  END IF;

  submission_data := public.normalize_form_submission_data(submission_record.data);
  v_settings := COALESCE(form_record.settings, '{}'::jsonb);
  new_contact_id := submission_record.contact_id;

  FOR k, v IN SELECT * FROM jsonb_each_text(submission_data)
  LOOP
    CONTINUE WHEN v IS NULL OR btrim(v) = '';
    CASE lower(btrim(k))
      WHEN 'nome', 'name', 'first_name', 'firstname', 'nome completo', 'nome_completo', 'full_name', 'fullname' THEN
        IF contact_first_name IS NULL THEN contact_first_name := btrim(v); END IF;
      WHEN 'last_name', 'lastname', 'sobrenome' THEN
        IF contact_last_name IS NULL THEN contact_last_name := btrim(v); END IF;
      WHEN 'email', 'e-mail', 'e_mail', 'correo' THEN
        IF contact_email IS NULL THEN contact_email := lower(btrim(v)); END IF;
      WHEN 'telefone', 'phone', 'celular', 'tel', 'fone', 'número', 'numero', 'phone_number', 'phonenumber' THEN
        IF contact_phone IS NULL THEN contact_phone := btrim(v); END IF;
      WHEN 'whatsapp', 'wpp', 'zap' THEN
        IF contact_whatsapp IS NULL THEN contact_whatsapp := btrim(v); END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  IF contact_first_name IS NOT NULL AND contact_last_name IS NULL AND position(' ' in contact_first_name) > 0 THEN
    contact_last_name := nullif(btrim(substr(contact_first_name, position(' ' in contact_first_name) + 1)), '');
    contact_first_name := nullif(btrim(split_part(contact_first_name, ' ', 1)), '');
  END IF;

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
    contact_phone := nullif(raw_phone, '');
  END IF;

  IF contact_whatsapp IS NOT NULL THEN
    raw_phone := regexp_replace(contact_whatsapp, '[^0-9]', '', 'g');
    IF length(raw_phone) >= 10 AND length(raw_phone) <= 11 AND raw_phone !~ '^55' THEN
      raw_phone := '55' || raw_phone;
    END IF;
    contact_whatsapp := nullif(raw_phone, '');
  END IF;

  IF new_contact_id IS NULL AND contact_email IS NOT NULL AND contact_email <> '' THEN
    SELECT id, phone, whatsapp INTO existing_contact
    FROM public.contacts
    WHERE organization_id IS NOT DISTINCT FROM form_record.organization_id
      AND lower(email) = contact_email
    LIMIT 1;
    new_contact_id := existing_contact.id;
  END IF;

  IF new_contact_id IS NULL AND COALESCE(contact_whatsapp, contact_phone) IS NOT NULL THEN
    SELECT id, phone, whatsapp INTO existing_contact
    FROM public.contacts
    WHERE organization_id IS NOT DISTINCT FROM form_record.organization_id
      AND (regexp_replace(COALESCE(whatsapp, ''), '[^0-9]', '', 'g') = COALESCE(contact_whatsapp, contact_phone)
        OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = COALESCE(contact_whatsapp, contact_phone))
    LIMIT 1;
    new_contact_id := existing_contact.id;
  END IF;

  IF new_contact_id IS NOT NULL THEN
    UPDATE public.contacts SET
      first_name = CASE WHEN COALESCE(NULLIF(first_name, ''), '') = '' AND COALESCE(NULLIF(contact_first_name, ''), '') <> '' THEN contact_first_name ELSE first_name END,
      last_name = CASE WHEN COALESCE(NULLIF(last_name, ''), '') = '' AND COALESCE(NULLIF(contact_last_name, ''), '') <> '' THEN contact_last_name ELSE last_name END,
      email = CASE WHEN COALESCE(NULLIF(email, ''), '') = '' AND COALESCE(NULLIF(contact_email, ''), '') <> '' THEN contact_email ELSE email END,
      phone = CASE WHEN COALESCE(NULLIF(phone, ''), '') = '' AND COALESCE(NULLIF(contact_phone, ''), '') <> '' THEN contact_phone ELSE phone END,
      whatsapp = CASE WHEN COALESCE(NULLIF(whatsapp, ''), '') = '' AND COALESCE(NULLIF(contact_whatsapp, ''), '') <> '' THEN contact_whatsapp ELSE whatsapp END,
      source = COALESCE(NULLIF(source, ''), form_record.name),
      updated_at = now()
    WHERE id = new_contact_id;
  ELSIF COALESCE(NULLIF(contact_first_name, ''), NULLIF(contact_email, ''), NULLIF(contact_phone, ''), NULLIF(contact_whatsapp, '')) IS NOT NULL THEN
    INSERT INTO public.contacts (first_name, last_name, email, phone, whatsapp, user_id, organization_id, source)
    VALUES (
      COALESCE(NULLIF(contact_first_name, ''), split_part(COALESCE(contact_email, ''), '@', 1), 'Lead Formulário'),
      NULLIF(contact_last_name, ''),
      NULLIF(contact_email, ''),
      NULLIF(contact_phone, ''),
      NULLIF(contact_whatsapp, ''),
      form_record.user_id,
      form_record.organization_id,
      form_record.name
    )
    RETURNING id INTO new_contact_id;
  END IF;

  IF new_contact_id IS NOT NULL THEN
    UPDATE public.form_submissions
       SET contact_id = new_contact_id
     WHERE id = _submission_id
       AND contact_id IS DISTINCT FROM new_contact_id;

    v_tag_id := NULL;
    IF v_settings ? 'tag_id' AND NULLIF(v_settings->>'tag_id', '') IS NOT NULL THEN
      BEGIN
        v_tag_id := (v_settings->>'tag_id')::uuid;
        IF NOT EXISTS (
          SELECT 1 FROM public.tags
          WHERE id = v_tag_id
            AND (organization_id IS NOT DISTINCT FROM form_record.organization_id OR user_id = form_record.user_id)
        ) THEN
          v_tag_id := NULL;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_tag_id := NULL;
      END;
    END IF;

    IF v_tag_id IS NULL THEN
      v_tag_name := COALESCE(NULLIF(btrim(v_settings->>'tag_name'), ''), NULLIF(btrim(form_record.name), ''), 'Formulário');
      SELECT id INTO v_tag_id
      FROM public.tags
      WHERE lower(name) = lower(v_tag_name)
        AND (organization_id IS NOT DISTINCT FROM form_record.organization_id OR user_id = form_record.user_id)
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_tag_id IS NULL THEN
        INSERT INTO public.tags (name, color, user_id, organization_id)
        VALUES (v_tag_name, '#3B82F6', form_record.user_id, form_record.organization_id)
        RETURNING id INTO v_tag_id;
      END IF;
    END IF;

    IF v_tag_id IS NOT NULL THEN
      INSERT INTO public.contact_tags (contact_id, tag_id)
      VALUES (new_contact_id, v_tag_id)
      ON CONFLICT DO NOTHING;
    END IF;

    IF _enqueue_automations AND form_record.organization_id IS NOT NULL THEN
      PERFORM public.enqueue_automations(
        form_record.organization_id,
        'form_submitted',
        new_contact_id,
        jsonb_build_object('form_id', form_record.id, 'form_name', form_record.name)
      );
    END IF;
  END IF;

  RETURN new_contact_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.process_form_submission_contact_and_tag(NEW.id, true, true);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_tag_added_automations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF current_setting('app.skip_automation', true) = 'true' THEN
    RETURN NEW;
  END IF;

  SELECT organization_id INTO v_org_id FROM public.contacts WHERE id = NEW.contact_id;

  PERFORM public.enqueue_automations(
    v_org_id,
    'tag_added',
    NEW.contact_id,
    jsonb_build_object('tag_id', NEW.tag_id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_tag_added_automations failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_form_submission_created ON public.form_submissions;
CREATE TRIGGER on_form_submission_created
AFTER INSERT ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_form_submission();

UPDATE public.forms f
SET submissions_count = COALESCE(s.total, 0)
FROM (
  SELECT forms.id, count(fs.id)::integer AS total
  FROM public.forms
  LEFT JOIN public.form_submissions fs ON fs.form_id = forms.id
  GROUP BY forms.id
) s
WHERE f.id = s.id;

DO $$
DECLARE
  r RECORD;
BEGIN
  PERFORM set_config('app.skip_automation', 'true', true);
  FOR r IN
    SELECT id FROM public.form_submissions ORDER BY created_at ASC
  LOOP
    PERFORM public.process_form_submission_contact_and_tag(r.id, false, false);
  END LOOP;
END $$;