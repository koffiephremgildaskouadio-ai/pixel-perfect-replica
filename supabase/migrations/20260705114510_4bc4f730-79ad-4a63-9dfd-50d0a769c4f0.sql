
CREATE OR REPLACE FUNCTION public.is_vice_president(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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
      )
  )
$$;

DROP POLICY IF EXISTS "VPs and admins can insert directory entries" ON public.directory_entries;
CREATE POLICY "VPs and admins can insert directory entries"
ON public.directory_entries FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
  OR public.is_vice_president(auth.uid())
);

DROP POLICY IF EXISTS "VPs and admins can update directory entries" ON public.directory_entries;
CREATE POLICY "VPs and admins can update directory entries"
ON public.directory_entries FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
  OR public.is_vice_president(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
  OR public.is_vice_president(auth.uid())
);

DROP POLICY IF EXISTS "VPs can insert non-bureau members" ON public.members;
CREATE POLICY "VPs can insert non-bureau members"
ON public.members FOR INSERT
TO authenticated
WITH CHECK (
  public.is_vice_president(auth.uid())
  AND category IN ('membre', 'partenaire', 'commission')
);
