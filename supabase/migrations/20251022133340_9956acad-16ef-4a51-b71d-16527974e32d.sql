-- Create role_badge_settings table
CREATE TABLE public.role_badge_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text UNIQUE NOT NULL,
  bg_color text NOT NULL DEFAULT 'hsl(202, 85%, 23%)',
  text_color text NOT NULL DEFAULT 'hsl(0, 0%, 100%)',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default values for all roles
INSERT INTO public.role_badge_settings (role, bg_color, text_color) VALUES
  ('gastmitglied', 'hsl(210, 16%, 82%)', 'hsl(215, 20%, 40%)'),
  ('mitglied', 'hsl(220, 13%, 91%)', 'hsl(215, 20%, 40%)'),
  ('kranfuehrer', 'hsl(202, 85%, 23%)', 'hsl(0, 0%, 100%)'),
  ('admin', 'hsl(201, 85%, 16%)', 'hsl(0, 0%, 100%)'),
  ('vorstand', 'hsl(201, 85%, 16%)', 'hsl(0, 0%, 100%)');

-- Enable RLS
ALTER TABLE public.role_badge_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read role badge settings
CREATE POLICY "Anyone can read role badge settings"
  ON public.role_badge_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can update role badge settings
CREATE POLICY "Admins can update role badge settings"
  ON public.role_badge_settings 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_role_badge_settings_updated_at
  BEFORE UPDATE ON public.role_badge_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();