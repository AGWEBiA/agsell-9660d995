
-- 1) Allow public (anon) to SELECT active forms for the public form view
CREATE POLICY "Anyone can view active forms"
ON public.forms
FOR SELECT
TO anon
USING (is_active = true);

-- 2) Drop the restrictive submission policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can submit to active forms" ON public.form_submissions;

CREATE POLICY "Anyone can submit to active forms"
ON public.form_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = form_submissions.form_id
    AND forms.is_active = true
  )
);
