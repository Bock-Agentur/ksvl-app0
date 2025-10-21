-- Create custom_fields table for admin-defined fields
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN DEFAULT false,
  placeholder TEXT,
  options TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create custom_field_values table for storing user-specific values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, field_id)
);

-- Enable RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_fields
CREATE POLICY "Everyone can view custom fields"
  ON public.custom_fields
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert custom fields"
  ON public.custom_fields
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update custom fields"
  ON public.custom_fields
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete custom fields"
  ON public.custom_fields
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for custom_field_values
CREATE POLICY "Users can view their own field values"
  ON public.custom_field_values
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all field values"
  ON public.custom_field_values
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own field values"
  ON public.custom_field_values
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert field values for any user"
  ON public.custom_field_values
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own field values"
  ON public.custom_field_values
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any field values"
  ON public.custom_field_values
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own field values"
  ON public.custom_field_values
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any field values"
  ON public.custom_field_values
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_custom_fields_updated_at
  BEFORE UPDATE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();