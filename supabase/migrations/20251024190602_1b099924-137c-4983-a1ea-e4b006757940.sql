-- Drop the old berth_type check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_berth_type_check;

-- Add new check constraint with correct allowed values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_berth_type_check 
  CHECK (berth_type IS NULL OR berth_type IN ('schwimmsteg', 'festliegeplatz', 'bojenplatz', 'trockenplatz'));