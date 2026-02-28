-- Allow global admins to view all organizations (needed for admin panel)
CREATE POLICY "Global admins can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));