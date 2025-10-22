-- Create theme_settings table for storing design variables
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- e.g. 'ocean-blue', 'coral-pink', 'sea-green'
  category text NOT NULL, -- e.g. 'base', 'slot-status', 'role', 'gradient'
  hsl_value text NOT NULL, -- e.g. '202 85% 23%'
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default theme colors with names
INSERT INTO public.theme_settings (name, category, hsl_value, description, is_default) VALUES
  -- Base named colors
  ('ocean-blue', 'base', '202 85% 23%', 'Hauptfarbe - Tiefes Ozean-Blau', true),
  ('coral-pink', 'base', '348 77% 67%', 'Akzentfarbe - Korallen-Pink', true),
  ('sea-green', 'base', '133 28% 68%', 'Sekundärfarbe - See-Grün', true),
  ('bright-cyan', 'base', '194 99% 47%', 'Highlight - Helles Cyan', true),
  ('light-sea-foam', 'base', '87 66% 84%', 'Hell - Meeresschaum', true),
  
  -- Slot status colors (behalten die aktuellen Werte)
  ('slot-available', 'slot-status', '160 60% 35%', 'Verfügbarer Slot', true),
  ('slot-available-fg', 'slot-status', '160 60% 95%', 'Verfügbar Vordergrund', true),
  ('slot-booked', 'slot-status', '210 80% 35%', 'Gebuchter Slot', true),
  ('slot-booked-fg', 'slot-status', '210 80% 95%', 'Gebucht Vordergrund', true),
  ('slot-blocked', 'slot-status', '0 75% 55%', 'Blockierter Slot', true),
  ('slot-blocked-fg', 'slot-status', '0 75% 95%', 'Blockiert Vordergrund', true),
  
  -- Alternative trendy slot colors
  ('slot-alt-available-bg', 'slot-status-alt', '87 66% 84%', 'Alt. Verfügbar Hintergrund', true),
  ('slot-alt-available-border', 'slot-status-alt', '133 28% 68%', 'Alt. Verfügbar Rahmen', true),
  ('slot-alt-available-text', 'slot-status-alt', '133 28% 48%', 'Alt. Verfügbar Text', true),
  ('slot-alt-booked-bg', 'slot-status-alt', '194 99% 87%', 'Alt. Gebucht Hintergrund', true),
  ('slot-alt-booked-border', 'slot-status-alt', '194 99% 47%', 'Alt. Gebucht Rahmen', true),
  ('slot-alt-booked-text', 'slot-status-alt', '202 85% 23%', 'Alt. Gebucht Text', true),
  ('slot-alt-blocked-bg', 'slot-status-alt', '348 77% 87%', 'Alt. Blockiert Hintergrund', true),
  ('slot-alt-blocked-border', 'slot-status-alt', '348 77% 67%', 'Alt. Blockiert Rahmen', true),
  ('slot-alt-blocked-text', 'slot-status-alt', '348 77% 47%', 'Alt. Blockiert Text', true),
  
  -- Primary theme colors
  ('primary', 'theme', '210 60% 25%', 'Primärfarbe - Deep Navy', true),
  ('primary-foreground', 'theme', '210 25% 98%', 'Primär Vordergrund', true),
  ('secondary', 'theme', '210 40% 88%', 'Sekundärfarbe - Ocean Blue', true),
  ('secondary-foreground', 'theme', '210 60% 25%', 'Sekundär Vordergrund', true),
  
  -- Gradients (stored as CSS strings)
  ('gradient-ocean', 'gradient', 'linear-gradient(135deg, hsl(210, 60%, 45%) 0%, hsl(195, 55%, 60%) 100%)', 'Ozean Gradient', true),
  ('gradient-maritime-sunset', 'gradient', 'linear-gradient(135deg, hsl(348, 77%, 67%) 0%, hsl(194, 99%, 47%) 100%)', 'Maritime Sonnenuntergang', true),
  ('gradient-ocean-breeze', 'gradient', 'linear-gradient(135deg, hsl(202, 85%, 23%) 0%, hsl(133, 28%, 68%) 100%)', 'Ozean Brise', true),
  ('gradient-harbor-mist', 'gradient', 'linear-gradient(180deg, hsl(194, 99%, 87%) 0%, hsl(87, 66%, 84%) 100%)', 'Hafen Nebel', true);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read theme settings
CREATE POLICY "Anyone can read theme settings"
  ON public.theme_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can update theme settings
CREATE POLICY "Admins can update theme settings"
  ON public.theme_settings 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can insert theme settings
CREATE POLICY "Admins can insert theme settings"
  ON public.theme_settings 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete theme settings
CREATE POLICY "Admins can delete theme settings"
  ON public.theme_settings 
  FOR DELETE 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();