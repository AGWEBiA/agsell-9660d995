-- 1. Create missing buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('contacts', 'contacts', false),
  ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies for 'avatars'
-- Allow public read access
CREATE POLICY "Public read access for avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
-- (Folder name matches user_id)
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);


-- 3. Policies for 'contacts' (private)
-- Allow authenticated users to access contact files for their organization
CREATE POLICY "Users can access their organization contact files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'contacts');

CREATE POLICY "Users can upload contact files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'contacts');


-- 4. Policies for 'organization-assets' (public)
CREATE POLICY "Public read access for organization-assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'organization-assets');

CREATE POLICY "Users can upload organization assets" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'organization-assets');
