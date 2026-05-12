CREATE POLICY "Authenticated can read inbox-attachments bucket"
ON storage.buckets FOR SELECT
TO authenticated
USING (id = 'inbox-attachments');