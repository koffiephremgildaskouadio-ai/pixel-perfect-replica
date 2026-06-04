
-- Table des commentaires liés aux publications
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actualite_id uuid NOT NULL REFERENCES public.actualites(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can add comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments or admin"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE INDEX IF NOT EXISTS idx_comments_actualite ON public.comments(actualite_id, created_at DESC);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
