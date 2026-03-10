-- ============================================================================
-- KSVL Slot Manager - Vollständiger Datenbank-Dump
-- Version: 2026-03-10 (bereinigt: 7 Tabellen)
-- ============================================================================

-- ============================================================================
-- TEIL 1: ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'admin',
    'mitglied',
    'kranfuehrer',
    'vorstand',
    'gastmitglied'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TEIL 2: TABELLEN (7 Tabellen)
-- ============================================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    email text NOT NULL,
    name text,
    phone text,
    oesv_number text,
    member_number text,
    address text,
    berth_number text,
    berth_type text,
    boat_name text,
    status text DEFAULT 'active'::text,
    avatar_url text,
    first_name text,
    last_name text,
    street_address text,
    postal_code text,
    city text,
    dinghy_berth_number text,
    boat_type text,
    parking_permit_number text,
    beverage_chip_number text,
    emergency_contact text,
    notes text,
    vorstand_funktion text,
    monday_item_id text,
    username text,
    two_factor_method text DEFAULT 'Aus'::text,
    membership_type text,
    membership_status text DEFAULT 'Aktiv'::text,
    boat_color text,
    beverage_chip_status text DEFAULT 'Aktiv'::text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relationship text,
    document_bfa text,
    document_insurance text,
    document_berth_contract text,
    document_member_photo text,
    board_position_start_date date,
    board_position_end_date date,
    berth_length numeric,
    berth_width numeric,
    buoy_radius numeric,
    has_dinghy_berth boolean DEFAULT false,
    statute_accepted boolean DEFAULT false,
    privacy_accepted boolean DEFAULT false,
    newsletter_optin boolean DEFAULT false,
    membership_status_history jsonb DEFAULT '[]'::jsonb,
    board_position_history jsonb DEFAULT '[]'::jsonb,
    created_by uuid,
    modified_by uuid,
    birth_date date,
    entry_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_test_data boolean DEFAULT false,
    boat_length numeric,
    boat_width numeric,
    parking_permit_issue_date date,
    beverage_chip_issue_date date,
    is_role_user boolean DEFAULT false,
    data_public_in_ksvl boolean DEFAULT false,
    contact_public_in_ksvl boolean DEFAULT false,
    ai_info_enabled boolean DEFAULT false,
    password_change_required boolean DEFAULT false
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, role)
);

-- slots
CREATE TABLE IF NOT EXISTS public.slots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    time time without time zone NOT NULL,
    duration integer NOT NULL,
    crane_operator_id uuid NOT NULL,
    member_id uuid,
    is_booked boolean DEFAULT false,
    is_mini_slot boolean DEFAULT false,
    mini_slot_count integer,
    start_minute integer,
    block_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_test_data boolean DEFAULT false,
    notes text
);

