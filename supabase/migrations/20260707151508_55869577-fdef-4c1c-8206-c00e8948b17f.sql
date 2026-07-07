
CREATE OR REPLACE FUNCTION public.is_bureau_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = _user_id
      AND is_active = true
      AND (
        lower(poste) LIKE 'vice-président%'
        OR lower(poste) LIKE 'vice-president%'
        OR lower(poste) LIKE 'vice président%'
        OR lower(poste) LIKE 'vice president%'
        OR lower(poste) LIKE 'secrétaire général%'
        OR lower(poste) LIKE 'secretaire general%'
        OR lower(poste) LIKE 'secrétaire generale%'
        OR lower(poste) LIKE 'secretaire générale%'
      )
  )
$$;

DROP POLICY IF EXISTS "VPs and admins can insert directory entries" ON public.directory_entries;
DROP POLICY IF EXISTS "VPs and admins can update directory entries" ON public.directory_entries;
DROP POLICY IF EXISTS "VPs can insert non-bureau members" ON public.members;

CREATE POLICY "Bureau editors and admins can insert directory entries"
ON public.directory_entries FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator') OR is_bureau_editor(auth.uid())
);

CREATE POLICY "Bureau editors and admins can update directory entries"
ON public.directory_entries FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator') OR is_bureau_editor(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator') OR is_bureau_editor(auth.uid())
);

CREATE POLICY "Bureau editors can insert non-bureau members"
ON public.members FOR INSERT TO authenticated
WITH CHECK (
  is_bureau_editor(auth.uid())
  AND category = ANY (ARRAY['membre','partenaire','commission'])
);
