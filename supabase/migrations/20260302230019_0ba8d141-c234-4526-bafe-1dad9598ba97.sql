
-- Create email_mailboxes table for mailbox management per domain
CREATE TABLE public.email_mailboxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.email_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  logo_url TEXT,
  link_facebook TEXT,
  link_instagram TEXT,
  link_youtube TEXT,
  link_whatsapp TEXT,
  link_telegram TEXT,
  signature TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  warmup_status TEXT NOT NULL DEFAULT 'none',
  daily_limit INTEGER DEFAULT 500,
  sent_today INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(domain_id, prefix)
);

-- Enable RLS
ALTER TABLE public.email_mailboxes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view mailboxes in their org"
ON public.email_mailboxes FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create mailboxes in their org"
ON public.email_mailboxes FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update mailboxes in their org"
ON public.email_mailboxes FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete mailboxes in their org"
ON public.email_mailboxes FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_email_mailboxes_updated_at
BEFORE UPDATE ON public.email_mailboxes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
