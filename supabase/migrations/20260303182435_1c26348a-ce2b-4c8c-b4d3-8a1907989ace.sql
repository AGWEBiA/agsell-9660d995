
CREATE TABLE public.checkout_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  billing_cycle text DEFAULT 'monthly',
  stripe_customer_id text,
  stripe_session_id text,
  converted boolean DEFAULT false,
  converted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  organization_name text,
  source text DEFAULT 'landing_page',
  status text DEFAULT 'started'
);

ALTER TABLE public.checkout_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global admins can manage checkout leads"
  ON public.checkout_leads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org members can view their checkout leads"
  ON public.checkout_leads FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE INDEX idx_checkout_leads_email ON public.checkout_leads(email);
CREATE INDEX idx_checkout_leads_status ON public.checkout_leads(status);
