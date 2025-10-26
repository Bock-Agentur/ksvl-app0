-- =====================================================
-- KSVL Mitgliederstruktur Erweiterung - Migration
-- =====================================================

-- 1. Neue Spalten zur profiles-Tabelle hinzufügen
-- Zugangsdaten
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_change_required boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_method text DEFAULT 'Aus';

-- Mitgliedschaft
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_status text DEFAULT 'Aktiv';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS board_position_start_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS board_position_end_date date;

-- Boot & Liegeplatz
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boat_color text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS berth_length numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS berth_width numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buoy_radius numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_dinghy_berth boolean DEFAULT false;

-- Parkplatz & Getränkechip
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beverage_chip_status text DEFAULT 'Aktiv';

-- Datenschutz
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS statute_accepted boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_accepted boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_optin boolean DEFAULT false;

-- Notfallkontakt (erweitert)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;

-- Dokumente (URLs zu Storage)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_bfa text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_insurance text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_berth_contract text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS document_member_photo text;

-- Historie & Verwaltung
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_status_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS board_position_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS modified_by uuid;

-- 2. Storage Bucket für Mitgliederdokumente erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-documents',
  'member-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies für Dokumente
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'member-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload any documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'member-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'member-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-documents' AND public.is_admin(auth.uid()));

-- 4. Custom Fields für alle neuen Felder erstellen
-- Diese werden gruppiert nach Bereichen eingefügt

-- Zugangsdaten
INSERT INTO custom_fields (name, label, type, required, "group", "order", placeholder)
VALUES
  ('password_change_required', 'Passwort ändern erforderlich', 'select', false, 'Zugangsdaten', 1, NULL),
  ('two_factor_method', '2FA-Methode', 'select', false, 'Zugangsdaten', 2, 'Wähle 2FA-Methode')
ON CONFLICT (name) DO NOTHING;

-- Options für die Select-Felder setzen
UPDATE custom_fields SET options = ARRAY['Ja', 'Nein'] WHERE name = 'password_change_required';
UPDATE custom_fields SET options = ARRAY['Aus', 'TOTP', 'SMS'] WHERE name = 'two_factor_method';

-- Mitgliedschaft
INSERT INTO custom_fields (name, label, type, required, "group", "order", placeholder)
VALUES
  ('membership_type', 'Mitgliedsart', 'select', false, 'Mitgliedschaft', 1, 'Wähle Mitgliedsart'),
  ('membership_status', 'Vereinsstatus', 'select', false, 'Mitgliedschaft', 2, 'Wähle Status'),
  ('board_position_start_date', 'Amtsbeginn', 'date', false, 'Mitgliedschaft', 3, NULL),
  ('board_position_end_date', 'Amtsende', 'date', false, 'Mitgliedschaft', 4, NULL)
ON CONFLICT (name) DO NOTHING;

UPDATE custom_fields SET options = ARRAY['Ordentlich', 'Außerordentlich', 'Ehrenmitglied', 'Jugend', 'Gast'] WHERE name = 'membership_type';
UPDATE custom_fields SET options = ARRAY['Aktiv', 'Probezeit', 'Ruhend', 'Beendet (Austritt)', 'Gestrichen', 'Ausgeschlossen'] WHERE name = 'membership_status';

-- Boot & Liegeplatz
INSERT INTO custom_fields (name, label, type, required, "group", "order", placeholder)
VALUES
  ('boat_color', 'Bootfarbe', 'text', false, 'Boot', 1, 'z.B. Weiß'),
  ('berth_length', 'Liegeplatz Länge (m)', 'number', false, 'Liegeplatz', 1, 'z.B. 8.5'),
  ('berth_width', 'Liegeplatz Breite (m)', 'number', false, 'Liegeplatz', 2, 'z.B. 3.0'),
  ('buoy_radius', 'Bojenradius (m)', 'number', false, 'Liegeplatz', 3, 'z.B. 5.0'),
  ('has_dinghy_berth', 'Dingi Liegeplatz', 'select', false, 'Liegeplatz', 4, 'Hat Dingi Liegeplatz?')
ON CONFLICT (name) DO NOTHING;

UPDATE custom_fields SET options = ARRAY['Ja', 'Nein'] WHERE name = 'has_dinghy_berth';

-- Parkplatz & Getränkechip
INSERT INTO custom_fields (name, label, type, required, "group", "order")
VALUES
  ('beverage_chip_status', 'Getränkechip Status', 'select', false, 'Sonstiges', 1)
ON CONFLICT (name) DO NOTHING;

UPDATE custom_fields SET options = ARRAY['Aktiv', 'Gesperrt', 'Verlust'] WHERE name = 'beverage_chip_status';

-- Datenschutz
INSERT INTO custom_fields (name, label, type, required, "group", "order")
VALUES
  ('statute_accepted', 'Satzung akzeptiert', 'select', false, 'Sonstiges', 10),
  ('privacy_accepted', 'Datenschutz akzeptiert', 'select', false, 'Sonstiges', 11),
  ('newsletter_optin', 'Newsletter Opt-in', 'select', false, 'Sonstiges', 12)
ON CONFLICT (name) DO NOTHING;

UPDATE custom_fields SET options = ARRAY['Ja', 'Nein'] WHERE name = 'statute_accepted';
UPDATE custom_fields SET options = ARRAY['Ja', 'Nein'] WHERE name = 'privacy_accepted';
UPDATE custom_fields SET options = ARRAY['Ja', 'Nein'] WHERE name = 'newsletter_optin';

-- Notfallkontakt
INSERT INTO custom_fields (name, label, type, required, "group", "order", placeholder)
VALUES
  ('emergency_contact_name', 'Notfallkontakt Name', 'text', false, 'Sonstiges', 20, 'Name des Notfallkontakts'),
  ('emergency_contact_phone', 'Notfallkontakt Telefon', 'phone', false, 'Sonstiges', 21, '+43 123 456789'),
  ('emergency_contact_relationship', 'Notfallkontakt Beziehung', 'text', false, 'Sonstiges', 22, 'z.B. Ehepartner, Kind')
ON CONFLICT (name) DO NOTHING;

-- Bestehende Felder aktualisieren für bessere Gruppierung
UPDATE custom_fields SET "group" = 'Kontakt' WHERE name IN ('first_name', 'last_name', 'email', 'phone', 'street_address', 'postal_code', 'city');
UPDATE custom_fields SET "group" = 'Persönlich' WHERE name = 'birth_date';
UPDATE custom_fields SET "group" = 'Mitgliedschaft' WHERE name IN ('member_number', 'entry_date', 'oesv_number', 'vorstand_funktion', 'status');
UPDATE custom_fields SET "group" = 'Boot' WHERE name IN ('boat_name', 'boat_type', 'boat_length', 'boat_width');
UPDATE custom_fields SET "group" = 'Liegeplatz' WHERE name IN ('berth_number', 'berth_type', 'dinghy_berth_number');

-- Vorstand Funktion Options erweitern
UPDATE custom_fields SET options = ARRAY['Keine', 'Obmann', 'Obmann-Stellvertreter', 'Schriftführer', 'Kassier', 'Beirat'] WHERE name = 'vorstand_funktion';

-- Bootstyp Options erweitern
UPDATE custom_fields SET options = ARRAY['Jolle', 'Kielboot', 'Yacht', 'Katamaran', 'Surfer/SUP', 'Sonstiges'] WHERE name = 'boat_type';

-- Liegeplatz Typ Options erweitern
UPDATE custom_fields SET options = ARRAY['Steg', 'Boje', 'Trailer/Slip', 'Winterlager', 'Gast'] WHERE name = 'berth_type';