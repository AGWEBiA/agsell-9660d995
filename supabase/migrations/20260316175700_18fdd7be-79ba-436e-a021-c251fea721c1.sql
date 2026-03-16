-- Fix 1: Webhook secret_token - restrict SELECT to org admins only
DROP POLICY IF EXISTS "Members can view webhooks" ON public.inbound_webhooks;
CREATE POLICY "Members can view webhooks"
ON public.inbound_webhooks FOR SELECT
TO authenticated
USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Subscriptions - restrict stripe IDs to org admins only
DROP POLICY IF EXISTS "Org admins can view subscriptions" ON public.subscriptions;
CREATE POLICY "Org admins can view subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Checkout leads - remove member-level access
DROP POLICY IF EXISTS "Org members can view their checkout leads" ON public.checkout_leads;

-- Fix 4: Integration config - restrict to org admins
DROP POLICY IF EXISTS "Members can view integrations" ON public.organization_integrations;
CREATE POLICY "Admins can view integrations"
ON public.organization_integrations FOR SELECT
TO authenticated
USING (is_org_admin(organization_id, auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 5: Forms public access - add org check for non-anon
-- Keep public access for form rendering (needed for embeds) but this is acceptable
-- The existing policy only exposes active forms which is intentional for public form embedding
