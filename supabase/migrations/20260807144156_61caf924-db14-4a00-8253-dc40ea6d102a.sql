-- 1. Franceville president: identity-based only
CREATE OR REPLACE FUNCTION public.is_franceville_president(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE m.is_active = true
      AND m.district ILIKE '%france%'
      AND (lower(m.poste) LIKE 'président%' OR lower(m.poste) LIKE 'president%')
      AND m.user_id = _user_id
  )
$function$;

-- 2. Comments: authenticated only
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by authenticated users"
ON public.comments FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.comments FROM anon;

-- 3. Profiles: owner + admins only
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by owner or admins"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
);

-- 4. Members: restrict full row (PII) access
DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON public.members;
CREATE POLICY "Members full rows viewable by self and staff"
ON public.members FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
  OR public.is_bureau_editor(auth.uid())
  OR public.is_franceville_president(auth.uid())
);

-- Non-sensitive directory view (no email / phone / whatsapp)
CREATE OR REPLACE VIEW public.members_public AS
SELECT
  id, user_id, member_number, nom, prenoms, poste, quartier,
  photo_url, category, is_active, district, bio, skills,
  facebook, linkedin, cahier_charges, created_at, updated_at
FROM public.members;

GRANT SELECT ON public.members_public TO authenticated;
GRANT SELECT ON public.members_public TO anon;