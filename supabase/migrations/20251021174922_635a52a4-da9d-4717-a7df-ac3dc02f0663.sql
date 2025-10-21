-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gastmitglied';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vorstand';