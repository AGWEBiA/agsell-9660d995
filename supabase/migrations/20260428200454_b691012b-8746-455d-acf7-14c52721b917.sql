CREATE TABLE IF NOT EXISTS public.api_webhook_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'API Webhook',
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read own webhook subs"
ON public.api_webhook_subscriptions FOR SELECT
USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "org admins manage webhook subs"
ON public.api_webhook_subscriptions FOR ALL
USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_api_webhook_subs_org ON public.api_webhook_subscriptions(organization_id);

CREATE TRIGGER update_api_webhook_subs_updated_at
BEFORE UPDATE ON public.api_webhook_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();