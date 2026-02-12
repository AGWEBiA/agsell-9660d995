
-- Table for custom email sending domains per organization
CREATE TABLE public.email_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  from_email TEXT, -- e.g. noreply@clientdomain.com
  from_name TEXT, -- display name for sender
  
  -- DNS verification status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verifying, verified, failed
  
  -- DNS records that need to be configured
  dns_records JSONB DEFAULT '[]'::jsonb,
  
  -- Individual record verification status
  spf_verified BOOLEAN DEFAULT false,
  dkim_verified BOOLEAN DEFAULT false,
  dmarc_verified BOOLEAN DEFAULT false,
  mx_verified BOOLEAN DEFAULT false,
  
  -- Verification metadata
  last_verified_at TIMESTAMPTZ,
  verification_error TEXT,
  verified_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, domain)
);

-- Enable RLS
ALTER TABLE public.email_domains ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage email domains
CREATE POLICY "Admins can manage email domains"
  ON public.email_domains
  FOR ALL
  USING (is_org_admin(organization_id, auth.uid()));

-- Members can view email domains
CREATE POLICY "Members can view email domains"
  ON public.email_domains
  FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_email_domains_updated_at
  BEFORE UPDATE ON public.email_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
