-- Monday.com Konfiguration (noch leer, wird später befüllt)
CREATE TABLE IF NOT EXISTS monday_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id text,
  api_key_set boolean DEFAULT false,
  column_mapping jsonb DEFAULT '{}',
  auto_sync_enabled boolean DEFAULT false,
  webhook_url text,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Sync-Protokoll (für später)
CREATE TABLE IF NOT EXISTS monday_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  direction text NOT NULL,
  board_id text,
  item_id text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  success boolean NOT NULL,
  error_details jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE monday_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monday_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Nur Admins
CREATE POLICY "Admins can manage monday_settings"
  ON monday_settings FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view monday_sync_logs"
  ON monday_sync_logs FOR SELECT
  USING (is_admin(auth.uid()));

-- Verbindung zu Monday.com Item (für später)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monday_item_id text UNIQUE;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_profiles_monday_item_id ON profiles(monday_item_id);

-- Custom Fields erweitern
ALTER TABLE custom_fields ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
ALTER TABLE custom_fields ADD COLUMN IF NOT EXISTS "group" text;
ALTER TABLE custom_fields ADD COLUMN IF NOT EXISTS monday_column_id text;

-- Custom Fields für alle wichtigen User-Felder erstellen
INSERT INTO custom_fields (name, label, type, required, placeholder, "order", "group") VALUES
  ('phone', 'Telefon', 'text', false, '+43 123 456789', 1, 'Kontakt'),
  ('street_address', 'Straße & Hausnummer', 'text', false, 'Musterstraße 1', 2, 'Kontakt'),
  ('postal_code', 'PLZ', 'text', false, '1010', 3, 'Kontakt'),
  ('city', 'Stadt', 'text', false, 'Wien', 4, 'Kontakt'),
  ('emergency_contact', 'Notfallkontakt', 'textarea', false, 'Name, Telefon', 5, 'Kontakt'),
  ('birth_date', 'Geburtsdatum', 'date', false, null, 6, 'Persönlich'),
  ('entry_date', 'Eintrittsdatum', 'date', false, null, 7, 'Mitgliedschaft'),
  ('oesv_number', 'ÖSV Nummer', 'text', false, '12345', 8, 'Mitgliedschaft'),
  ('vorstand_funktion', 'Vorstand Funktion', 'text', false, null, 9, 'Mitgliedschaft'),
  ('boat_name', 'Bootsname', 'text', false, 'Mein Boot', 10, 'Boot'),
  ('boat_type', 'Bootstyp', 'text', false, 'Segelboot', 11, 'Boot'),
  ('boat_length', 'Bootslänge (m)', 'number', false, '8.5', 12, 'Boot'),
  ('boat_width', 'Bootsbreite (m)', 'number', false, '2.5', 13, 'Boot'),
  ('berth_number', 'Liegeplatz Nummer', 'text', false, '42', 14, 'Liegeplatz'),
  ('berth_type', 'Liegeplatz Typ', 'text', false, 'Wasser', 15, 'Liegeplatz'),
  ('dinghy_berth_number', 'Dingi Liegeplatz', 'text', false, null, 16, 'Liegeplatz'),
  ('parking_permit_number', 'Parkausweis Nummer', 'text', false, 'P-123', 17, 'Sonstiges'),
  ('parking_permit_issue_date', 'Parkausweis Ausstellungsdatum', 'date', false, null, 18, 'Sonstiges'),
  ('beverage_chip_number', 'Getränkechip Nummer', 'text', false, 'G-456', 19, 'Sonstiges'),
  ('beverage_chip_issue_date', 'Getränkechip Ausstellungsdatum', 'date', false, null, 20, 'Sonstiges'),
  ('notes', 'Notizen', 'textarea', false, null, 21, 'Sonstiges')
ON CONFLICT (name) DO UPDATE SET
  "order" = EXCLUDED."order",
  "group" = EXCLUDED."group";

