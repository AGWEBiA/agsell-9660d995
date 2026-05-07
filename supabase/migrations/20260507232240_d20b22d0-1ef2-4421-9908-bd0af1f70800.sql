-- 1) Add trigger_data jsonb to executions + scheduled_steps for carrying entity context (group_id, tag_name, etc.)
ALTER TABLE public.automation_executions
  ADD COLUMN IF NOT EXISTS trigger_data jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.automation_scheduled_steps
  ADD COLUMN IF NOT EXISTS trigger_data jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) RPC: enqueue automations for a WhatsApp group event (tag added/removed on the group itself)
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
  END LOOP;

  RETURN v_enqueued;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_group_automations failed: %', SQLERRM;
  RETURN v_enqueued;
END;
$$;

-- 3) AFTER UPDATE trigger on whatsapp_groups.tags: detect added/removed and enqueue
CREATE OR REPLACE FUNCTION public.handle_whatsapp_group_tags_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  added text[];
  removed text[];
  t text;
BEGIN
  IF NEW.tags IS NOT DISTINCT FROM OLD.tags THEN
    RETURN NEW;
  END IF;

  -- Compute differences (treat NULL as empty)
  added := ARRAY(SELECT unnest(COALESCE(NEW.tags, '{}'::text[])) EXCEPT SELECT unnest(COALESCE(OLD.tags, '{}'::text[])));
  removed := ARRAY(SELECT unnest(COALESCE(OLD.tags, '{}'::text[])) EXCEPT SELECT unnest(COALESCE(NEW.tags, '{}'::text[])));

  IF added IS NOT NULL THEN
    FOREACH t IN ARRAY added LOOP
      PERFORM public.enqueue_group_automations(NEW.organization_id, 'group_tag_added', NEW.id, t);
    END LOOP;
  END IF;

  IF removed IS NOT NULL THEN
    FOREACH t IN ARRAY removed LOOP
      PERFORM public.enqueue_group_automations(NEW.organization_id, 'group_tag_removed', NEW.id, t);
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_whatsapp_group_tags_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_group_tags_change ON public.whatsapp_groups;
CREATE TRIGGER trg_whatsapp_group_tags_change
AFTER UPDATE OF tags ON public.whatsapp_groups
FOR EACH ROW EXECUTE FUNCTION public.handle_whatsapp_group_tags_change();

-- Also fire when a group is inserted with tags already set (rare, but consistent)
CREATE OR REPLACE FUNCTION public.handle_whatsapp_group_tags_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t text;
BEGIN
  IF NEW.tags IS NULL OR array_length(NEW.tags, 1) IS NULL THEN
    RETURN NEW;
  END IF;
  FOREACH t IN ARRAY NEW.tags LOOP
    PERFORM public.enqueue_group_automations(NEW.organization_id, 'group_tag_added', NEW.id, t);
  END LOOP;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_whatsapp_group_tags_insert failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_group_tags_insert ON public.whatsapp_groups;
CREATE TRIGGER trg_whatsapp_group_tags_insert
AFTER INSERT ON public.whatsapp_groups
FOR EACH ROW EXECUTE FUNCTION public.handle_whatsapp_group_tags_insert();