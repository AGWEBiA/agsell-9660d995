
-- Allow global admins to update any organization
CREATE POLICY "Global admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow global admins to manage any subscription
CREATE POLICY "Global admins can manage subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