-- app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    is_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- file_metadata
CREATE TABLE IF NOT EXISTS public.file_metadata (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    filename text NOT NULL,
    storage_path text NOT NULL,
    file_type text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint NOT NULL,
    category text NOT NULL,
    document_type text,
    owner_id uuid,
    linked_user_id uuid,
    is_public boolean DEFAULT false,
    tags text[] DEFAULT '{}'::text[],
    description text,
    allowed_roles text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- theme_settings
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    hsl_value text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- role_badge_settings
CREATE TABLE IF NOT EXISTS public.role_badge_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL UNIQUE,
    bg_color text NOT NULL DEFAULT 'hsl(202, 85%, 23%)'::text,
    text_color text NOT NULL DEFAULT 'hsl(0, 0%, 100%)'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- TEIL 2b: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_member_number ON public.profiles(member_number);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON public.slots(date);
CREATE INDEX IF NOT EXISTS idx_slots_crane_operator ON public.slots(crane_operator_id);
CREATE INDEX IF NOT EXISTS idx_slots_member ON public.slots(member_id);
CREATE INDEX IF NOT EXISTS idx_slots_block ON public.slots(block_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_user ON public.app_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_owner ON public.file_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_category ON public.file_metadata(category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_linked_user ON public.file_metadata(linked_user_id);

-- ============================================================================
-- TEIL 3: DATABASE FUNCTIONS
-- ============================================================================

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'mitglied');
  
  RETURN NEW;
END;
$$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- get_email_for_login
CREATE OR REPLACE FUNCTION public.get_email_for_login(username_input text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email FROM profiles WHERE LOWER(username) = LOWER(username_input) LIMIT 1;
$$;

-- can_access_file
CREATE OR REPLACE FUNCTION public.can_access_file(storage_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  file_record RECORD;
  user_has_role BOOLEAN;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO file_record 
  FROM file_metadata 
  WHERE file_metadata.storage_path = can_access_file.storage_path;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF is_admin(current_user_id) THEN
    RETURN TRUE;
  END IF;
  
  IF file_record.owner_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  IF file_record.linked_user_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  IF file_record.is_public THEN
    RETURN TRUE;
  END IF;
  
  IF file_record.allowed_roles IS NOT NULL AND array_length(file_record.allowed_roles, 1) > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = current_user_id
      AND role::text = ANY(file_record.allowed_roles)
    ) INTO user_has_role;
    
    IF user_has_role THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ============================================================================
-- TEIL 4: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_badge_settings ENABLE ROW LEVEL SECURITY;

-- profiles RLS
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all" ON public.profiles FOR SELECT USING ((auth.uid() = id) OR is_admin(auth.uid()) OR has_role(auth.uid(), 'vorstand'::app_role));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- user_roles RLS
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view all roles" ON public.user_roles FOR SELECT USING (true);

-- slots RLS
DROP POLICY IF EXISTS "Admins can delete slots" ON public.slots;
CREATE POLICY "Admins can delete slots" ON public.slots FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Crane operators and admins can update slots" ON public.slots;
CREATE POLICY "Crane operators and admins can update slots" ON public.slots FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'kranfuehrer'::app_role) AND (crane_operator_id = auth.uid())));

DROP POLICY IF EXISTS "Crane operators, vorstand and admins can create slots" ON public.slots;
CREATE POLICY "Crane operators, vorstand and admins can create slots" ON public.slots FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'kranfuehrer'::app_role) OR has_role(auth.uid(), 'vorstand'::app_role));

DROP POLICY IF EXISTS "Everyone can view slots" ON public.slots;
CREATE POLICY "Everyone can view slots" ON public.slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can book slots" ON public.slots;
CREATE POLICY "Members can book slots" ON public.slots FOR UPDATE USING ((NOT is_booked) AND (auth.uid() IS NOT NULL)) WITH CHECK ((member_id = auth.uid()) AND (is_booked = true));

DROP POLICY IF EXISTS "Members can update their own booked slots" ON public.slots;
CREATE POLICY "Members can update their own booked slots" ON public.slots FOR UPDATE USING ((is_booked = true) AND (member_id = auth.uid())) WITH CHECK (member_id = auth.uid());

-- app_settings RLS
DROP POLICY IF EXISTS "Admins can delete any settings" ON public.app_settings;
CREATE POLICY "Admins can delete any settings" ON public.app_settings FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert global settings" ON public.app_settings;
CREATE POLICY "Admins can insert global settings" ON public.app_settings FOR INSERT WITH CHECK (is_admin(auth.uid()) AND (is_global = true));

DROP POLICY IF EXISTS "Admins can update global settings" ON public.app_settings;
CREATE POLICY "Admins can update global settings" ON public.app_settings FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all settings" ON public.app_settings;
CREATE POLICY "Admins can view all settings" ON public.app_settings FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users view settings" ON public.app_settings;
CREATE POLICY "Authenticated users view settings" ON public.app_settings FOR SELECT USING ((auth.uid() IS NOT NULL) AND ((auth.uid() = user_id) OR (is_global = true)));

