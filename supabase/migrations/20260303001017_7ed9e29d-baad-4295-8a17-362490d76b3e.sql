
-- Add ticket management fields to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS protocol_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Auto-generate protocol numbers
CREATE OR REPLACE FUNCTION public.generate_protocol_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.protocol_number IS NULL THEN
    NEW.protocol_number := 'TK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 99999 + 1)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_protocol_number
BEFORE INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.generate_protocol_number();

-- Quick replies / response templates table
CREATE TABLE public.quick_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT NULL,
  shortcut TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org quick replies"
ON public.quick_replies FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can insert quick replies"
ON public.quick_replies FOR INSERT
WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update quick replies"
ON public.quick_replies FOR UPDATE
USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete quick replies"
ON public.quick_replies FOR DELETE
USING (is_org_admin(organization_id, auth.uid()));

-- Internal notes on conversations (visible only to agents)
CREATE TABLE public.conversation_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view notes via conversation org"
ON public.conversation_notes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = conversation_notes.conversation_id
  AND is_org_member(c.organization_id, auth.uid())
));

CREATE POLICY "Members can insert notes"
ON public.conversation_notes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = conversation_notes.conversation_id
  AND is_org_member(c.organization_id, auth.uid())
) AND auth.uid() = user_id);

CREATE POLICY "Members can delete own notes"
ON public.conversation_notes FOR DELETE
USING (auth.uid() = user_id);
