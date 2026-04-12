
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Member photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can upload member photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can update member photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'member-photos');
