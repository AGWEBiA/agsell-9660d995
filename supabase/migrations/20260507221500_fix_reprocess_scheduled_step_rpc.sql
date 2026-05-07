ALTER TABLE public.automation_scheduled_steps
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.automation_scheduled_steps_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid REFERENCES public.automation_scheduled_steps(id) ON DELETE CASCADE,
  organization_id uuid,
  action text NOT NULL,
  status_before text,
  status_after text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_scheduled_steps_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view scheduled step audit" ON public.automation_scheduled_steps_audit;
CREATE POLICY "Org members can view scheduled step audit"
ON public.automation_scheduled_steps_audit
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_scheduled_steps_status_scheduled
  ON public.automation_scheduled_steps (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_steps_audit_step
  ON public.automation_scheduled_steps_audit (step_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.reprocess_scheduled_step(target_step_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_step record;
  v_allowed boolean := false;
  v_actor_role text := coalesce(auth.role(), '');
BEGIN
  SELECT id, organization_id, status, scheduled_at
    INTO v_step
  FROM public.automation_scheduled_steps
  WHERE id = target_step_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Step não encontrado');
  END IF;

  IF v_actor_role = 'service_role'
     OR has_role(auth.uid(), 'admin'::app_role)
     OR EXISTS (
       SELECT 1
       FROM public.organization_members om
       WHERE om.user_id = auth.uid()
         AND om.organization_id = v_step.organization_id
     ) THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para reprocessar este step');
  END IF;

  UPDATE public.automation_scheduled_steps
  SET status = 'pending',
      scheduled_at = LEAST(v_step.scheduled_at, now()),
      retry_count = coalesce(retry_count, 0) + 1,
      last_error = null,
      updated_at = now()
  WHERE id = target_step_id
    AND status IN ('processing', 'error', 'failed', 'pending');

  INSERT INTO public.automation_scheduled_steps_audit (
    step_id,
    organization_id,
    action,
    status_before,
    status_after,
    error_message
  ) VALUES (
    target_step_id,
    v_step.organization_id,
    'reprocess',
    v_step.status,
    'pending',
    null
  );

  RETURN jsonb_build_object('success', true, 'step_id', target_step_id, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.reprocess_scheduled_step(uuid) TO authenticated, service_role;
