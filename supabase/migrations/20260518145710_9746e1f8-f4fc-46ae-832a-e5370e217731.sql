
-- Sandbox Executions
CREATE TABLE public.sandbox_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  automation_id uuid NOT NULL,
  automation_type text NOT NULL CHECK (automation_type IN ('flow','automation','sequence','campaign')),
  test_phone text,
  test_contact_id uuid,
  test_variables jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed','cancelled')),
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  triggered_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sandbox_executions_org_automation ON public.sandbox_executions(organization_id, automation_id, started_at DESC);
CREATE INDEX idx_sandbox_executions_status ON public.sandbox_executions(status) WHERE status = 'running';

ALTER TABLE public.sandbox_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sandbox executions"
  ON public.sandbox_executions FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can create sandbox executions"
  ON public.sandbox_executions FOR INSERT
  WITH CHECK (is_org_member(organization_id, auth.uid()) AND triggered_by = auth.uid());

CREATE POLICY "Members can update sandbox executions"
  ON public.sandbox_executions FOR UPDATE
  USING (is_org_member(organization_id, auth.uid()));

-- Sandbox Step Logs
CREATE TABLE public.sandbox_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.sandbox_executions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  node_id text NOT NULL,
  node_type text NOT NULL,
  node_label text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','success','error','skipped')),
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  error_message text,
  duration_ms integer,
  step_order integer NOT NULL DEFAULT 0,
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sandbox_step_logs_execution ON public.sandbox_step_logs(execution_id, step_order);

ALTER TABLE public.sandbox_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sandbox step logs"
  ON public.sandbox_step_logs FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Service role can manage sandbox step logs"
  ON public.sandbox_step_logs FOR ALL
  USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sandbox_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sandbox_step_logs;
ALTER TABLE public.sandbox_executions REPLICA IDENTITY FULL;
ALTER TABLE public.sandbox_step_logs REPLICA IDENTITY FULL;

-- Lifecycle status
ALTER TABLE public.whatsapp_flows ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'draft'
  CHECK (lifecycle_status IN ('draft','testing','pending_approval','approved','published'));
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'draft'
  CHECK (lifecycle_status IN ('draft','testing','pending_approval','approved','published'));
ALTER TABLE public.sequences ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'draft'
  CHECK (lifecycle_status IN ('draft','testing','pending_approval','approved','published'));

-- Test contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_contacts_is_test ON public.contacts(organization_id, is_test) WHERE is_test = true;
