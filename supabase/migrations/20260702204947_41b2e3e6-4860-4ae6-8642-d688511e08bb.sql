
-- Restrict directory_entries SELECT to authenticated users only
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='directory_entries' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.directory_entries', p.policyname);
  END LOOP;
END $$;

REVOKE SELECT ON public.directory_entries FROM anon;
GRANT SELECT ON public.directory_entries TO authenticated;

CREATE POLICY "Authenticated users can read directory"
ON public.directory_entries
FOR SELECT
TO authenticated
USING (true);
