
-- Support Tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  parent_ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  assigned_to uuid DEFAULT NULL,
  created_by uuid NOT NULL,
  protocol_number text NOT NULL DEFAULT ('SUP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 100000)::text, 5, '0')),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text,
  sla_hours integer DEFAULT 24,
  sla_deadline_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can insert org tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(organization_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members can update org tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can delete org tickets" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (is_org_admin(organization_id, auth.uid()));

-- Public read policy for ticket tracking portal (by protocol number)
CREATE POLICY "Anyone can view ticket by protocol" ON public.support_tickets
  FOR SELECT TO anon
  USING (true);

-- Support Ticket Notes (internal history)
CREATE TABLE public.support_ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  note_type text NOT NULL DEFAULT 'comment',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ticket notes" ON public.support_ticket_notes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_notes.ticket_id
    AND is_org_member(t.organization_id, auth.uid())
  ));

CREATE POLICY "Members can insert ticket notes" ON public.support_ticket_notes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_notes.ticket_id
    AND is_org_member(t.organization_id, auth.uid())
  ) AND auth.uid() = user_id);

CREATE POLICY "Members can delete own notes" ON public.support_ticket_notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Support Ticket Attachments
CREATE TABLE public.support_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ticket attachments" ON public.support_ticket_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_attachments.ticket_id
    AND is_org_member(t.organization_id, auth.uid())
  ));

CREATE POLICY "Members can insert ticket attachments" ON public.support_ticket_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_attachments.ticket_id
    AND is_org_member(t.organization_id, auth.uid())
  ) AND auth.uid() = uploaded_by);

-- Support Ticket Dependencies
CREATE TABLE public.support_ticket_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  depends_on_ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, depends_on_ticket_id)
);

ALTER TABLE public.support_ticket_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage ticket dependencies" ON public.support_ticket_dependencies
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_ticket_dependencies.ticket_id
    AND is_org_member(t.organization_id, auth.uid())
  ));
