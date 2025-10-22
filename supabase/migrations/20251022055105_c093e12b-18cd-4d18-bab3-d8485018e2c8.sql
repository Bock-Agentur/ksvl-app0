-- Add is_role_user field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_role_user BOOLEAN DEFAULT FALSE;