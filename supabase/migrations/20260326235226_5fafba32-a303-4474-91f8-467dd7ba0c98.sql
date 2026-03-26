
INSERT INTO storage.buckets (id, name, public)
VALUES ('voip-audio', 'voip-audio', true);

CREATE POLICY "Authenticated users can upload voip audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voip-audio');

CREATE POLICY "Anyone can read voip audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'voip-audio');

CREATE POLICY "Users can delete own voip audio"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voip-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
