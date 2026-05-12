CREATE OR REPLACE FUNCTION public.enqueue_group_automations(
  v_org_id uuid,
  v_trigger_type text,
  v_group_id uuid,
  v_tag_name text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  auto_rec RECORD;
  v_execution_id uuid;
  v_actions jsonb;
  v_enqueued int := 0;
  v_trigger_data jsonb;
  v_target_ids jsonb;
BEGIN
  IF v_org_id IS NULL OR v_trigger_type IS NULL OR v_group_id IS NULL THEN
    RETURN 0;
  END IF;

  v_trigger_data := jsonb_build_object('group_id', v_group_id, 'tag_name', v_tag_name);

  FOR auto_rec IN
    SELECT a.id, a.actions, a.trigger_config
    FROM public.automations a
    WHERE a.is_active = true
      AND a.trigger_type = v_trigger_type
      AND a.organization_id = v_org_id
      AND (
        v_tag_name IS NULL
        OR COALESCE(NULLIF(btrim(a.trigger_config->>'tag_name'), ''), '') = ''
        OR lower(btrim(a.trigger_config->>'tag_name')) = lower(btrim(v_tag_name))
      )
  LOOP
    -- Filter by target_group_ids when configured (jsonb array of group UUIDs)
    v_target_ids := auto_rec.trigger_config->'target_group_ids';
    IF v_target_ids IS NOT NULL
       AND jsonb_typeof(v_target_ids) = 'array'
       AND jsonb_array_length(v_target_ids) > 0
       AND NOT (v_target_ids @> to_jsonb(v_group_id::text))
    THEN
      CONTINUE;
    END IF;

    v_actions := COALESCE(auto_rec.actions, '[]'::jsonb);
    IF jsonb_array_length(v_actions) = 0 THEN CONTINUE; END IF;

    INSERT INTO public.automation_executions (
      automation_id, contact_id, trigger_event, status, total_steps, current_step, organization_id, trigger_data
    ) VALUES (
      auto_rec.id, NULL, v_trigger_type, 'pending',
      jsonb_array_length(v_actions), 0, v_org_id, v_trigger_data
    )
    RETURNING id INTO v_execution_id;

    INSERT INTO public.automation_scheduled_steps (
      automation_id, execution_id, contact_id, organization_id,
      current_step, scheduled_at, status, actions, trigger_data
    ) VALUES (
      auto_rec.id, v_execution_id, NULL, v_org_id,
      0, now(), 'pending', v_actions, v_trigger_data
    );

    UPDATE public.automations
       SET executions_count = COALESCE(executions_count, 0) + 1
     WHERE id = auto_rec.id;

    v_enqueued := v_enqueued + 1;
  END LOOP;

  RETURN v_enqueued;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_group_automations failed: %', SQLERRM;
  RETURN v_enqueued;
END;
$$;