DROP POLICY IF EXISTS "Public can view login background" ON public.app_settings;
CREATE POLICY "Public can view login background" ON public.app_settings FOR SELECT USING ((setting_key = 'login_background'::text) AND (is_global = true));

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.app_settings;
CREATE POLICY "Users can delete their own settings" ON public.app_settings FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.app_settings;
CREATE POLICY "Users can insert their own settings" ON public.app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.app_settings;
CREATE POLICY "Users can update their own settings" ON public.app_settings FOR UPDATE USING (auth.uid() = user_id);

-- file_metadata RLS
DROP POLICY IF EXISTS "Admins can delete files" ON public.file_metadata;
CREATE POLICY "Admins can delete files" ON public.file_metadata FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert files" ON public.file_metadata;
CREATE POLICY "Admins can insert files" ON public.file_metadata FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update files" ON public.file_metadata;
CREATE POLICY "Admins can update files" ON public.file_metadata FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all files" ON public.file_metadata;
CREATE POLICY "Admins can view all files" ON public.file_metadata FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view public files" ON public.file_metadata;
CREATE POLICY "Anyone can view public files" ON public.file_metadata FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can delete own files" ON public.file_metadata;
CREATE POLICY "Users can delete own files" ON public.file_metadata FOR DELETE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own files" ON public.file_metadata;
CREATE POLICY "Users can update own files" ON public.file_metadata FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can upload own files" ON public.file_metadata;
CREATE POLICY "Users can upload own files" ON public.file_metadata FOR INSERT WITH CHECK ((owner_id = auth.uid()) AND ((linked_user_id IS NULL) OR (linked_user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can view linked files" ON public.file_metadata;
CREATE POLICY "Users can view linked files" ON public.file_metadata FOR SELECT USING (linked_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own files" ON public.file_metadata;
CREATE POLICY "Users can view own files" ON public.file_metadata FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view role-allowed files" ON public.file_metadata;
CREATE POLICY "Users can view role-allowed files" ON public.file_metadata FOR SELECT USING (
  is_admin(auth.uid()) OR 
  (owner_id = auth.uid()) OR 
  (linked_user_id = auth.uid()) OR 
  (is_public = true) OR 
  ((allowed_roles IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (file_metadata.allowed_roles))
  )))
);

-- theme_settings RLS
DROP POLICY IF EXISTS "Admins can delete theme settings" ON public.theme_settings;
CREATE POLICY "Admins can delete theme settings" ON public.theme_settings FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert theme settings" ON public.theme_settings;
CREATE POLICY "Admins can insert theme settings" ON public.theme_settings FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update theme settings" ON public.theme_settings;
CREATE POLICY "Admins can update theme settings" ON public.theme_settings FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read theme settings" ON public.theme_settings;
CREATE POLICY "Anyone can read theme settings" ON public.theme_settings FOR SELECT USING (true);

-- role_badge_settings RLS
DROP POLICY IF EXISTS "Admins can update role badge settings" ON public.role_badge_settings;
CREATE POLICY "Admins can update role badge settings" ON public.role_badge_settings FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read role badge settings" ON public.role_badge_settings;
CREATE POLICY "Anyone can read role badge settings" ON public.role_badge_settings FOR SELECT USING (true);

-- ============================================================================
-- TEIL 5: SEED DATA
-- ============================================================================

-- theme_settings
INSERT INTO public.theme_settings (id, name, category, hsl_value, description, is_default, created_at, updated_at) VALUES
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'primary', 'brand', '202 85% 23%', 'Haupt-Markenfarbe (KSVL Navy)', true, now(), now()),
('d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', 'secondary', 'brand', '180 50% 45%', 'Sekundärfarbe (Türkis)', true, now(), now()),
('e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', 'accent', 'brand', '45 90% 55%', 'Akzentfarbe (Gold)', true, now(), now()),
('f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', 'background', 'surface', '200 20% 98%', 'Hintergrundfarbe (Hell)', true, now(), now()),
('a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'foreground', 'surface', '202 85% 15%', 'Textfarbe (Dunkel)', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- role_badge_settings
INSERT INTO public.role_badge_settings (id, role, bg_color, text_color, created_at, updated_at) VALUES
('b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', 'admin', 'hsl(0, 70%, 50%)', 'hsl(0, 0%, 100%)', now(), now()),
('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 'vorstand', 'hsl(45, 90%, 50%)', 'hsl(0, 0%, 15%)', now(), now()),
('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', 'kranfuehrer', 'hsl(202, 85%, 40%)', 'hsl(0, 0%, 100%)', now(), now()),
('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', 'mitglied', 'hsl(202, 85%, 23%)', 'hsl(0, 0%, 100%)', now(), now()),
('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', 'gastmitglied', 'hsl(180, 30%, 50%)', 'hsl(0, 0%, 100%)', now(), now())
ON CONFLICT (id) DO NOTHING;

-- app_settings (Defaults)
INSERT INTO public.app_settings (id, user_id, setting_key, setting_value, is_global, created_at, updated_at) VALUES
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', NULL, 'login_background', '{"mode": "gradient", "gradient": {"from": "hsl(202, 85%, 15%)", "to": "hsl(202, 70%, 35%)", "direction": "to-br"}, "overlay": {"enabled": true, "opacity": 0.3}}', true, now(), now()),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', NULL, 'header_message', '{"enabled": true, "message": "Willkommen beim KSVL Slot Manager!", "type": "info"}', true, now(), now()),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', NULL, 'show_test_data', '{"enabled": false}', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEIL 6: STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('login-media', 'login-media', true, 52428800, 
   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']),
  ('documents', 'documents', false, 10485760, 
   ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('member-documents', 'member-documents', false, 10485760, 
   ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEIL 7: STORAGE RLS POLICIES
-- ============================================================================

-- login-media Bucket
DROP POLICY IF EXISTS "Public can view login-media" ON storage.objects;
CREATE POLICY "Public can view login-media" ON storage.objects FOR SELECT USING (bucket_id = 'login-media');

DROP POLICY IF EXISTS "Admins can upload to login-media" ON storage.objects;
CREATE POLICY "Admins can upload to login-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'login-media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update login-media" ON storage.objects;
CREATE POLICY "Admins can update login-media" ON storage.objects FOR UPDATE USING (bucket_id = 'login-media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete from login-media" ON storage.objects;
CREATE POLICY "Admins can delete from login-media" ON storage.objects FOR DELETE USING (bucket_id = 'login-media' AND public.is_admin(auth.uid()));

-- documents Bucket
DROP POLICY IF EXISTS "Users can view documents via RBAC" ON storage.objects;
CREATE POLICY "Users can view documents via RBAC" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND public.can_access_file(name));

DROP POLICY IF EXISTS "Admins can manage documents" ON storage.objects;
CREATE POLICY "Admins can manage documents" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND public.is_admin(auth.uid()));

-- member-documents Bucket
DROP POLICY IF EXISTS "Users can view member-documents via RBAC" ON storage.objects;
CREATE POLICY "Users can view member-documents via RBAC" ON storage.objects FOR SELECT USING (bucket_id = 'member-documents' AND public.can_access_file(name));

DROP POLICY IF EXISTS "Users can upload own member-documents" ON storage.objects;
CREATE POLICY "Users can upload own member-documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'member-documents' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can manage member-documents" ON storage.objects;
CREATE POLICY "Admins can manage member-documents" ON storage.objects FOR ALL USING (bucket_id = 'member-documents' AND public.is_admin(auth.uid()));

-- ============================================================================
-- TEIL 8: AUTH TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FERTIG! Nächste Schritte:
-- 1. Edge Functions deployen (supabase functions deploy)
-- 2. Secrets konfigurieren (GOOGLE_API_KEY, ADMIN_PASSWORD_RESET_KEY)
-- 3. Admin-User über /setup erstellen
-- ============================================================================
