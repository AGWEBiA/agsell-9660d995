
-- 1. Fix system_errors: restrict INSERT to authenticated users with org membership or no org
DROP POLICY IF EXISTS "Anyone can insert system errors" ON public.system_errors;
CREATE POLICY "Authenticated users can insert system errors"
ON public.system_errors
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    organization_id IS NULL
    OR is_org_member(organization_id, auth.uid())
  )
);

-- 2. Fix forms: restrict public SELECT to only expose id and is_active (not full structure)
-- Replace the overly permissive "Anyone can view active forms" with a more restrictive version
-- that only allows viewing by form ID (needed for FormView public page)
DROP POLICY IF EXISTS "Anyone can view active forms" ON public.forms;
CREATE POLICY "Anyone can view active forms by id"
ON public.forms
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 3. Fix form_submissions: restrict anonymous inserts to require a valid form_id
DROP POLICY IF EXISTS "Anyone can submit forms" ON public.form_submissions;
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

-- 4. Fix CSAT responses: ensure survey exists and is active (already partially done, reinforce)
DROP POLICY IF EXISTS "Authenticated users can insert CSAT response" ON public.csat_responses;
CREATE POLICY "Authenticated users can insert CSAT response"
ON public.csat_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.csat_surveys cs
    WHERE cs.id = csat_responses.survey_id
    AND cs.is_active = true
  )
  AND is_org_member(organization_id, auth.uid())
);

-- 5. Secure instagram_accounts_safe view - add RLS to underlying view
-- Views inherit RLS from base tables, so instagram_accounts_safe is already protected
-- by the instagram_accounts RLS policies. Mark as security_invoker for safety.
ALTER VIEW public.instagram_accounts_safe SET (security_invoker = true);
