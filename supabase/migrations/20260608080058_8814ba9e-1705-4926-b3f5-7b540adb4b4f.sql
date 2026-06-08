
-- Enrichir les profils membres
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS skills text[];

-- Compteur de vues sur actualités
ALTER TABLE public.actualites
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- Table des réactions (likes) sur les publications
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actualite_id uuid NOT NULL REFERENCES public.actualites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actualite_id, user_id)
);

GRANT SELECT ON public.post_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone"
  ON public.post_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users manage own reactions"
  ON public.post_reactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
