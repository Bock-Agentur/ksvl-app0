-- Migration: Copy profile data to custom_field_values
-- This migration moves data from hardcoded profiles columns to the flexible custom_fields system

DO $$
DECLARE
  phone_field_id UUID;
  street_address_field_id UUID;
  postal_code_field_id UUID;
  city_field_id UUID;
  emergency_contact_field_id UUID;
  birth_date_field_id UUID;
  oesv_number_field_id UUID;
  entry_date_field_id UUID;
  vorstand_funktion_field_id UUID;
  boat_name_field_id UUID;
  boat_type_field_id UUID;
  boat_length_field_id UUID;
  boat_width_field_id UUID;
  berth_number_field_id UUID;
  berth_type_field_id UUID;
  dinghy_berth_number_field_id UUID;
  parking_permit_number_field_id UUID;
  parking_permit_issue_date_field_id UUID;
  beverage_chip_number_field_id UUID;
  beverage_chip_issue_date_field_id UUID;
  notes_field_id UUID;
BEGIN
  -- Get all custom field IDs
  SELECT id INTO phone_field_id FROM custom_fields WHERE name = 'phone' LIMIT 1;
  SELECT id INTO street_address_field_id FROM custom_fields WHERE name = 'street_address' LIMIT 1;
  SELECT id INTO postal_code_field_id FROM custom_fields WHERE name = 'postal_code' LIMIT 1;
  SELECT id INTO city_field_id FROM custom_fields WHERE name = 'city' LIMIT 1;
  SELECT id INTO emergency_contact_field_id FROM custom_fields WHERE name = 'emergency_contact' LIMIT 1;
  SELECT id INTO birth_date_field_id FROM custom_fields WHERE name = 'birth_date' LIMIT 1;
  SELECT id INTO oesv_number_field_id FROM custom_fields WHERE name = 'oesv_number' LIMIT 1;
  SELECT id INTO entry_date_field_id FROM custom_fields WHERE name = 'entry_date' LIMIT 1;
  SELECT id INTO vorstand_funktion_field_id FROM custom_fields WHERE name = 'vorstand_funktion' LIMIT 1;
  SELECT id INTO boat_name_field_id FROM custom_fields WHERE name = 'boat_name' LIMIT 1;
  SELECT id INTO boat_type_field_id FROM custom_fields WHERE name = 'boat_type' LIMIT 1;
  SELECT id INTO boat_length_field_id FROM custom_fields WHERE name = 'boat_length' LIMIT 1;
  SELECT id INTO boat_width_field_id FROM custom_fields WHERE name = 'boat_width' LIMIT 1;
  SELECT id INTO berth_number_field_id FROM custom_fields WHERE name = 'berth_number' LIMIT 1;
  SELECT id INTO berth_type_field_id FROM custom_fields WHERE name = 'berth_type' LIMIT 1;
  SELECT id INTO dinghy_berth_number_field_id FROM custom_fields WHERE name = 'dinghy_berth_number' LIMIT 1;
  SELECT id INTO parking_permit_number_field_id FROM custom_fields WHERE name = 'parking_permit_number' LIMIT 1;
  SELECT id INTO parking_permit_issue_date_field_id FROM custom_fields WHERE name = 'parking_permit_issue_date' LIMIT 1;
  SELECT id INTO beverage_chip_number_field_id FROM custom_fields WHERE name = 'beverage_chip_number' LIMIT 1;
  SELECT id INTO beverage_chip_issue_date_field_id FROM custom_fields WHERE name = 'beverage_chip_issue_date' LIMIT 1;
  SELECT id INTO notes_field_id FROM custom_fields WHERE name = 'notes' LIMIT 1;

  -- Migrate phone
  IF phone_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, phone_field_id, phone::text FROM profiles WHERE phone IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate street_address
  IF street_address_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, street_address_field_id, street_address::text FROM profiles WHERE street_address IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate postal_code
  IF postal_code_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, postal_code_field_id, postal_code::text FROM profiles WHERE postal_code IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate city
  IF city_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, city_field_id, city::text FROM profiles WHERE city IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate emergency_contact
  IF emergency_contact_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, emergency_contact_field_id, emergency_contact::text FROM profiles WHERE emergency_contact IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate birth_date
  IF birth_date_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, birth_date_field_id, birth_date::text FROM profiles WHERE birth_date IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate oesv_number
  IF oesv_number_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, oesv_number_field_id, oesv_number::text FROM profiles WHERE oesv_number IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate entry_date
  IF entry_date_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, entry_date_field_id, entry_date::text FROM profiles WHERE entry_date IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate vorstand_funktion
  IF vorstand_funktion_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, vorstand_funktion_field_id, vorstand_funktion::text FROM profiles WHERE vorstand_funktion IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate boat_name
  IF boat_name_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, boat_name_field_id, boat_name::text FROM profiles WHERE boat_name IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate boat_type
  IF boat_type_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, boat_type_field_id, boat_type::text FROM profiles WHERE boat_type IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate boat_length
  IF boat_length_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, boat_length_field_id, boat_length::text FROM profiles WHERE boat_length IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate boat_width
  IF boat_width_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, boat_width_field_id, boat_width::text FROM profiles WHERE boat_width IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate berth_number
  IF berth_number_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, berth_number_field_id, berth_number::text FROM profiles WHERE berth_number IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate berth_type
  IF berth_type_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, berth_type_field_id, berth_type::text FROM profiles WHERE berth_type IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate dinghy_berth_number
  IF dinghy_berth_number_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, dinghy_berth_number_field_id, dinghy_berth_number::text FROM profiles WHERE dinghy_berth_number IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate parking_permit_number
  IF parking_permit_number_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, parking_permit_number_field_id, parking_permit_number::text FROM profiles WHERE parking_permit_number IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate parking_permit_issue_date
  IF parking_permit_issue_date_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, parking_permit_issue_date_field_id, parking_permit_issue_date::text FROM profiles WHERE parking_permit_issue_date IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate beverage_chip_number
  IF beverage_chip_number_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, beverage_chip_number_field_id, beverage_chip_number::text FROM profiles WHERE beverage_chip_number IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate beverage_chip_issue_date
  IF beverage_chip_issue_date_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, beverage_chip_issue_date_field_id, beverage_chip_issue_date::text FROM profiles WHERE beverage_chip_issue_date IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  -- Migrate notes
  IF notes_field_id IS NOT NULL THEN
    INSERT INTO custom_field_values (user_id, field_id, value)
    SELECT id, notes_field_id, notes::text FROM profiles WHERE notes IS NOT NULL
    ON CONFLICT (user_id, field_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;

  RAISE NOTICE 'Migration completed successfully';
END $$;