
-- Table des portails dynamiques
CREATE TABLE public.portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  color TEXT DEFAULT '#15803d',
  logo_url TEXT,
  cover_url TEXT,
  member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portals TO authenticated;
GRANT ALL ON public.portals TO service_role;

ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portals viewable by everyone"
  ON public.portals FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins manage portals"
  ON public.portals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage portals"
  ON public.portals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_portals_updated_at
  BEFORE UPDATE ON public.portals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pré-init paramètres de la carte modifiables (site_content)
INSERT INTO public.site_content (key, title, content, metadata) VALUES
  ('card_settings', 'Paramètres carte de membre', 'Textes officiels affichés sur la carte', 
    '{"header_top":"CONSEIL COMMUNAL DES JEUNES DE YOPOUGON","header_main":"DISTRICT CITÉ NOVALIM - CIE","validity":"2025 - 2026","emergency_phone":"07 89 53 63 18","verso_text":"Cette carte est la propriété du District Cité Novalim - CIE.\nEn cas de perte, merci de nous contacter","facebook_url":"https://web.facebook.com/DistrictCiteNovalimCIE","site_url":"https://districtcitenovalim-cie.lovable.app"}'::jsonb),
  ('certificate_settings', 'Paramètres certificat', 'Textes officiels du certificat',
    '{"title":"CERTIFICAT DE MEMBRE","subtitle":"Conseil Communal des Jeunes de Yopougon","authority":"Le Président du District","signatory":"Kouadio Koffi Ephrem Gildas","footer":"Fait à Yopougon, sous la haute autorité du CCJY"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
