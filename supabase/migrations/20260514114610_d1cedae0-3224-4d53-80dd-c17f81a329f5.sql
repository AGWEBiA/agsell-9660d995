-- Consolidate storage buckets and policies used by WhatsApp/media uploads
-- This fixes RLS failures caused by organization-scoped paths such as
-- automation-media/{organization_id}/... while keeping the path checks scoped.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('inbox-attachments', 'inbox-attachments', true),
  ('voip-audio', 'voip-audio', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Drop conflicting/legacy policies for the affected buckets.
DROP POLICY IF EXISTS "Anyone can view inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read inbox-attachments bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can delete from inbox-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to inbox-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Org members can read inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org members can read voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Public access to inbox-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for inbox-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voip audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read inbox media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inbox media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update inbox media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete inbox media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voip campaign audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload voip campaign audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update voip campaign audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete voip campaign audio" ON storage.objects;

-- Media URLs are sent to external providers, so these two buckets need readable public URLs.
CREATE POLICY "Anyone can read inbox media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inbox-attachments');

CREATE POLICY "Anyone can read voip campaign audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'voip-audio');

-- Uploads are allowed only for authenticated users and only in safe path scopes:
-- 1) user-id root folder: {auth.uid()}/...
-- 2) organization-id root folder: {organization_id}/... where user is a member/admin
-- 3) automation-media/{organization_id}/... for the Flow Builder media upload UI
CREATE POLICY "Authenticated users can upload inbox media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inbox-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR (
      (storage.foldername(name))[1] = 'automation-media'
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

CREATE POLICY "Authenticated users can update inbox media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inbox-attachments'
  AND (
    owner = auth.uid()
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR (
      (storage.foldername(name))[1] = 'automation-media'
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id::text = (storage.foldername(name))[2]
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'inbox-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR (
      (storage.foldername(name))[1] = 'automation-media'
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

CREATE POLICY "Authenticated users can delete inbox media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inbox-attachments'
  AND (
    owner = auth.uid()
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR (
      (storage.foldername(name))[1] = 'automation-media'
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id::text = (storage.foldername(name))[2]
      )
    )
  )
);

-- VoIP audio uses both user-id and organization-id scoped paths in the app.
CREATE POLICY "Authenticated users can upload voip campaign audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voip-audio'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Authenticated users can update voip campaign audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voip-audio'
  AND (
    owner = auth.uid()
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'voip-audio'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Authenticated users can delete voip campaign audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voip-audio'
  AND (
    owner = auth.uid()
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  )
);