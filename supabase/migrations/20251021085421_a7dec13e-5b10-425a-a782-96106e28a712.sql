-- Create app_settings table for storing all application settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique constraints
CREATE UNIQUE INDEX app_settings_user_key_idx ON public.app_settings(user_id, setting_key);
CREATE UNIQUE INDEX app_settings_global_key_idx ON public.app_settings(setting_key) WHERE is_global = true;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
ON public.app_settings
FOR SELECT
USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Users can insert their own settings"
ON public.app_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.app_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON public.app_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage global settings
CREATE POLICY "Admins can view all settings"
ON public.app_settings
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert global settings"
ON public.app_settings
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update global settings"
ON public.app_settings
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any settings"
ON public.app_settings
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();