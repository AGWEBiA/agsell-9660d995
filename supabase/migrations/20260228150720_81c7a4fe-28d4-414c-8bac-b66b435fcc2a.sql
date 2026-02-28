
-- 1. Insert the Agency plan (features as JSONB array)
INSERT INTO public.plans (
  name, slug, description, price_monthly, price_yearly,
  max_users, max_contacts, max_emails_per_month, max_whatsapp_messages,
  max_automations, max_forms, max_instagram_accounts,
  features, is_active, is_default
) VALUES (
  'Agência', 'agencia', 'Plano exclusivo para agências gerenciarem contas de clientes',
  697.00, 6970.00,
  -1, -1, -1, -1, -1, -1, -1,
  '["crm_basico","pipeline","tarefas","automacoes","email_marketing","analytics","lead_scoring","whatsapp","integrações","api","white_label","suporte_prioritario","instagram","agency_management"]'::jsonb,
  true, false
);

-- 2. Create agency_clients table
CREATE TABLE public.agency_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  access_level TEXT NOT NULL DEFAULT 'operational',
  invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  invite_email TEXT,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agency_org_id, client_org_id)
);

ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency admins can manage their clients"
  ON public.agency_clients FOR ALL
  USING (is_org_admin(agency_org_id, auth.uid()));

CREATE POLICY "Client admins can view agency links"
  ON public.agency_clients FOR SELECT
  USING (is_org_admin(client_org_id, auth.uid()));

CREATE POLICY "Client admins can update agency links"
  ON public.agency_clients FOR UPDATE
  USING (is_org_admin(client_org_id, auth.uid()));

CREATE POLICY "Anyone can read pending invites by token"
  ON public.agency_clients FOR SELECT
  USING (status = 'pending' AND invite_token IS NOT NULL);

CREATE TRIGGER update_agency_clients_updated_at
  BEFORE UPDATE ON public.agency_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Function to check if user is from an agency managing this client org
CREATE OR REPLACE FUNCTION public.is_agency_of(_client_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_clients ac
    JOIN public.organization_members om ON om.organization_id = ac.agency_org_id
    WHERE ac.client_org_id = _client_org_id
      AND ac.status = 'active'
      AND om.user_id = _user_id
  )
$$;

-- 4. Function to get agency access level
CREATE OR REPLACE FUNCTION public.get_agency_access_level(_client_org_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ac.access_level
  FROM public.agency_clients ac
  JOIN public.organization_members om ON om.organization_id = ac.agency_org_id
  WHERE ac.client_org_id = _client_org_id
    AND ac.status = 'active'
    AND om.user_id = _user_id
  LIMIT 1
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_clients;
