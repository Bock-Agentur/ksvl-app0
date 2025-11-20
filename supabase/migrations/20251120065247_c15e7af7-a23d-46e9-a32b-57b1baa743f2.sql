-- Phase 1: Fix RLS Policy for global settings
DROP POLICY IF EXISTS "Admins can insert global settings" ON app_settings;

CREATE POLICY "Admins can insert global settings"
  ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid()) AND is_global = true
  );

-- Phase 2: Migrate menu-settings to new key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM app_settings 
    WHERE setting_key = 'marina-menu-settings' AND is_global = true
  ) THEN
    INSERT INTO app_settings (setting_key, setting_value, is_global, user_id)
    SELECT 
      'marina-menu-settings-template',
      setting_value,
      is_global,
      user_id
    FROM app_settings
    WHERE setting_key = 'marina-menu-settings' AND is_global = true
    ON CONFLICT DO NOTHING;
    
    DELETE FROM app_settings 
    WHERE setting_key = 'marina-menu-settings' AND is_global = true;
  ELSE
    INSERT INTO app_settings (setting_key, setting_value, is_global, user_id)
    VALUES (
      'marina-menu-settings-template',
      jsonb_build_object(
        'headerItems', jsonb_build_array(
          jsonb_build_object('id', 'settings', 'label', 'Einstellungen', 'icon', 'Settings', 'roles', array['admin'], 'order', 0),
          jsonb_build_object('id', 'users', 'label', 'Mitglieder', 'icon', 'Users', 'roles', array['admin'], 'order', 1),
          jsonb_build_object('id', 'slots', 'label', 'Slot Manager', 'icon', 'Layers', 'roles', array['admin'], 'order', 2),
          jsonb_build_object('id', 'file-manager', 'label', 'Dateimanager', 'icon', 'FolderOpen', 'roles', array['admin'], 'order', 3)
        ),
        'defaultRole', 'admin'
      ),
      true,
      NULL
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Phase 3: Clean up dashboard settings duplicates
DELETE FROM app_settings
WHERE setting_key LIKE 'dashboard-settings-template-%'
  AND is_global = false;

INSERT INTO app_settings (setting_key, is_global, user_id, setting_value)
VALUES
  ('dashboard-settings-template-admin', true, NULL, '{"enabledSections": ["headerCard", "stats", "actions", "activity"], "sectionPositions": {}}'),
  ('dashboard-settings-template-mitglied', true, NULL, '{"enabledSections": ["headerCard", "stats", "actions"], "sectionPositions": {}}'),
  ('dashboard-settings-template-kranfuehrer', true, NULL, '{"enabledSections": ["headerCard", "stats", "actions"], "sectionPositions": {}}'),
  ('dashboard-settings-template-vorstand', true, NULL, '{"enabledSections": ["headerCard", "stats", "actions"], "sectionPositions": {}}'),
  ('dashboard-settings-template-gastmitglied', true, NULL, '{"enabledSections": ["headerCard"], "sectionPositions": {}}')
ON CONFLICT DO NOTHING;

-- Phase 4: Initialize consecutive slots settings
INSERT INTO app_settings (setting_key, setting_value, is_global, user_id)
VALUES (
  'consecutiveSlotsEnabled',
  'true',
  true,
  NULL
)
ON CONFLICT DO NOTHING;