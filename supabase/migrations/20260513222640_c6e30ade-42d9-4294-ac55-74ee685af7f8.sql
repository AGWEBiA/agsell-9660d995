-- Ensure buckets exist with correct policies
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('inbox-attachments', 'inbox-attachments', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('voip-audio', 'voip-audio', false) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('contacts', 'contacts', false) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('organization-assets', 'organization-assets', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('automation-assets', 'automation-assets', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('campaigns', 'campaigns', true) ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for public buckets (use DO to avoid errors if policies already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access to avatars') THEN
        CREATE POLICY "Public access to avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access to inbox-attachments') THEN
        CREATE POLICY "Public access to inbox-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'inbox-attachments');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access to organization-assets') THEN
        CREATE POLICY "Public access to organization-assets" ON storage.objects FOR SELECT USING (bucket_id = 'organization-assets');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access to automation-assets') THEN
        CREATE POLICY "Public access to automation-assets" ON storage.objects FOR SELECT USING (bucket_id = 'automation-assets');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access to content') THEN
        CREATE POLICY "Public access to content" ON storage.objects FOR SELECT USING (bucket_id = 'content');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access to campaigns') THEN
        CREATE POLICY "Public access to campaigns" ON storage.objects FOR SELECT USING (bucket_id = 'campaigns');
    END IF;
END $$;

-- Add indexes on contacts phone/whatsapp for faster lookups in webhooks
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON public.contacts(whatsapp);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON public.contacts(organization_id);
