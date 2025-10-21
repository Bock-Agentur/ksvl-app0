-- Add is_test_data flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Add is_test_data flag to slots table
ALTER TABLE public.slots 
ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Create index for better performance when filtering test data
CREATE INDEX IF NOT EXISTS idx_profiles_is_test_data ON public.profiles(is_test_data);
CREATE INDEX IF NOT EXISTS idx_slots_is_test_data ON public.slots(is_test_data);