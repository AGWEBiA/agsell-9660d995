
-- ============================================
-- A/B Testing
-- ============================================
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  variant_a JSONB NOT NULL DEFAULT '{"message": ""}',
  variant_b JSONB NOT NULL DEFAULT '{"message": ""}',
  sent_a INTEGER DEFAULT 0,
  sent_b INTEGER DEFAULT 0,
  responses_a INTEGER DEFAULT 0,
  responses_b INTEGER DEFAULT 0,
  conversion_a INTEGER DEFAULT 0,
  conversion_b INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  winner TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ab tests" ON ab_tests FOR ALL USING (is_org_admin(organization_id, auth.uid()));
CREATE POLICY "Members can view ab tests" ON ab_tests FOR SELECT USING (is_org_member(organization_id, auth.uid()));

-- ============================================
-- Growth Tools
-- ============================================
CREATE TABLE public.growth_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  tool_type TEXT NOT NULL DEFAULT 'link',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  config JSONB NOT NULL DEFAULT '{}',
  phone_number TEXT,
  prefilled_message TEXT,
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.growth_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage growth tools" ON growth_tools FOR ALL USING (is_org_admin(organization_id, auth.uid()));
CREATE POLICY "Members can view growth tools" ON growth_tools FOR SELECT USING (is_org_member(organization_id, auth.uid()));

-- ============================================
-- Sequences / Drip Campaigns
-- ============================================
CREATE TABLE public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage sequences" ON sequences FOR ALL USING (is_org_admin(organization_id, auth.uid()));
CREATE POLICY "Members can view sequences" ON sequences FOR SELECT USING (is_org_member(organization_id, auth.uid()));

CREATE TABLE public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL DEFAULT 'send_message',
  delay_minutes INTEGER DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  condition_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage via sequence" ON sequence_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM sequences s WHERE s.id = sequence_steps.sequence_id AND is_org_admin(s.organization_id, auth.uid()))
);
CREATE POLICY "View via sequence" ON sequence_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM sequences s WHERE s.id = sequence_steps.sequence_id AND is_org_member(s.organization_id, auth.uid()))
);

CREATE TABLE public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_step_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage enrollment via sequence" ON sequence_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM sequences s WHERE s.id = sequence_enrollments.sequence_id AND is_org_admin(s.organization_id, auth.uid()))
);
CREATE POLICY "View enrollment via sequence" ON sequence_enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM sequences s WHERE s.id = sequence_enrollments.sequence_id AND is_org_member(s.organization_id, auth.uid()))
);

-- ============================================
-- Telegram Bots
-- ============================================
CREATE TABLE public.telegram_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  bot_username TEXT,
  is_active BOOLEAN DEFAULT false,
  webhook_configured BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage telegram bots" ON telegram_bots FOR ALL USING (is_org_admin(organization_id, auth.uid()));
CREATE POLICY "Members can view telegram bots" ON telegram_bots FOR SELECT USING (is_org_member(organization_id, auth.uid()));

-- ============================================
-- SMS Config
-- ============================================
CREATE TABLE public.sms_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  provider TEXT NOT NULL DEFAULT 'twilio',
  from_number TEXT,
  is_active BOOLEAN DEFAULT false,
  messages_sent INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sms_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage sms configs" ON sms_configs FOR ALL USING (is_org_admin(organization_id, auth.uid()));
CREATE POLICY "Members can view sms configs" ON sms_configs FOR SELECT USING (is_org_member(organization_id, auth.uid()));

-- ============================================
-- Shopify Integrations
-- ============================================
CREATE TABLE public.shopify_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  shop_domain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  webhook_events TEXT[] DEFAULT '{}',
  orders_synced INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shopify_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage shopify" ON shopify_integrations FOR ALL USING (is_org_admin(organization_id, auth.uid()));
CREATE POLICY "Members can view shopify" ON shopify_integrations FOR SELECT USING (is_org_member(organization_id, auth.uid()));
