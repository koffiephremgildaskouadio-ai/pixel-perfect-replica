
-- Directory entries table for classified portal
CREATE TABLE IF NOT EXISTS public.directory_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'autre',
  address TEXT,
  phone TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.directory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directory entries viewable by everyone"
ON public.directory_entries FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage directory entries"
ON public.directory_entries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can manage directory entries"
ON public.directory_entries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to insert actualites
CREATE POLICY "Moderators can manage actualites"
ON public.actualites FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- Allow authenticated users with admin/moderator roles to insert actualites
CREATE POLICY "Admin and moderator insert actualites"
ON public.actualites FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
