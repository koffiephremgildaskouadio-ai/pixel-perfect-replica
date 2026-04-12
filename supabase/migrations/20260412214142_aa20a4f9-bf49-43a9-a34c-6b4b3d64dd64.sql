
-- Create actualites table
CREATE TABLE public.actualites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'ai',
  type TEXT NOT NULL DEFAULT 'ai_daily',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.actualites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actualites are viewable by everyone"
ON public.actualites FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage actualites"
ON public.actualites FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-register new users as members
CREATE OR REPLACE FUNCTION public.auto_register_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INT;
  member_num TEXT;
BEGIN
  -- Get the next member number
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_number FROM 'NCV-2025-(\d+)') AS INT)), 100) + 1
  INTO next_number
  FROM public.members
  WHERE member_number ~ 'NCV-2025-\d+';
  
  member_num := 'NCV-2025-' || LPAD(next_number::TEXT, 3, '0');
  
  INSERT INTO public.members (user_id, member_number, nom, prenoms, category)
  VALUES (
    NEW.id,
    member_num,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', 'Nouveau'),
    COALESCE(NEW.raw_user_meta_data ->> 'prenoms', 'Membre'),
    'membre'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_member
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_register_member();
