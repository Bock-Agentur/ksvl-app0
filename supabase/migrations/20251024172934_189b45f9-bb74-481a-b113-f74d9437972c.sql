-- Drop old function and create new one with correct column
DROP FUNCTION IF EXISTS public.get_email_for_login(text);

CREATE OR REPLACE FUNCTION public.get_email_for_login(username_input text)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT email FROM profiles WHERE LOWER(username) = LOWER(username_input) LIMIT 1;
$$;