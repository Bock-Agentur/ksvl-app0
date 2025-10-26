-- Entferne die zu restriktive berth_type CHECK Constraint
-- Diese verhindert das Speichern von Profilen mit anderen/leeren berth_type Werten
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_berth_type_check;