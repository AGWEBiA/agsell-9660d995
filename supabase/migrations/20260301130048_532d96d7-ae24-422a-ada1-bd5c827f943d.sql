
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_ai_requests_per_month integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.plans.max_ai_requests_per_month IS 'Maximum AI chat/assistant requests per month per organization. -1 = unlimited, 0 = disabled';

-- Update plans with revised pricing, limits and AI quotas for 500%+ margin
-- Cost analysis per plan (estimated monthly):
-- Email: ~R$0.0005/email (SES), WhatsApp: ~R$0.02/msg (Evolution API), AI: ~R$0.03/request (Gemini Flash), Infra: ~R$5-15/org

-- Starter: Cost ~R$20 → Price R$197 → Margin ~10x ✓
UPDATE public.plans SET 
  price_monthly = 197,
  price_yearly = 1970,
  max_users = 2,
  max_contacts = 500,
  max_emails_per_month = 2000,
  max_whatsapp_messages = 200,
  max_automations = 5,
  max_forms = 3,
  max_ai_requests_per_month = 100
WHERE slug = 'starter';

-- Professional: Cost ~R$55 → Price R$397 → Margin ~7x ✓
UPDATE public.plans SET 
  price_monthly = 397,
  price_yearly = 3970,
  max_users = 5,
  max_contacts = 5000,
  max_emails_per_month = 10000,
  max_whatsapp_messages = 1000,
  max_automations = 20,
  max_forms = 10,
  max_ai_requests_per_month = 500
WHERE slug = 'professional';

-- Enterprise: Cost ~R$130 → Price R$797 → Margin ~6x ✓
UPDATE public.plans SET 
  price_monthly = 797,
  price_yearly = 7970,
  max_users = 20,
  max_contacts = 25000,
  max_emails_per_month = 50000,
  max_whatsapp_messages = 5000,
  max_automations = 100,
  max_forms = 50,
  max_ai_requests_per_month = 2000
WHERE slug = 'enterprise';

-- Agência: Cost ~R$180 → Price R$997 → Margin ~5.5x ✓
UPDATE public.plans SET 
  price_monthly = 997,
  price_yearly = 9970,
  max_users = -1,
  max_contacts = -1,
  max_emails_per_month = 100000,
  max_whatsapp_messages = 10000,
  max_automations = -1,
  max_forms = -1,
  max_ai_requests_per_month = 5000
WHERE slug = 'agencia';

-- Free plan (inactive) - update AI limit
UPDATE public.plans SET max_ai_requests_per_month = 10 WHERE slug = 'free';
