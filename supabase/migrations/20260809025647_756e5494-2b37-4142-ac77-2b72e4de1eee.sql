ALTER TABLE public.portals
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT true;