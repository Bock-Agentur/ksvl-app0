-- Feld für öffentliche Datensichtbarkeit hinzufügen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_public_in_ksvl boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.data_public_in_ksvl IS 'Gibt an, ob die Mitgliederdaten öffentlich im KSVL-Chatbot sichtbar sind';