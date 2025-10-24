-- Fix app_settings RLS policy to require authentication
DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;

CREATE POLICY "Authenticated users view settings"
ON app_settings FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND ((auth.uid() = user_id) OR (is_global = true))
);