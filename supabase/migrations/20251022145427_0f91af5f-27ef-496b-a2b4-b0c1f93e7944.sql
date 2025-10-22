-- Update all role badge settings to Ocean Blue with white text
UPDATE role_badge_settings 
SET 
  bg_color = 'hsl(202, 85%, 23%)',
  text_color = 'hsl(0, 0%, 100%)',
  updated_at = now()
WHERE role IN ('admin', 'vorstand', 'kranfuehrer', 'mitglied', 'gastmitglied');