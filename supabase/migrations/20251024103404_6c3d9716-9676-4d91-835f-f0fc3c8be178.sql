-- Fix #1: Remove public access to profiles and create secure login function

-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Public can view email and name for login" ON public.profiles;

-- Create a SECURITY DEFINER function for login that ONLY returns email for username lookup
CREATE OR REPLACE FUNCTION public.get_email_for_login(username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM profiles WHERE LOWER(name) = LOWER(username) LIMIT 1;
$$;

-- Ensure authenticated-only access to profiles (this policy already exists but verifying)
-- The existing "Authenticated users can view all profiles" policy handles authenticated access