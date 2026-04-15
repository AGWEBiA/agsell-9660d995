-- Fix 1: Restrict whatsapp_group_events INSERT to org members only
DROP POLICY IF EXISTS "Authenticated can insert events" ON public.whatsapp_group_events;
CREATE POLICY "Org members can insert group events"
  ON public.whatsapp_group_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_groups g
      JOIN public.organization_members om ON om.organization_id = g.organization_id
      WHERE g.id = whatsapp_group_events.group_id
        AND om.user_id = auth.uid()
    )
  );

-- Fix 2: Restrict voip-audio upload to user-scoped paths
DROP POLICY IF EXISTS "Authenticated users can upload voip audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload voip audio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voip-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix 3: Restrict whatsapp_flow_submissions INSERT to org members
DROP POLICY IF EXISTS "System can insert flow submissions" ON public.whatsapp_flow_submissions;
CREATE POLICY "Org members can insert flow submissions"
  ON public.whatsapp_flow_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_flows wf
      JOIN public.organization_members om ON om.organization_id = wf.organization_id
      WHERE wf.id = whatsapp_flow_submissions.flow_id
        AND om.user_id = auth.uid()
    )
  );

-- Fix 4: Restrict user_achievements INSERT to service role pattern
-- Users should not self-grant arbitrary achievements
DROP POLICY IF EXISTS "Users can earn their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());