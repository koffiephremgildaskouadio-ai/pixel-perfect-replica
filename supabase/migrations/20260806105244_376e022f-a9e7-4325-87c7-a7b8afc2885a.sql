CREATE OR REPLACE FUNCTION public.is_franceville_president(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE m.is_active = true
      AND m.district ILIKE '%france%'
      AND (lower(m.poste) LIKE 'président%' OR lower(m.poste) LIKE 'president%')
      AND (
        m.user_id = _user_id
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = _user_id
            AND lower(trim(p.nom)) = lower(trim(m.nom))
            AND lower(trim(p.prenoms)) = lower(trim(m.prenoms))
        )
      )
  )
$$;

CREATE POLICY "FV president inserts actualites"
ON public.actualites FOR INSERT TO authenticated
WITH CHECK (public.is_franceville_president(auth.uid()));

CREATE POLICY "FV president updates actualites"
ON public.actualites FOR UPDATE TO authenticated
USING (public.is_franceville_president(auth.uid()))
WITH CHECK (public.is_franceville_president(auth.uid()));

CREATE POLICY "FV president inserts FV members"
ON public.members FOR INSERT TO authenticated
WITH CHECK (public.is_franceville_president(auth.uid()) AND district ILIKE '%france%');

CREATE POLICY "FV president updates FV members"
ON public.members FOR UPDATE TO authenticated
USING (public.is_franceville_president(auth.uid()) AND district ILIKE '%france%')
WITH CHECK (public.is_franceville_president(auth.uid()) AND district ILIKE '%france%');