CREATE OR REPLACE FUNCTION public.reprocess_scheduled_step(_step_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_step RECORD;
BEGIN
  SELECT * INTO v_step FROM public.automation_scheduled_steps WHERE id = _step_id;
  IF v_step IS NULL THEN
    RETURN jsonb_build_object('error', 'Step não encontrado');
  END IF;

  IF NOT (is_org_member(v_step.organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RETURN jsonb_build_object('error', 'Sem permissão');
  END IF;

  -- Atomic reset: only reset if currently stuck
  UPDATE public.automation_scheduled_steps
    SET status = 'pending', scheduled_at = LEAST(scheduled_at, now())
    WHERE id = _step_id
      AND status IN ('processing', 'error', 'failed');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Step não está travado (status atual: ' || v_step.status || ')');
  END IF;

  RETURN jsonb_build_object('success', true, 'step_id', _step_id);
END;
$$;