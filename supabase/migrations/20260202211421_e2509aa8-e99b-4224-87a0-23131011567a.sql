-- Sistema Multi-Tenant: Organizations e Memberships

-- Criar enum para roles de organização
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Tabela de Organizações
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Membros da Organização
CREATE TABLE public.organization_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role org_role NOT NULL DEFAULT 'member',
    invited_by UUID,
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Tabela de Convites
CREATE TABLE public.organization_invites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role org_role NOT NULL DEFAULT 'member',
    token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    invited_by UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, email)
);

-- Tabela de Integrações configuradas por organização
CREATE TABLE public.organization_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL, -- 'sendgrid', 'stripe', 'hotmart', 'kiwify', 'eduzz', 'evolution_api'
    name TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb, -- armazena configurações não sensíveis
    is_active BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, integration_type)
);

-- Tabela de Webhooks recebidos
CREATE TABLE public.webhook_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    source TEXT NOT NULL, -- 'hotmart', 'kiwify', 'eduzz', 'stripe'
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar organization_id às tabelas existentes
ALTER TABLE public.contacts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.companies ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.deals ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.automations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.email_campaigns ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.forms ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tags ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.pipeline_stages ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.lead_scoring_rules ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é membro da organização
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE user_id = _user_id
          AND organization_id = _org_id
    )
$$;

-- Função para verificar role na organização
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS org_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
$$;

-- Função para verificar se é admin ou owner
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE user_id = _user_id
          AND organization_id = _org_id
          AND role IN ('owner', 'admin')
    )
$$;

-- RLS Policies para organizations
CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT
USING (is_org_member(auth.uid(), id));

CREATE POLICY "Admins can update their organizations"
ON public.organizations
FOR UPDATE
USING (is_org_admin(auth.uid(), id));

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies para organization_members
CREATE POLICY "Members can view org members"
ON public.organization_members
FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage members"
ON public.organization_members
FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- RLS Policies para organization_invites
CREATE POLICY "Admins can manage invites"
ON public.organization_invites
FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Anyone can view invite by token"
ON public.organization_invites
FOR SELECT
USING (true);

-- RLS Policies para organization_integrations
CREATE POLICY "Members can view integrations"
ON public.organization_integrations
FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage integrations"
ON public.organization_integrations
FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- RLS Policies para webhook_events
CREATE POLICY "Members can view webhook events"
ON public.webhook_events
FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Webhooks can insert without auth"
ON public.webhook_events
FOR INSERT
WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_integrations_updated_at
BEFORE UPDATE ON public.organization_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar organização e adicionar owner automaticamente
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    org_name TEXT,
    org_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Criar organização
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Adicionar usuário como owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, auth.uid(), 'owner');
    
    RETURN new_org_id;
END;
$$;