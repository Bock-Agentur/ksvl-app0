-- Revert the 'user' column back to 'name' and keep the new address fields
ALTER TABLE public.profiles 
  RENAME COLUMN "user" TO name;

-- The new address fields (first_name, last_name, street_address, postal_code, city) remain as they are