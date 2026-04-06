-- Make voip-audio bucket private
UPDATE storage.buckets SET public = false WHERE id = 'voip-audio';

-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Allow public read access to voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read voip audio" ON storage.objects;

-- Create org-scoped SELECT policy for voip-audio
CREATE POLICY "Org members can read voip audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voip-audio'
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id IN (
      SELECT c.organization_id FROM public.calls c 
      WHERE c.recording_url LIKE '%' || storage.objects.name || '%'
    )
  )
);