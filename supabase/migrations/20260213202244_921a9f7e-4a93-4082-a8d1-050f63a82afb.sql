
-- ============================================
-- SECURITY HARDENING: Fix permissive RLS policies
-- ============================================

-- 1. FIX: webhook_events INSERT - remove permissive "true" policy
-- Only service_role (edge functions) should insert webhook events
DROP POLICY IF EXISTS "Webhooks can insert without auth" ON public.webhook_events;

-- Restrict INSERT to authenticated users only (edge functions use service_role which bypasses RLS)
-- No anon/authenticated user should directly insert webhook_events
CREATE POLICY "Only service role can insert webhook events"
ON public.webhook_events
FOR INSERT
WITH CHECK (false);

-- 2. FIX: notifications INSERT - restrict to self or service_role
DROP POLICY IF EXISTS "Authenticated users can receive notifications" ON public.notifications;

CREATE POLICY "Users can only receive their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. FIX: api_keys SELECT - restrict to admins only (remove member view)
DROP POLICY IF EXISTS "Members can view API keys" ON public.api_keys;

CREATE POLICY "Only admins can view API keys"
ON public.api_keys
FOR SELECT
USING (is_org_admin(organization_id, auth.uid()));

-- 4. FIX: inbound_webhooks SELECT - restrict secret_token visibility to admins
DROP POLICY IF EXISTS "Members can view webhooks" ON public.inbound_webhooks;

CREATE POLICY "Only admins can view webhooks"
ON public.inbound_webhooks
FOR SELECT
USING (is_org_admin(organization_id, auth.uid()));

-- 5. FIX: organization_integrations SELECT - restrict config to admins
DROP POLICY IF EXISTS "Members can view integrations" ON public.organization_integrations;

CREATE POLICY "Only admins can view integrations"
ON public.organization_integrations
FOR SELECT
USING (is_org_admin(organization_id, auth.uid()));

-- 6. FIX: messages INSERT - validate sender_type for user messages
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
  AND sender_type IN ('user', 'agent')
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = auth.uid()
));

-- 7. FIX: organization_invites SELECT - restrict to admins only
DROP POLICY IF EXISTS "Members can view invites" ON public.organization_invites;

CREATE POLICY "Only admins can view invites"
ON public.organization_invites
FOR SELECT
USING (is_org_admin(organization_id, auth.uid()));
