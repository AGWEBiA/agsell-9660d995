-- =====================================================
-- SISTEMA DE PLANOS DE ASSINATURA
-- =====================================================

-- Tabela de planos disponíveis
CREATE TABLE public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    max_users INTEGER DEFAULT 1,
    max_contacts INTEGER DEFAULT 100,
    max_emails_per_month INTEGER DEFAULT 500,
    max_whatsapp_messages INTEGER DEFAULT 100,
    max_automations INTEGER DEFAULT 5,
    max_forms INTEGER DEFAULT 3,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vincular plano à organização
ALTER TABLE public.organizations 
ADD COLUMN plan_id UUID REFERENCES public.plans(id);

-- Tabela de assinaturas (subscription)
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id)
);

-- =====================================================
-- SISTEMA DE PERMISSÕES GRANULARES
-- =====================================================

-- Enum para módulos do sistema
CREATE TYPE public.app_module AS ENUM (
    'contacts',
    'companies', 
    'pipeline',
    'tasks',
    'inbox',
    'email',
    'whatsapp',
    'automations',
    'lead_scoring',
    'forms',
    'analytics',
    'integrations',
    'settings',
    'organization',
    'admin'
);

-- Enum para ações
CREATE TYPE public.app_action AS ENUM (
    'view',
    'create',
    'edit',
    'delete',
    'export',
    'import',
    'manage'
);

-- Perfis de usuário (templates de permissões)
CREATE TABLE public.permission_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, slug)
);

-- Vincular perfil de permissão ao membro da organização
ALTER TABLE public.organization_members 
ADD COLUMN permission_profile_id UUID REFERENCES public.permission_profiles(id);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar limite do plano
CREATE OR REPLACE FUNCTION public.check_plan_limit(
    _org_id UUID,
    _resource TEXT,
    _current_count INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    plan_record RECORD;
    actual_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Buscar plano da organização
    SELECT p.* INTO plan_record
    FROM organizations o
    JOIN plans p ON o.plan_id = p.id
    WHERE o.id = _org_id;
    
    IF plan_record IS NULL THEN
        RETURN jsonb_build_object('allowed', true, 'message', 'No plan restrictions');
    END IF;
    
    -- Determinar limite baseado no recurso
    CASE _resource
        WHEN 'users' THEN max_limit := plan_record.max_users;
        WHEN 'contacts' THEN max_limit := plan_record.max_contacts;
        WHEN 'emails' THEN max_limit := plan_record.max_emails_per_month;
        WHEN 'whatsapp' THEN max_limit := plan_record.max_whatsapp_messages;
        WHEN 'automations' THEN max_limit := plan_record.max_automations;
        WHEN 'forms' THEN max_limit := plan_record.max_forms;
        ELSE RETURN jsonb_build_object('allowed', true, 'message', 'Unknown resource');
    END CASE;
    
    -- Se limite é -1, significa ilimitado
    IF max_limit = -1 THEN
        RETURN jsonb_build_object('allowed', true, 'limit', -1, 'current', COALESCE(_current_count, 0));
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', COALESCE(_current_count, 0) < max_limit,
        'limit', max_limit,
        'current', COALESCE(_current_count, 0),
        'remaining', max_limit - COALESCE(_current_count, 0)
    );
END;
$$;

