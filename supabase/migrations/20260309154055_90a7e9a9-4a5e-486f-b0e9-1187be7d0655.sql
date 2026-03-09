
DROP POLICY "System can insert security alerts" ON public.security_alerts;

CREATE POLICY "Members can insert security alerts"
  ON public.security_alerts FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IS NOT NULL 
    AND public.is_org_member(organization_id, auth.uid())
  );
