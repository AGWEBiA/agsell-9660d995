
-- SMS Credit Packages (pre-paid, regressive pricing like VoIP)
CREATE TABLE public.sms_credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  price_per_credit_cents NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  kiwify_checkout_url TEXT,
  kiwify_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS Credits per organization
CREATE TABLE public.sms_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- SMS Transactions (purchases and consumption)
CREATE TABLE public.sms_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'purchase',
  amount INTEGER NOT NULL,
  package_id UUID REFERENCES public.sms_credit_packages(id),
  payment_method TEXT,
  payment_reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS Campaigns
CREATE TABLE public.sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.sms_credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

-- Packages: readable by all authenticated
CREATE POLICY "Anyone can read active SMS packages" ON public.sms_credit_packages
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage SMS packages" ON public.sms_credit_packages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Credits: org members
CREATE POLICY "Org members can read SMS credits" ON public.sms_credits
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can manage SMS credits" ON public.sms_credits
  FOR ALL TO authenticated USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- Transactions: org members
CREATE POLICY "Org members can read SMS transactions" ON public.sms_transactions
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can insert SMS transactions" ON public.sms_transactions
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- Campaigns: org members CRUD
CREATE POLICY "Org members can manage SMS campaigns" ON public.sms_campaigns
  FOR ALL TO authenticated USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- Seed SMS credit packages (regressive pricing, 1 credit = 1 SMS)
INSERT INTO public.sms_credit_packages (name, credits, price_cents, price_per_credit_cents, sort_order) VALUES
  ('500 SMS', 500, 9900, 19.80, 1),
  ('1.000 SMS', 1000, 17900, 17.90, 2),
  ('2.500 SMS', 2500, 39900, 15.96, 3),
  ('5.000 SMS', 5000, 69900, 13.98, 4),
  ('10.000 SMS', 10000, 119900, 11.99, 5),
  ('25.000 SMS', 25000, 249900, 9.99, 6),
  ('50.000 SMS', 50000, 399900, 8.00, 7),
  ('100.000 SMS', 100000, 599900, 6.00, 8);
