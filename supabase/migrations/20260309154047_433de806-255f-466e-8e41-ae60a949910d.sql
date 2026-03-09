
-- 1. Audit Logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Security Alerts table
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  metadata jsonb,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_alerts_org ON public.security_alerts(organization_id, created_at DESC);
CREATE INDEX idx_security_alerts_unresolved ON public.security_alerts(organization_id, is_resolved) WHERE NOT is_resolved;

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view security alerts"
  ON public.security_alerts FOR SELECT TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert security alerts"
  ON public.security_alerts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Org admins can update security alerts"
  ON public.security_alerts FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _org_id uuid,
  _action text,
  _resource_type text,
  _resource_id text DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details)
  VALUES (_org_id, auth.uid(), _action, _resource_type, _resource_id, _details);
END;
$$;

-- 4. Function to create security alert
CREATE OR REPLACE FUNCTION public.create_security_alert(
  _org_id uuid,
  _alert_type text,
  _severity text,
  _title text,
  _description text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_alerts (organization_id, user_id, alert_type, severity, title, description, metadata)
  VALUES (_org_id, auth.uid(), _alert_type, _severity, _title, _description, _metadata);
END;
$$;
