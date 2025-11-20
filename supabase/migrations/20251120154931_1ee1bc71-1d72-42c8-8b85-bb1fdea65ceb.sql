-- Korrigiere den bucket Wert für login_background
-- Alle File Manager Dateien liegen im documents Bucket
UPDATE app_settings
SET setting_value = jsonb_set(
  setting_value,
  '{bucket}',
  '"documents"'
)
WHERE setting_key = 'login_background'
AND setting_value->>'bucket' IS NOT NULL;