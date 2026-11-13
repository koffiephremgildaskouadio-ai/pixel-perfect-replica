CREATE OR REPLACE FUNCTION public.is_bureau_editor(_user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = _user_id AND is_active = true
      AND (bureau_rank IS NOT NULL
        OR lower(poste) LIKE 'vice-pr%sident%' OR lower(poste) LIKE 'vice pr%sident%'
        OR lower(poste) LIKE 'secr%taire g%n%ral%')
  )
$$;

CREATE POLICY "Bureau members insert actualites" ON public.actualites
  FOR INSERT TO authenticated WITH CHECK (public.is_bureau_editor(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_member_self_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND OLD.user_id = auth.uid()
     AND NOT public.has_role(auth.uid(), 'super_admin') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.poste IS DISTINCT FROM OLD.poste OR NEW.district IS DISTINCT FROM OLD.district
       OR NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.bureau_rank IS DISTINCT FROM OLD.bureau_rank
       OR NEW.category IS DISTINCT FROM OLD.category OR NEW.member_number IS DISTINCT FROM OLD.member_number
       OR NEW.cahier_charges IS DISTINCT FROM OLD.cahier_charges OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Seul un administrateur peut modifier la fonction, le rang ou le statut.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_member_self_update BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.guard_member_self_update();