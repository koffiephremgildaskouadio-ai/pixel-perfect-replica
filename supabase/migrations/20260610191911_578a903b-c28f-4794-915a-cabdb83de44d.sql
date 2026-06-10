
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.members;
CREATE POLICY "Members are viewable by authenticated users"
ON public.members FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS TABLE(members_count bigint, news_count bigint, directory_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.members WHERE is_active = true),
    (SELECT count(*) FROM public.actualites),
    (SELECT count(*) FROM public.directory_entries);
$$;
REVOKE ALL ON FUNCTION public.public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_stats() TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
CREATE POLICY "Users can read own messages"
ON public.messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can upload member photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update member photos" ON storage.objects;

CREATE POLICY "Users upload to own folder or chat"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'member-photos'
  AND (
    name LIKE 'chat/%'
    OR name LIKE (auth.uid()::text || '/%')
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  )
);

CREATE POLICY "Admins update member photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'member-photos'
  AND (
    name LIKE (auth.uid()::text || '/%')
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Admins delete member photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'member-photos'
  AND (
    name LIKE (auth.uid()::text || '/%')
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);
