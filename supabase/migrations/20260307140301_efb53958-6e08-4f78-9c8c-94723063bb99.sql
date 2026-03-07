
-- Add whatsapp_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Platform-level WhatsApp groups linked to subscription plans
CREATE TABLE public.plan_whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_jid text NOT NULL DEFAULT '',
  instance_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link groups to plans
CREATE TABLE public.plan_whatsapp_group_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.plan_whatsapp_groups(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, plan_id)
);

-- Track members added/removed from groups
CREATE TABLE public.plan_whatsapp_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid NOT NULL REFERENCES public.plan_whatsapp_groups(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  added_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_whatsapp_group_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_whatsapp_members ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
CREATE POLICY "Admins manage plan_whatsapp_groups"
ON public.plan_whatsapp_groups FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read active plan_whatsapp_groups"
ON public.plan_whatsapp_groups FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins manage plan_whatsapp_group_links"
ON public.plan_whatsapp_group_links FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read plan_whatsapp_group_links"
ON public.plan_whatsapp_group_links FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage plan_whatsapp_members"
ON public.plan_whatsapp_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own plan_whatsapp_members"
ON public.plan_whatsapp_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Updated_at trigger for plan_whatsapp_groups
CREATE TRIGGER update_plan_whatsapp_groups_updated_at
  BEFORE UPDATE ON public.plan_whatsapp_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for plan_whatsapp_members
CREATE TRIGGER update_plan_whatsapp_members_updated_at
  BEFORE UPDATE ON public.plan_whatsapp_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
