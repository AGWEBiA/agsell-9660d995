
-- Function to process import jobs entirely in PostgreSQL (no HTTP overhead)
CREATE OR REPLACE FUNCTION public.process_import_job(_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  job_record RECORD;
  row_data jsonb;
  field_map jsonb;
  import_tag text;
  contact_rec RECORD;
  tag_rec RECORD;
  v_first_name text;
  v_last_name text;
  v_email text;
  v_phone text;
  v_whatsapp text;
  v_position text;
  v_source text;
  v_status text;
  v_notes text;
  v_tags_str text;
  csv_field text;
  contact_field text;
  raw_val text;
  new_contact_id uuid;
  tag_id uuid;
  tag_name text;
  tag_names text[];
  success_count int := 0;
  error_count int := 0;
  total_rows int;
  i int := 0;
  err_details jsonb := '[]'::jsonb;
BEGIN
  -- Fetch and lock the job
  SELECT * INTO job_record FROM import_jobs WHERE id = _job_id FOR UPDATE;
  IF job_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Job não encontrado');
  END IF;
  IF job_record.status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object('error', 'Job já finalizado');
  END IF;

  UPDATE import_jobs SET status = 'processing' WHERE id = _job_id;

  field_map := job_record.field_mapping;
  total_rows := jsonb_array_length(COALESCE(job_record.import_data, '[]'::jsonb));

  -- Pre-create import tags
  IF job_record.import_tags IS NOT NULL THEN
    FOREACH import_tag IN ARRAY job_record.import_tags
    LOOP
      IF import_tag IS NOT NULL AND btrim(import_tag) <> '' THEN
        INSERT INTO tags (name, color, user_id, organization_id)
        VALUES (
          btrim(import_tag),
          '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),
          job_record.user_id,
          job_record.organization_id
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- Process each row
  FOR i IN 0..(total_rows - 1)
  LOOP
    row_data := job_record.import_data->i;

    -- Reset fields
    v_first_name := NULL; v_last_name := NULL; v_email := NULL;
    v_phone := NULL; v_whatsapp := NULL; v_position := NULL;
    v_source := NULL; v_status := NULL; v_notes := NULL; v_tags_str := NULL;

    -- Map fields from CSV columns
    FOR csv_field, contact_field IN SELECT key, value#>>'{}'  FROM jsonb_each(field_map)
    LOOP
      IF contact_field IS NULL OR contact_field = 'ignore' THEN CONTINUE; END IF;
      raw_val := btrim(COALESCE(row_data->>csv_field, ''));
      IF raw_val = '' THEN CONTINUE; END IF;

      CASE contact_field
        WHEN 'first_name' THEN v_first_name := raw_val;
        WHEN 'last_name' THEN v_last_name := raw_val;
        WHEN 'email' THEN v_email := raw_val;
        WHEN 'phone' THEN v_phone := raw_val;
        WHEN 'whatsapp' THEN v_whatsapp := raw_val;
        WHEN 'position' THEN v_position := raw_val;
        WHEN 'source' THEN v_source := raw_val;
        WHEN 'status' THEN v_status := raw_val;
        WHEN 'notes' THEN v_notes := raw_val;
        WHEN 'tags' THEN v_tags_str := raw_val;
        ELSE NULL;
      END CASE;
    END LOOP;

    -- Validate
    IF v_first_name IS NULL OR btrim(v_first_name) = '' THEN
      error_count := error_count + 1;
      CONTINUE;
    END IF;

    -- Insert contact
    BEGIN
      INSERT INTO contacts (first_name, last_name, email, phone, whatsapp, position, source, status, notes, user_id, organization_id)
      VALUES (v_first_name, v_last_name, v_email, v_phone, v_whatsapp, v_position, v_source, v_status, v_notes, job_record.user_id, job_record.organization_id)
      RETURNING id INTO new_contact_id;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      CONTINUE;
    END;

    -- Collect all tag names (from CSV tags column + import_tags)
    tag_names := '{}';
    IF v_tags_str IS NOT NULL AND btrim(v_tags_str) <> '' THEN
      tag_names := string_to_array(v_tags_str, ',');
    END IF;
    IF job_record.import_tags IS NOT NULL THEN
      tag_names := tag_names || job_record.import_tags;
    END IF;

    -- Assign tags
    FOREACH tag_name IN ARRAY tag_names
    LOOP
      tag_name := btrim(tag_name);
      IF tag_name = '' THEN CONTINUE; END IF;

      -- Find or create tag
      SELECT id INTO tag_rec FROM tags
        WHERE name = tag_name AND organization_id = job_record.organization_id
        LIMIT 1;

      IF tag_rec.id IS NULL THEN
        INSERT INTO tags (name, color, user_id, organization_id)
        VALUES (tag_name, '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'), job_record.user_id, job_record.organization_id)
        ON CONFLICT DO NOTHING
        RETURNING id INTO tag_id;

        IF tag_id IS NULL THEN
          SELECT id INTO tag_id FROM tags WHERE name = tag_name AND organization_id = job_record.organization_id LIMIT 1;
        END IF;
      ELSE
        tag_id := tag_rec.id;
      END IF;

      IF tag_id IS NOT NULL THEN
        INSERT INTO contact_tags (contact_id, tag_id) VALUES (new_contact_id, tag_id) ON CONFLICT DO NOTHING;
      END IF;

      tag_id := NULL;
      tag_rec := NULL;
    END LOOP;

    success_count := success_count + 1;

    -- Update progress every 500 rows
    IF (i + 1) % 500 = 0 THEN
      UPDATE import_jobs SET processed_rows = i + 1, success_count = success_count, error_count = error_count WHERE id = _job_id;
    END IF;
  END LOOP;

  -- Final update
  UPDATE import_jobs SET
    processed_rows = total_rows,
    success_count = success_count,
    error_count = error_count,
    status = 'completed',
    completed_at = now(),
    import_data = '[]'::jsonb  -- Clear data to save space
  WHERE id = _job_id;

  RETURN jsonb_build_object('success_count', success_count, 'error_count', error_count, 'total', total_rows);
END;
$$;
