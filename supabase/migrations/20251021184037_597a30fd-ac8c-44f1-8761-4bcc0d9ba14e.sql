-- Rename 'name' column to 'user' and add new address fields
ALTER TABLE public.profiles 
  RENAME COLUMN name TO "user";

-- Add new address-related columns
ALTER TABLE public.profiles
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN street_address text,
  ADD COLUMN postal_code text,
  ADD COLUMN city text;