
CREATE TABLE public.voip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  fallback_message TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  target_tags TEXT[] DEFAULT '{}',
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  answered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  credits_per_call INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voip_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org campaigns"
  ON public.voip_campaigns FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can insert own org campaigns"
  ON public.voip_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can update own org campaigns"
  ON public.voip_campaigns FOR UPDATE
  TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can delete own org campaigns"
  ON public.voip_campaigns FOR DELETE
  TO authenticated
  USING (public.is_org_member(organization_id, auth.uid()));
