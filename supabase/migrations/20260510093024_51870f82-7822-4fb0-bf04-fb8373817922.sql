ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS district text NOT NULL DEFAULT 'Novalim-CIE';

UPDATE public.members
SET district = 'Novalim-CIE'
WHERE district IS NULL OR district = '';

DROP POLICY IF EXISTS "Super admins can manage members" ON public.members;
CREATE POLICY "Super admins can manage members"
ON public.members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can manage site_content" ON public.site_content;
CREATE POLICY "Super admins can manage site_content"
ON public.site_content FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can manage directory entries" ON public.directory_entries;
CREATE POLICY "Super admins can manage directory entries"
ON public.directory_entries FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.user_roles (user_id, role)
VALUES ('5b95d471-8336-406c-8a93-79efbd970ae5', 'super_admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

REVOKE EXECUTE ON FUNCTION public.auto_register_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;