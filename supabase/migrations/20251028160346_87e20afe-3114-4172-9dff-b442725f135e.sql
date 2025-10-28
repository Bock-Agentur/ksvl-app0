-- Fix storage_path for existing migrated files in login-media bucket
-- Update the 3 existing entries to have the correct bucket prefix

UPDATE file_metadata
SET storage_path = 'login-media/' || storage_path
WHERE category = 'login_media'
  AND storage_path NOT LIKE 'login-media/%'
  AND 'migrated' = ANY(tags);