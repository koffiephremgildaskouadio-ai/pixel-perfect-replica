
-- MEMBERS: only super_admin manages
DROP POLICY IF EXISTS "Admins can manage members" ON public.members;
DROP POLICY IF EXISTS "Moderators can manage members" ON public.members;

-- DIRECTORY: only super_admin manages
DROP POLICY IF EXISTS "Admins can manage directory entries" ON public.directory_entries;
DROP POLICY IF EXISTS "Moderators can manage directory entries" ON public.directory_entries;

-- PORTALS: only super_admin manages
DROP POLICY IF EXISTS "Admins manage portals" ON public.portals;

-- SITE_CONTENT: only super_admin manages (remove admin/moderator)
DROP POLICY IF EXISTS "admins can delete site_content" ON public.site_content;
DROP POLICY IF EXISTS "admins can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "admins can update site_content" ON public.site_content;

-- ACTUALITES: keep moderator INSERT, restrict full management to super_admin only
DROP POLICY IF EXISTS "Admins can manage actualites" ON public.actualites;
DROP POLICY IF EXISTS "Moderators can manage actualites" ON public.actualites;
DROP POLICY IF EXISTS "Admin and moderator insert actualites" ON public.actualites;

-- Super admin: full control on actualites
CREATE POLICY "Super admins manage actualites"
ON public.actualites FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Moderators (VP Communication + SG): can INSERT, UPDATE, DELETE actualites only
CREATE POLICY "Moderators insert actualites"
ON public.actualites FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators update actualites"
ON public.actualites FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators delete actualites"
ON public.actualites FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));
