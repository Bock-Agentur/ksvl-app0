-- Füge neue Felder für Vorstandsmitglieder hinzu
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS vorstand_funktion text,
ADD COLUMN IF NOT EXISTS contact_public_in_ksvl boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.vorstand_funktion IS 'Funktion im Vorstand (z.B. Obmann, Kassier, Schriftführer)';
COMMENT ON COLUMN public.profiles.contact_public_in_ksvl IS 'Email und Telefonnummer öffentlich im KSVL sichtbar';