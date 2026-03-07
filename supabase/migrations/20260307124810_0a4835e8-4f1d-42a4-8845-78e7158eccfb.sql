
-- 1. Conversion Goals
CREATE TABLE public.conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'event',
  target_event TEXT,
  target_value NUMERIC(12,2),
  current_value NUMERIC(12,2) DEFAULT 0,
  target_count INTEGER,
  current_count INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversion_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view goals" ON public.conversion_goals
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage goals" ON public.conversion_goals
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- 2. Goal Conversions (individual conversion events)
CREATE TABLE public.goal_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.conversion_goals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  value NUMERIC(12,2) DEFAULT 0,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversions" ON public.goal_conversions
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage conversions" ON public.goal_conversions
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- 3. Sales Routing Rules
CREATE TABLE public.sales_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'round_robin',
  conditions JSONB DEFAULT '{}',
  eligible_users TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  last_assigned_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view routing" ON public.sales_routing_rules
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Admins can manage routing" ON public.sales_routing_rules
  FOR ALL TO authenticated
  USING (public.is_org_admin(organization_id, auth.uid()))
  WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

-- 4. Win Probability Scores (cached per deal)
CREATE TABLE public.deal_win_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  win_probability NUMERIC(5,2) DEFAULT 50,
  factors JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_win_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view scores" ON public.deal_win_scores
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage scores" ON public.deal_win_scores
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));
