-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Set username for admin account
UPDATE public.profiles 
SET username = 'hjoerg' 
WHERE email = 'h@jorgson.com';

-- Add comment
COMMENT ON COLUMN public.profiles.username IS 'Unique username for login (alternative to email)';