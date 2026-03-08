
-- Pacotes de créditos VoIP configuráveis pelo admin
CREATE TABLE public.voip_credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  price_per_credit_cents NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saldo de créditos VoIP por organização
CREATE TABLE public.voip_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Transações de créditos (compras e consumo)
CREATE TABLE public.voip_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'purchase',
  amount INTEGER NOT NULL,
  package_id UUID REFERENCES public.voip_credit_packages(id),
  payment_method TEXT,
  payment_reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Registro de chamadas
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL DEFAULT 'initiated',
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  notes TEXT,
  credits_used INTEGER DEFAULT 0,
  metadata JSONB,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.voip_credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voip_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Pacotes: todos autenticados podem ler, admins globais podem gerenciar
CREATE POLICY "Anyone can view active packages" ON public.voip_credit_packages
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Global admins manage packages" ON public.voip_credit_packages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Créditos: membros da org podem ler
CREATE POLICY "Org members view credits" ON public.voip_credits
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "System manages credits" ON public.voip_credits
  FOR ALL TO authenticated USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

-- Transações: membros da org podem ler, admins inserem
CREATE POLICY "Org members view transactions" ON public.voip_transactions
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins insert transactions" ON public.voip_transactions
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

-- Calls: membros da org
CREATE POLICY "Org members view calls" ON public.calls
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members insert calls" ON public.calls
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members update own calls" ON public.calls
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Índices
CREATE INDEX idx_voip_credits_org ON public.voip_credits(organization_id);
CREATE INDEX idx_voip_transactions_org ON public.voip_transactions(organization_id);
CREATE INDEX idx_calls_org ON public.calls(organization_id);
CREATE INDEX idx_calls_contact ON public.calls(contact_id);

-- Seed pacotes padrão (modelo Clint)
INSERT INTO public.voip_credit_packages (name, credits, price_cents, price_per_credit_cents, sort_order) VALUES
  ('100 créditos', 100, 3500, 35, 1),
  ('500 créditos', 500, 15000, 30, 2),
  ('1.000 créditos', 1000, 22000, 22, 3),
  ('5.000 créditos', 5000, 100000, 20, 4),
  ('10.000 créditos', 10000, 150000, 15, 5),
  ('20.000 créditos', 20000, 280000, 14, 6),
  ('50.000 créditos', 50000, 650000, 13, 7),
  ('100.000 créditos', 100000, 1200000, 12, 8);