-- Bestehende Daten zu Custom Field Values migrieren
-- Für jeden User, der bereits Daten in profiles hat
INSERT INTO custom_field_values (user_id, field_id, value)
SELECT 
  p.id as user_id,
  cf.id as field_id,
  CASE cf.name
    WHEN 'phone' THEN p.phone
    WHEN 'boat_name' THEN p.boat_name
    WHEN 'oesv_number' THEN p.oesv_number
    WHEN 'street_address' THEN p.street_address
    WHEN 'postal_code' THEN p.postal_code
    WHEN 'city' THEN p.city
    WHEN 'berth_number' THEN p.berth_number
    WHEN 'berth_type' THEN p.berth_type
    WHEN 'birth_date' THEN p.birth_date::text
    WHEN 'entry_date' THEN p.entry_date::text
    WHEN 'boat_length' THEN p.boat_length::text
    WHEN 'boat_width' THEN p.boat_width::text
    WHEN 'boat_type' THEN p.boat_type
    WHEN 'parking_permit_number' THEN p.parking_permit_number
    WHEN 'beverage_chip_number' THEN p.beverage_chip_number
    WHEN 'parking_permit_issue_date' THEN p.parking_permit_issue_date::text
    WHEN 'beverage_chip_issue_date' THEN p.beverage_chip_issue_date::text
    WHEN 'emergency_contact' THEN p.emergency_contact
    WHEN 'notes' THEN p.notes
    WHEN 'vorstand_funktion' THEN p.vorstand_funktion
    WHEN 'dinghy_berth_number' THEN p.dinghy_berth_number
  END as value
FROM profiles p
CROSS JOIN custom_fields cf
WHERE cf.name IN (
  'phone', 'boat_name', 'oesv_number', 'street_address', 'postal_code', 
  'city', 'berth_number', 'berth_type', 'birth_date', 'entry_date', 
  'boat_length', 'boat_width', 'boat_type', 'parking_permit_number', 
  'beverage_chip_number', 'parking_permit_issue_date', 
  'beverage_chip_issue_date', 'emergency_contact', 'notes', 
  'vorstand_funktion', 'dinghy_berth_number'
)
AND (
  CASE cf.name
    WHEN 'phone' THEN p.phone IS NOT NULL
    WHEN 'boat_name' THEN p.boat_name IS NOT NULL
    WHEN 'oesv_number' THEN p.oesv_number IS NOT NULL
    WHEN 'street_address' THEN p.street_address IS NOT NULL
    WHEN 'postal_code' THEN p.postal_code IS NOT NULL
    WHEN 'city' THEN p.city IS NOT NULL
    WHEN 'berth_number' THEN p.berth_number IS NOT NULL
    WHEN 'berth_type' THEN p.berth_type IS NOT NULL
    WHEN 'birth_date' THEN p.birth_date IS NOT NULL
    WHEN 'entry_date' THEN p.entry_date IS NOT NULL
    WHEN 'boat_length' THEN p.boat_length IS NOT NULL
    WHEN 'boat_width' THEN p.boat_width IS NOT NULL
    WHEN 'boat_type' THEN p.boat_type IS NOT NULL
    WHEN 'parking_permit_number' THEN p.parking_permit_number IS NOT NULL
    WHEN 'beverage_chip_number' THEN p.beverage_chip_number IS NOT NULL
    WHEN 'parking_permit_issue_date' THEN p.parking_permit_issue_date IS NOT NULL
    WHEN 'beverage_chip_issue_date' THEN p.beverage_chip_issue_date IS NOT NULL
    WHEN 'emergency_contact' THEN p.emergency_contact IS NOT NULL
    WHEN 'notes' THEN p.notes IS NOT NULL
    WHEN 'vorstand_funktion' THEN p.vorstand_funktion IS NOT NULL
    WHEN 'dinghy_berth_number' THEN p.dinghy_berth_number IS NOT NULL
  END
)
ON CONFLICT (user_id, field_id) DO NOTHING;