
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text,
  content text,
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content readable by all" ON public.site_content;
CREATE POLICY "site_content readable by all"
ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins can insert site_content" ON public.site_content;
CREATE POLICY "admins can insert site_content"
ON public.site_content FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "admins can update site_content" ON public.site_content;
CREATE POLICY "admins can update site_content"
ON public.site_content FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "admins can delete site_content" ON public.site_content;
CREATE POLICY "admins can delete site_content"
ON public.site_content FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP TRIGGER IF EXISTS trg_site_content_updated_at ON public.site_content;
CREATE TRIGGER trg_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default editable blocks for the À Propos page
INSERT INTO public.site_content (key, title, content) VALUES
  ('apropos.hero', 'District Cité Novalim-CIE', 'Un district modèle au cœur de la commune de Yopougon, composé à 95 % de cités résidentielles organisées et dynamiques.'),
  ('apropos.president_intro', 'Une faîtière au service de la jeunesse', 'Le Conseil Communal des Jeunes de Yopougon (CCJY) est la faîtière de toutes les associations de jeunesse de la commune.')
ON CONFLICT (key) DO NOTHING;
