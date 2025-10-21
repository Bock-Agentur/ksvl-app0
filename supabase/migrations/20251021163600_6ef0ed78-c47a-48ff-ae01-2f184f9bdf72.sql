-- Add unique constraints for app_settings table
-- This allows upsert operations to work correctly

-- For user-specific settings, ensure uniqueness on (user_id, setting_key)
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_user_key_unique 
ON app_settings (user_id, setting_key) 
WHERE user_id IS NOT NULL AND is_global = false;

-- For global settings, ensure uniqueness on (setting_key)
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_global_key_unique 
ON app_settings (setting_key) 
WHERE is_global = true AND user_id IS NULL;