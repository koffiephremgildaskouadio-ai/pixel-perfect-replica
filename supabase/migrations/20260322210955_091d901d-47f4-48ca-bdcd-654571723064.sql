
-- Members table for virtual cards
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenoms TEXT NOT NULL,
  poste TEXT,
  quartier TEXT,
  phone TEXT,
  photo_url TEXT,
  category TEXT NOT NULL DEFAULT 'membre' CHECK (category IN ('bureau', 'cabinet', 'membre')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Public read access for member cards (anyone can view/scan a card)
CREATE POLICY "Members are viewable by everyone"
  ON public.members
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only the member themselves can update their own profile
CREATE POLICY "Members can update own profile"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles table for auth users
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  prenoms TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenoms)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'prenoms', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Seed some sample bureau members for demo
INSERT INTO public.members (member_number, nom, prenoms, poste, quartier, category) VALUES
  ('NCV-2024-001', 'KOUADIO', 'Koffi Ephrem Gildas', 'Président des Jeunes', 'Novalim-CIE', 'bureau'),
  ('NCV-2024-002', 'DIALLO', 'Aminata Marie', 'Vice-Présidente', 'Novalim-CIE', 'bureau'),
  ('NCV-2024-003', 'KONÉ', 'Ibrahim Seydou', 'Secrétaire Général', 'Novalim-CIE', 'bureau'),
  ('NCV-2024-004', 'BAMBA', 'Fatou Nadia', 'Trésorière Générale', 'Novalim-CIE', 'bureau'),
  ('NCV-2024-005', 'TOURÉ', 'Mamadou Lassina', 'Commissaire aux Comptes', 'Novalim-CIE', 'cabinet'),
  ('NCV-2024-006', 'YAO', 'Adjoua Christelle', 'Chargée de Communication', 'Novalim-CIE', 'cabinet');

-- Roles table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
