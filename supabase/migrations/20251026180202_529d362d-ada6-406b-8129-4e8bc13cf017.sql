-- Migration: Clean up duplicate custom fields
-- Step 1: Migrate any existing custom field values to profiles table
-- This ensures no data is lost during cleanup

-- Migrate first_name
UPDATE profiles p
SET first_name = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'first_name'
  AND p.id = cfv.user_id
  AND (p.first_name IS NULL OR p.first_name = '');

-- Migrate last_name
UPDATE profiles p
SET last_name = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'last_name'
  AND p.id = cfv.user_id
  AND (p.last_name IS NULL OR p.last_name = '');

-- Migrate phone
UPDATE profiles p
SET phone = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'phone'
  AND p.id = cfv.user_id
  AND (p.phone IS NULL OR p.phone = '');

-- Migrate street_address
UPDATE profiles p
SET street_address = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'street_address'
  AND p.id = cfv.user_id
  AND (p.street_address IS NULL OR p.street_address = '');

-- Migrate postal_code
UPDATE profiles p
SET postal_code = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'postal_code'
  AND p.id = cfv.user_id
  AND (p.postal_code IS NULL OR p.postal_code = '');

-- Migrate city
UPDATE profiles p
SET city = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'city'
  AND p.id = cfv.user_id
  AND (p.city IS NULL OR p.city = '');

-- Migrate boat_name
UPDATE profiles p
SET boat_name = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'boat_name'
  AND p.id = cfv.user_id
  AND (p.boat_name IS NULL OR p.boat_name = '');

-- Migrate boat_type
UPDATE profiles p
SET boat_type = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'boat_type'
  AND p.id = cfv.user_id
  AND (p.boat_type IS NULL OR p.boat_type = '');

-- Migrate boat_color
UPDATE profiles p
SET boat_color = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'boat_color'
  AND p.id = cfv.user_id
  AND (p.boat_color IS NULL OR p.boat_color = '');

-- Migrate member_number
UPDATE profiles p
SET member_number = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'member_number'
  AND p.id = cfv.user_id
  AND (p.member_number IS NULL OR p.member_number = '');

-- Migrate oesv_number
UPDATE profiles p
SET oesv_number = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'oesv_number'
  AND p.id = cfv.user_id
  AND (p.oesv_number IS NULL OR p.oesv_number = '');

-- Migrate berth_number
UPDATE profiles p
SET berth_number = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'berth_number'
  AND p.id = cfv.user_id
  AND (p.berth_number IS NULL OR p.berth_number = '');

-- Migrate berth_type
UPDATE profiles p
SET berth_type = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'berth_type'
  AND p.id = cfv.user_id
  AND (p.berth_type IS NULL OR p.berth_type = '');

-- Migrate emergency_contact_name
UPDATE profiles p
SET emergency_contact_name = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'emergency_contact_name'
  AND p.id = cfv.user_id
  AND (p.emergency_contact_name IS NULL OR p.emergency_contact_name = '');

-- Migrate emergency_contact_phone
UPDATE profiles p
SET emergency_contact_phone = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'emergency_contact_phone'
  AND p.id = cfv.user_id
  AND (p.emergency_contact_phone IS NULL OR p.emergency_contact_phone = '');

-- Migrate emergency_contact_relationship
UPDATE profiles p
SET emergency_contact_relationship = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'emergency_contact_relationship'
  AND p.id = cfv.user_id
  AND (p.emergency_contact_relationship IS NULL OR p.emergency_contact_relationship = '');

-- Migrate notes
UPDATE profiles p
SET notes = cfv.value
FROM custom_field_values cfv
JOIN custom_fields cf ON cfv.field_id = cf.id
WHERE cf.name = 'notes'
  AND p.id = cfv.user_id
  AND (p.notes IS NULL OR p.notes = '');

-- Step 2: Delete all custom field values
DELETE FROM custom_field_values;

-- Step 3: Delete all custom fields
DELETE FROM custom_fields;