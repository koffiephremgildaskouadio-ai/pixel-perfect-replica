
-- Drop restrictive profile select policy and replace with one allowing all authenticated users to view
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
