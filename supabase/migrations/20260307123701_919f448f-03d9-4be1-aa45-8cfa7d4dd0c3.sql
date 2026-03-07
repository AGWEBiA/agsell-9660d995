
-- 1. Contact Preferences (Global Opt-out Management)
CREATE TABLE public.contact_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  opted_out BOOLEAN NOT NULL DEFAULT false,
  opted_out_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id, channel)
);

ALTER TABLE public.contact_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view contact preferences" ON public.contact_preferences
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage contact preferences" ON public.contact_preferences
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- 2. Site Events (Event Tracking)
CREATE TABLE public.site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  visitor_id TEXT,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view site events" ON public.site_events
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Anon can insert site events" ON public.site_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 3. Site Tracking Sessions
CREATE TABLE public.site_tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  pages_visited JSONB DEFAULT '[]',
  first_page TEXT,
  last_page TEXT,
  duration_seconds INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tracking sessions" ON public.site_tracking_sessions
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Anon can insert tracking sessions" ON public.site_tracking_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update tracking sessions" ON public.site_tracking_sessions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Sentiment Analysis
CREATE TABLE public.sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id UUID,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  confidence NUMERIC(4,3) DEFAULT 0.5,
  keywords TEXT[],
  summary TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sentiment" ON public.sentiment_analysis
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage sentiment" ON public.sentiment_analysis
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- 5. Attribution Touchpoints
CREATE TABLE public.attribution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  campaign_name TEXT,
  campaign_id UUID,
  touchpoint_type TEXT DEFAULT 'interaction',
  revenue_attributed NUMERIC(12,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attribution_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view attribution" ON public.attribution_touchpoints
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage attribution" ON public.attribution_touchpoints
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- 6. Landing Pages
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  custom_css TEXT,
  custom_js TEXT,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  visits_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view landing pages" ON public.landing_pages
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage landing pages" ON public.landing_pages
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- Public access for published landing pages
CREATE POLICY "Public can view published landing pages" ON public.landing_pages
  FOR SELECT TO anon
  USING (is_published = true);

-- 7. Predictive Send Data
CREATE TABLE public.predictive_send_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  best_hour_email INTEGER,
  best_day_email INTEGER,
  best_hour_whatsapp INTEGER,
  best_day_whatsapp INTEGER,
  avg_open_delay_minutes INTEGER,
  avg_response_delay_minutes INTEGER,
  engagement_score NUMERIC(5,2) DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

ALTER TABLE public.predictive_send_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view predictive profiles" ON public.predictive_send_profiles
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()) OR public.is_agency_of(organization_id, auth.uid()));

CREATE POLICY "Members can manage predictive profiles" ON public.predictive_send_profiles
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()))
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

-- Enable realtime for site events and sentiment
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sentiment_analysis;
