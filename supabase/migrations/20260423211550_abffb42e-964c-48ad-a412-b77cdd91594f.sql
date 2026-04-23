-- Update handle_form_submission to also apply a tag from form settings
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

  -- Apply tag from form settings (tag_id existing, or tag_name to find/create)
  v_tag_id := NULL;
  IF v_settings ? 'tag_id' AND NULLIF(v_settings->>'tag_id', '') IS NOT NULL THEN
    BEGIN
      v_tag_id := (v_settings->>'tag_id')::uuid;
      -- Validate tag belongs to org
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

  UPDATE public.form_submissions SET contact_id = new_contact_id WHERE id = NEW.id;
  RETURN NEW;
END;
$function$;