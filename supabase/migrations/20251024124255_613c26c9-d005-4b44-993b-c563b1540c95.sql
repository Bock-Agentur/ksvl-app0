-- Fix app_settings RLS to allow public access to login_background only
DROP POLICY IF EXISTS "Authenticated users view settings" ON app_settings;

-- Allow unauthenticated users to read login_background (which is global and needed for login page)
CREATE POLICY "Public can view login background"
ON app_settings FOR SELECT
USING (
  setting_key = 'login_background' 
  AND is_global = true
);

-- Authenticated users can view their own settings and all other global settings
CREATE POLICY "Authenticated users view settings"
ON app_settings FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND ((auth.uid() = user_id) OR (is_global = true))
);