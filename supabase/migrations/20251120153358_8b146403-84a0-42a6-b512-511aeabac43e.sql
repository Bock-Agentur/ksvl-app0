-- Phase 1: Add bucket field and clean storagePath in login_background settings

-- Extract bucket from old storagePath and clean the path
UPDATE app_settings
SET setting_value = jsonb_set(
  jsonb_set(
    setting_value,
    '{bucket}',
    CASE 
      WHEN setting_value->>'storagePath' LIKE 'login-media/%' THEN '"login-media"'
      WHEN setting_value->>'storagePath' LIKE 'documents/%' THEN '"documents"'
      ELSE '"documents"'
    END::jsonb
  ),
  '{storagePath}',
  to_jsonb(
    CASE
      WHEN setting_value->>'storagePath' LIKE 'login-media/%' THEN 
        substring(setting_value->>'storagePath' from 13)  -- Remove 'login-media/' prefix (12 chars + 1)
      WHEN setting_value->>'storagePath' LIKE 'documents/%' THEN 
        substring(setting_value->>'storagePath' from 11)  -- Remove 'documents/' prefix (10 chars + 1)
      ELSE 
        setting_value->>'storagePath'
    END
  )
)
WHERE setting_key = 'login_background'
AND setting_value->>'storagePath' IS NOT NULL
AND setting_value->>'storagePath' != '';

-- Set url to null for clean state
UPDATE app_settings
SET setting_value = jsonb_set(
  setting_value,
  '{url}',
  'null'::jsonb
)
WHERE setting_key = 'login_background'
AND setting_value->>'url' IS NOT NULL;