-- Função para verificar permissão do usuário
CREATE OR REPLACE FUNCTION public.has_permission(
    _user_id UUID,
    _org_id UUID,
    _module TEXT,
    _action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    member_record RECORD;
    permissions JSONB;
    permission_item JSONB;
BEGIN
    -- Buscar membro e seu perfil de permissão
    SELECT om.*, pp.permissions INTO member_record
    FROM organization_members om
    LEFT JOIN permission_profiles pp ON om.permission_profile_id = pp.id
    WHERE om.user_id = _user_id AND om.organization_id = _org_id;
    
    IF member_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Owner tem todas as permissões
    IF member_record.role = 'owner' THEN
        RETURN true;
    END IF;
    
    -- Admin tem quase todas as permissões (exceto admin module)
    IF member_record.role = 'admin' AND _module != 'admin' THEN
        RETURN true;
    END IF;
    
    -- Se não tem perfil de permissão, usar permissões padrão do role
    IF member_record.permissions IS NULL THEN
        -- Viewer só pode visualizar
        IF member_record.role = 'viewer' THEN
            RETURN _action = 'view';
        END IF;
        -- Member pode view, create, edit
        IF member_record.role = 'member' THEN
            RETURN _action IN ('view', 'create', 'edit');
        END IF;
        RETURN false;
    END IF;
    
    -- Verificar permissões específicas do perfil
    permissions := member_record.permissions;
    
    FOR permission_item IN SELECT * FROM jsonb_array_elements(permissions)
    LOOP
        IF permission_item->>'module' = _module AND 
           permission_item->>'action' = _action THEN
            RETURN true;
        END IF;
        -- Permissão 'manage' inclui todas as ações
        IF permission_item->>'module' = _module AND 
           permission_item->>'action' = 'manage' THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Plans - apenas leitura pública para planos ativos
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Only super admins can manage plans"
ON public.plans FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view subscriptions"
ON public.subscriptions FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage subscriptions"
ON public.subscriptions FOR ALL
USING (is_org_admin(organization_id, auth.uid()));

-- Permission Profiles
ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view permission profiles"
ON public.permission_profiles FOR SELECT
USING (organization_id IS NULL OR is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage permission profiles"
ON public.permission_profiles FOR ALL
USING (organization_id IS NULL OR is_org_admin(organization_id, auth.uid()));

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Planos padrão
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, max_users, max_contacts, max_emails_per_month, max_whatsapp_messages, max_automations, max_forms, features, is_default) VALUES
('Grátis', 'free', 'Plano inicial para começar', 0, 0, 1, 100, 500, 50, 3, 2, '["crm_basico", "pipeline", "tarefas"]'::jsonb, true),
('Starter', 'starter', 'Para pequenas equipes', 97, 970, 3, 1000, 5000, 500, 10, 5, '["crm_basico", "pipeline", "tarefas", "automacoes", "email_marketing", "analytics"]'::jsonb, false),
('Professional', 'professional', 'Para equipes em crescimento', 197, 1970, 10, 5000, 20000, 2000, 25, 15, '["crm_basico", "pipeline", "tarefas", "automacoes", "email_marketing", "analytics", "lead_scoring", "whatsapp", "integrações"]'::jsonb, false),
('Enterprise', 'enterprise', 'Para grandes empresas', 497, 4970, -1, -1, -1, -1, -1, -1, '["crm_basico", "pipeline", "tarefas", "automacoes", "email_marketing", "analytics", "lead_scoring", "whatsapp", "integrações", "api", "white_label", "suporte_prioritario"]'::jsonb, false);

-- Perfis de permissão padrão (sistema)
INSERT INTO public.permission_profiles (name, slug, description, is_system, permissions) VALUES
('Administrador', 'admin', 'Acesso total ao sistema', true, '[
    {"module": "contacts", "action": "manage"},
    {"module": "companies", "action": "manage"},
    {"module": "pipeline", "action": "manage"},
    {"module": "tasks", "action": "manage"},
    {"module": "inbox", "action": "manage"},
    {"module": "email", "action": "manage"},
    {"module": "whatsapp", "action": "manage"},
    {"module": "automations", "action": "manage"},
    {"module": "lead_scoring", "action": "manage"},
    {"module": "forms", "action": "manage"},
    {"module": "analytics", "action": "manage"},
    {"module": "integrations", "action": "manage"},
    {"module": "settings", "action": "manage"},
    {"module": "organization", "action": "manage"}
]'::jsonb),
('Vendedor', 'sales', 'Acesso a vendas e CRM', true, '[
    {"module": "contacts", "action": "view"},
    {"module": "contacts", "action": "create"},
    {"module": "contacts", "action": "edit"},
    {"module": "companies", "action": "view"},
    {"module": "companies", "action": "create"},
    {"module": "pipeline", "action": "manage"},
    {"module": "tasks", "action": "manage"},
    {"module": "inbox", "action": "view"},
    {"module": "analytics", "action": "view"}
]'::jsonb),
('Atendente', 'support', 'Acesso ao SAC e atendimento', true, '[
    {"module": "contacts", "action": "view"},
    {"module": "contacts", "action": "edit"},
    {"module": "inbox", "action": "manage"},
    {"module": "whatsapp", "action": "view"},
    {"module": "tasks", "action": "view"},
    {"module": "tasks", "action": "create"}
]'::jsonb),
('Marketing', 'marketing', 'Acesso a marketing e automações', true, '[
    {"module": "contacts", "action": "view"},
    {"module": "contacts", "action": "export"},
    {"module": "email", "action": "manage"},
    {"module": "automations", "action": "manage"},
    {"module": "lead_scoring", "action": "manage"},
    {"module": "forms", "action": "manage"},
    {"module": "analytics", "action": "view"}
]'::jsonb),
('Visualizador', 'viewer', 'Apenas visualização', true, '[
    {"module": "contacts", "action": "view"},
    {"module": "companies", "action": "view"},
    {"module": "pipeline", "action": "view"},
    {"module": "tasks", "action": "view"},
    {"module": "analytics", "action": "view"}
]'::jsonb);

-- Trigger para updated_at
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permission_profiles_updated_at
    BEFORE UPDATE ON public.permission_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();