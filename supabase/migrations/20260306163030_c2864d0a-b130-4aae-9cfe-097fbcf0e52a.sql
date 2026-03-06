
-- Table for ticket replies (responses sent to the requester)
CREATE TABLE public.support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_via TEXT NOT NULL DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- RLS: org members can manage replies via ticket's org
CREATE POLICY "Members can view replies" ON public.support_ticket_replies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      JOIN public.organization_members om ON om.organization_id = st.organization_id
      WHERE st.id = support_ticket_replies.ticket_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert replies" ON public.support_ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      JOIN public.organization_members om ON om.organization_id = st.organization_id
      WHERE st.id = support_ticket_replies.ticket_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own replies" ON public.support_ticket_replies
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
