
-- 1. Restrict instagram_accounts base table SELECT to org admins only
DROP POLICY IF EXISTS "Org members can view instagram accounts" ON public.instagram_accounts;
CREATE POLICY "Only org admins can view instagram accounts base table"
  ON public.instagram_accounts
  FOR SELECT
  TO authenticated
  USING (
    is_org_admin(organization_id, auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. Create a public-facing view for plans without internal payment IDs
CREATE OR REPLACE VIEW public.plans_public AS
SELECT 
  id, name, slug, description, price_monthly, price_yearly,
  max_users, max_contacts, max_emails_per_month, max_whatsapp_messages,
  max_automations, max_forms, max_ai_requests_per_month, max_email_domains,
  max_instagram_accounts, features, is_active, is_default, created_at, updated_at
FROM public.plans
WHERE is_active = true;

-- 3. Grant access to plans_public view
GRANT SELECT ON public.plans_public TO anon, authenticated;

-- 4. Create automation_scheduled_steps table for real delays
CREATE TABLE IF NOT EXISTS public.automation_scheduled_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  execution_id uuid NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  actions jsonb NOT NULL DEFAULT '[]',
  auth_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_scheduled_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled steps"
  ON public.automation_scheduled_steps
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE INDEX IF NOT EXISTS idx_scheduled_steps_pending 
  ON public.automation_scheduled_steps (scheduled_at) 
  WHERE status = 'pending';
