-- 1. Ensure column exists
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS show_in_pricing BOOLEAN DEFAULT true;

-- 2. Update the public view with exact column list to match original order/structure
CREATE OR REPLACE VIEW public.plans_public AS
SELECT 
    id,
    name,
    slug,
    description,
    price_monthly,
    price_yearly,
    max_users,
    max_contacts,
    max_emails_per_month,
    max_whatsapp_messages,
    max_automations,
    max_forms,
    max_ai_requests_per_month,
    max_email_domains,
    max_instagram_accounts,
    features,
    is_active,
    is_default,
    created_at,
    updated_at,
    show_in_pricing
FROM public.plans
WHERE is_active = true AND show_in_pricing = true;

-- 3. Mark legacy plan to be hidden from pricing
UPDATE public.plans SET show_in_pricing = false WHERE slug = 'vip-professional';

-- 4. Update RLS policies for the base table to allow visibility of active legacy plans
-- This is critical so the user's session can load the plan data even if it's hidden from pricing
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON public.plans;

CREATE POLICY "Anyone can view active plans" 
ON public.plans 
FOR SELECT 
USING (is_active = true);
