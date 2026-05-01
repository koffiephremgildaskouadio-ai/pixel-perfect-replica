
-- Allow admins/moderators full CRUD on members
CREATE POLICY "Admins can manage members"
ON public.members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can manage members"
ON public.members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

-- Add media column to actualites for multiple images/videos
ALTER TABLE public.actualites
ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.actualites.media IS 'Array of {type: image|video, url: string} objects';
