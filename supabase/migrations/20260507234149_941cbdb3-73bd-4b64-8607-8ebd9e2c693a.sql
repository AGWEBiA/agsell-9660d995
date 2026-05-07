-- Replace enqueue_group_automations to also log to audit_logs
CREATE OR REPLACE FUNCTION public.enqueue_group_automations(v_org_id uuid, v_trigger_type text, v_group_id uuid, v_tag_name text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  auto_rec RECORD;
  v_execution_id uuid;
  v_actions jsonb;
  v_enqueued int := 0;
  v_trigger_data jsonb;
  v_execution_ids uuid[] := ARRAY[]::uuid[];
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
    v_execution_ids := array_append(v_execution_ids, v_execution_id);
  END LOOP;

  -- Audit log entry (one per trigger event, lists all triggered execution IDs)
  BEGIN
    INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details)
    VALUES (
      v_org_id, NULL, v_trigger_type, 'whatsapp_group', v_group_id::text,
      jsonb_build_object(
        'group_id', v_group_id,
        'tag_name', v_tag_name,
        'enqueued_count', v_enqueued,
        'execution_ids', to_jsonb(v_execution_ids)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'audit_logs insert failed: %', SQLERRM;
  END;

  RETURN v_enqueued;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_group_automations failed: %', SQLERRM;
  RETURN v_enqueued;
END;
$function$;

-- Test RPC: simulate a group tag trigger and return enqueued count + execution ids
CREATE OR REPLACE FUNCTION public.simulate_group_tag_trigger(
  _org_id uuid,
  _group_id uuid,
  _tag_name text,
  _trigger_type text DEFAULT 'group_tag_added'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_enqueued int;
  v_executions jsonb;
BEGIN
  IF NOT (is_org_admin(_org_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF _trigger_type NOT IN ('group_tag_added', 'group_tag_removed') THEN
    RAISE EXCEPTION 'Invalid trigger_type';
  END IF;

  SELECT public.enqueue_group_automations(_org_id, _trigger_type, _group_id, _tag_name)
    INTO v_enqueued;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'execution_id', e.id,
    'automation_id', e.automation_id,
    'automation_name', a.name,
    'status', e.status,
    'created_at', e.created_at,
    'trigger_data', e.trigger_data
  ) ORDER BY e.created_at DESC), '[]'::jsonb)
  INTO v_executions
  FROM public.automation_executions e
  LEFT JOIN public.automations a ON a.id = e.automation_id
  WHERE e.organization_id = _org_id
    AND e.trigger_event = _trigger_type
    AND e.trigger_data->>'group_id' = _group_id::text
    AND e.created_at > now() - interval '5 minutes';

  RETURN jsonb_build_object(
    'enqueued_count', v_enqueued,
    'executions', v_executions,
    'simulated_at', now()
  );
END;
$$;

-- List recent group-trigger executions for inspection
CREATE OR REPLACE FUNCTION public.list_group_trigger_executions(
  _org_id uuid,
  _group_id uuid DEFAULT NULL,
  _limit int DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (is_org_member(_org_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'execution_id', e.id,
    'automation_id', e.automation_id,
    'automation_name', a.name,
    'trigger_event', e.trigger_event,
    'status', e.status,
    'current_step', e.current_step,
    'total_steps', e.total_steps,
    'trigger_data', e.trigger_data,
    'created_at', e.created_at,
    'completed_at', e.completed_at,
    'error_message', e.error_message
  ) ORDER BY e.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM public.automation_executions e
  LEFT JOIN public.automations a ON a.id = e.automation_id
  WHERE e.organization_id = _org_id
    AND e.trigger_event IN ('group_tag_added', 'group_tag_removed')
    AND (_group_id IS NULL OR e.trigger_data->>'group_id' = _group_id::text)
  ORDER BY e.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;