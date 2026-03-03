
-- Function to handle form submission: increment count + auto-create contact
CREATE OR REPLACE FUNCTION public.handle_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  form_record RECORD;
  contact_first_name TEXT;
  contact_email TEXT;
  contact_phone TEXT;
  contact_whatsapp TEXT;
  new_contact_id UUID;
  submission_data JSONB;
BEGIN
  -- Increment submissions count
  UPDATE public.forms SET submissions_count = COALESCE(submissions_count, 0) + 1 WHERE id = NEW.form_id;

  -- Get form info (organization_id, user_id)
  SELECT user_id, organization_id INTO form_record FROM public.forms WHERE id = NEW.form_id;

  IF form_record IS NULL THEN
    RETURN NEW;
  END IF;

  submission_data := NEW.data;

  -- Extract contact fields from submission data (try common field names)
  contact_first_name := COALESCE(
    submission_data->>'nome',
    submission_data->>'name',
    submission_data->>'first_name',
    submission_data->>'Nome',
    submission_data->>'Nome completo',
    submission_data->>'nome_completo'
  );

  contact_email := COALESCE(
    submission_data->>'email',
    submission_data->>'Email',
    submission_data->>'e-mail',
    submission_data->>'E-mail'
  );

  contact_phone := COALESCE(
    submission_data->>'telefone',
    submission_data->>'phone',
    submission_data->>'Telefone',
    submission_data->>'Phone',
    submission_data->>'celular',
    submission_data->>'Celular'
  );

  contact_whatsapp := COALESCE(
    submission_data->>'whatsapp',
    submission_data->>'WhatsApp',
    submission_data->>'Whatsapp'
  );

  -- Only create contact if we have at least a name
  IF contact_first_name IS NOT NULL AND contact_first_name != '' THEN
    -- Check if contact already exists by email in the same org
    IF contact_email IS NOT NULL AND contact_email != '' THEN
      SELECT id INTO new_contact_id 
      FROM public.contacts 
      WHERE email = contact_email 
        AND organization_id = form_record.organization_id
      LIMIT 1;
    END IF;

    -- Create contact if not found
    IF new_contact_id IS NULL THEN
      INSERT INTO public.contacts (
        first_name, email, phone, whatsapp, 
        user_id, organization_id, source
      ) VALUES (
        contact_first_name, 
        NULLIF(contact_email, ''), 
        NULLIF(COALESCE(contact_phone, contact_whatsapp), ''),
        NULLIF(contact_whatsapp, ''),
        form_record.user_id, 
        form_record.organization_id, 
        'formulario'
      )
      RETURNING id INTO new_contact_id;
    END IF;

    -- Link submission to contact
    UPDATE public.form_submissions SET contact_id = new_contact_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_form_submission_created
AFTER INSERT ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_form_submission();
