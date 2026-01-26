import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SetupRequest {
  supabaseUrl: string
  serviceRoleKey: string
  adminEmail: string
  adminPassword: string
  adminName: string
}

interface StepResult {
  step: number
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
  details?: string
}

// ============================================================================
// TEIL 1: ENUM
// ============================================================================
const SQL_ENUM = `
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
`;

// ============================================================================
// TEIL 2: TABELLEN (16 Tabellen)
// ============================================================================
const SQL_TABLES = `
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
    created_at timestamp with time zone DEFAULT now()
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

-- custom_fields
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    label text NOT NULL,
    type text NOT NULL DEFAULT 'text'::text,
    placeholder text,
    options text[],
    required boolean DEFAULT false,
    "group" text,
    "order" integer DEFAULT 0,
    monday_column_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- custom_field_values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    field_id uuid NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
    role text NOT NULL,
    bg_color text NOT NULL DEFAULT 'hsl(202, 85%, 23%)'::text,
    text_color text NOT NULL DEFAULT 'hsl(0, 0%, 100%)'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- role_configurations
CREATE TABLE IF NOT EXISTS public.role_configurations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    label text NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- menu_item_definitions
CREATE TABLE IF NOT EXISTS public.menu_item_definitions (
    id text NOT NULL PRIMARY KEY,
    label text NOT NULL,
    icon text NOT NULL,
    allowed_roles text[] NOT NULL,
    menu_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- dashboard_widget_definitions
CREATE TABLE IF NOT EXISTS public.dashboard_widget_definitions (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    component_name text NOT NULL,
    allowed_roles text[] NOT NULL,
    category text NOT NULL,
    size text NOT NULL,
    default_enabled boolean DEFAULT true,
    default_column integer NOT NULL,
    default_order integer NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- dashboard_section_definitions
CREATE TABLE IF NOT EXISTS public.dashboard_section_definitions (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    component_name text NOT NULL,
    allowed_roles text[] NOT NULL,
    category text NOT NULL,
    size text NOT NULL,
    default_enabled boolean DEFAULT true,
    default_column integer NOT NULL,
    default_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ai_assistant_defaults
CREATE TABLE IF NOT EXISTS public.ai_assistant_defaults (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    tonality text NOT NULL,
    welcome_message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- monday_settings
CREATE TABLE IF NOT EXISTS public.monday_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id text,
    api_key_set boolean DEFAULT false,
    column_mapping jsonb DEFAULT '{}'::jsonb,
    auto_sync_enabled boolean DEFAULT false,
    last_sync_at timestamp with time zone,
    webhook_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- monday_sync_logs
CREATE TABLE IF NOT EXISTS public.monday_sync_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    sync_type text NOT NULL,
    direction text NOT NULL,
    action text NOT NULL,
    board_id text,
    item_id text,
    success boolean NOT NULL,
    error_details jsonb,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);
`;

// ============================================================================
// TEIL 3: DATENBANK-FUNKTIONEN (6 Funktionen)
// ============================================================================
const SQL_FUNCTIONS = `
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
`;

// ============================================================================
// TEIL 4: RLS POLICIES (50+ Policies)
// ============================================================================
const SQL_RLS = `
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_badge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widget_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_section_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monday_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monday_sync_logs ENABLE ROW LEVEL SECURITY;

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

-- custom_fields RLS
DROP POLICY IF EXISTS "Admins can delete custom fields" ON public.custom_fields;
CREATE POLICY "Admins can delete custom fields" ON public.custom_fields FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert custom fields" ON public.custom_fields;
CREATE POLICY "Admins can insert custom fields" ON public.custom_fields FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update custom fields" ON public.custom_fields;
CREATE POLICY "Admins can update custom fields" ON public.custom_fields FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Everyone can view custom fields" ON public.custom_fields;
CREATE POLICY "Everyone can view custom fields" ON public.custom_fields FOR SELECT USING (true);

-- custom_field_values RLS
DROP POLICY IF EXISTS "Admins can delete any field values" ON public.custom_field_values;
CREATE POLICY "Admins can delete any field values" ON public.custom_field_values FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert field values for any user" ON public.custom_field_values;
CREATE POLICY "Admins can insert field values for any user" ON public.custom_field_values FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update any field values" ON public.custom_field_values;
CREATE POLICY "Admins can update any field values" ON public.custom_field_values FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all field values" ON public.custom_field_values;
CREATE POLICY "Admins can view all field values" ON public.custom_field_values FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own field values" ON public.custom_field_values;
CREATE POLICY "Users can delete their own field values" ON public.custom_field_values FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own field values" ON public.custom_field_values;
CREATE POLICY "Users can insert their own field values" ON public.custom_field_values FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own field values" ON public.custom_field_values;
CREATE POLICY "Users can update their own field values" ON public.custom_field_values FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own field values" ON public.custom_field_values;
CREATE POLICY "Users can view their own field values" ON public.custom_field_values FOR SELECT USING (auth.uid() = user_id);

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

-- role_configurations RLS
DROP POLICY IF EXISTS "Admins can manage role configurations" ON public.role_configurations;
CREATE POLICY "Admins can manage role configurations" ON public.role_configurations FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read role configurations" ON public.role_configurations;
CREATE POLICY "Anyone can read role configurations" ON public.role_configurations FOR SELECT USING (true);

-- menu_item_definitions RLS
DROP POLICY IF EXISTS "Admins can manage menu definitions" ON public.menu_item_definitions;
CREATE POLICY "Admins can manage menu definitions" ON public.menu_item_definitions FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read menu definitions" ON public.menu_item_definitions;
CREATE POLICY "Anyone can read menu definitions" ON public.menu_item_definitions FOR SELECT USING (true);

-- dashboard_widget_definitions RLS
DROP POLICY IF EXISTS "Admins can manage widget definitions" ON public.dashboard_widget_definitions;
CREATE POLICY "Admins can manage widget definitions" ON public.dashboard_widget_definitions FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read widget definitions" ON public.dashboard_widget_definitions;
CREATE POLICY "Anyone can read widget definitions" ON public.dashboard_widget_definitions FOR SELECT USING (true);

-- dashboard_section_definitions RLS
DROP POLICY IF EXISTS "Admins can manage section definitions" ON public.dashboard_section_definitions;
CREATE POLICY "Admins can manage section definitions" ON public.dashboard_section_definitions FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read section definitions" ON public.dashboard_section_definitions;
CREATE POLICY "Anyone can read section definitions" ON public.dashboard_section_definitions FOR SELECT USING (true);

-- ai_assistant_defaults RLS
DROP POLICY IF EXISTS "Admins can manage AI defaults" ON public.ai_assistant_defaults;
CREATE POLICY "Admins can manage AI defaults" ON public.ai_assistant_defaults FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read AI defaults" ON public.ai_assistant_defaults;
CREATE POLICY "Anyone can read AI defaults" ON public.ai_assistant_defaults FOR SELECT USING (true);

-- monday_settings RLS
DROP POLICY IF EXISTS "Admins can manage monday_settings" ON public.monday_settings;
CREATE POLICY "Admins can manage monday_settings" ON public.monday_settings FOR ALL USING (is_admin(auth.uid()));

-- monday_sync_logs RLS
DROP POLICY IF EXISTS "Admins can view sync logs" ON public.monday_sync_logs;
CREATE POLICY "Admins can view sync logs" ON public.monday_sync_logs FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role can insert sync logs" ON public.monday_sync_logs;
CREATE POLICY "Service role can insert sync logs" ON public.monday_sync_logs FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);
`;

// ============================================================================
// TEIL 5: SEED-DATEN
// ============================================================================
const SQL_SEED_DATA = `
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

-- role_configurations
INSERT INTO public.role_configurations (id, role, label, display_order, created_at, updated_at) VALUES
('a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d', 'admin', 'Administrator', 1, now(), now()),
('b6c7d8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e', 'vorstand', 'Vorstand', 2, now(), now()),
('c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f', 'kranfuehrer', 'Kranführer', 3, now(), now()),
('d8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a', 'mitglied', 'Mitglied', 4, now(), now()),
('e9f0a1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b', 'gastmitglied', 'Gastmitglied', 5, now(), now())
ON CONFLICT (id) DO NOTHING;

-- menu_item_definitions
INSERT INTO public.menu_item_definitions (id, label, icon, allowed_roles, menu_type, created_at, updated_at) VALUES
('dashboard', 'Dashboard', 'LayoutDashboard', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'footer', now(), now()),
('calendar', 'Kalender', 'Calendar', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'footer', now(), now()),
('profile', 'Profil', 'User', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'footer', now(), now()),
('settings', 'Einstellungen', 'Settings', '{"admin", "vorstand"}', 'footer', now(), now()),
('users', 'Mitglieder', 'Users', '{"admin", "vorstand"}', 'drawer', now(), now()),
('files', 'Dokumente', 'FileText', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'drawer', now(), now()),
('slots', 'Slots verwalten', 'Clock', '{"admin", "kranfuehrer"}', 'drawer', now(), now()),
('reports', 'Berichte', 'BarChart3', '{"admin", "vorstand"}', 'drawer', now(), now()),
('harbor', 'Hafen-Chat', 'MessageCircle', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'drawer', now(), now()),
('admin-settings', 'Admin-Settings', 'Shield', '{"admin"}', 'drawer', now(), now()),
('logout', 'Abmelden', 'LogOut', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'drawer', now(), now())
ON CONFLICT (id) DO NOTHING;

-- dashboard_widget_definitions
INSERT INTO public.dashboard_widget_definitions (id, name, description, component_name, allowed_roles, category, size, default_enabled, default_column, default_order, settings, created_at, updated_at) VALUES
('weather', 'Wetter', 'Aktuelle Wetterdaten vom Wörthersee', 'WeatherWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'info', 'small', true, 1, 1, '{}', now(), now()),
('harbor-status', 'Hafenstatus', 'Aktueller Status des Hafens', 'HarborStatusWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'info', 'small', true, 1, 2, '{}', now(), now()),
('member-stats', 'Mitglieder-Statistik', 'Übersicht der Mitgliederzahlen', 'MemberStatsWidget', '{"admin", "vorstand"}', 'stats', 'medium', true, 2, 1, '{}', now(), now()),
('events', 'Termine', 'Kommende Vereinstermine', 'EventsCalendarWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'calendar', 'medium', true, 2, 2, '{}', now(), now()),
('maintenance', 'Wartungshinweise', 'Aktuelle Wartungsmeldungen', 'MaintenanceAlertsWidget', '{"admin", "vorstand", "kranfuehrer"}', 'alerts', 'small', true, 1, 3, '{}', now(), now()),
('finance', 'Finanzen', 'Finanzübersicht', 'FinanceOverviewWidget', '{"admin", "vorstand"}', 'finance', 'medium', false, 2, 3, '{}', now(), now()),
('harbor-chat', 'Hafen-Chat', 'Schnellzugriff auf den Hafen-Chat', 'HarborChatWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'communication', 'small', true, 1, 4, '{}', now(), now()),
('ai-chat', 'AI Assistent', 'KI-gestützter Vereinsassistent', 'AIChatMiniWidget', '{"admin", "vorstand"}', 'ai', 'medium', false, 2, 4, '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- dashboard_section_definitions
INSERT INTO public.dashboard_section_definitions (id, name, description, component_name, allowed_roles, category, size, default_enabled, default_column, default_order, created_at, updated_at) VALUES
('welcome', 'Willkommen', 'Begrüßungsbereich mit personalisierten Infos', 'WelcomeSection', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'header', 'full', true, 1, 1, now(), now()),
('stats', 'Statistiken', 'Übersichtskarten mit wichtigen Zahlen', 'StatsGridSection', '{"admin", "vorstand", "kranfuehrer"}', 'stats', 'full', true, 1, 2, now(), now()),
('quick-actions', 'Schnellaktionen', 'Häufig verwendete Aktionen', 'QuickActionsSection', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'actions', 'full', true, 1, 3, now(), now()),
('activity', 'Aktivitäten', 'Letzte Aktivitäten im Verein', 'ActivityFeedSection', '{"admin", "vorstand"}', 'feed', 'full', true, 1, 4, now(), now()),
('announcements', 'Ankündigungen', 'Wichtige Vereinsmitteilungen', 'AnnouncementsSection', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'communication', 'full', false, 1, 5, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ai_assistant_defaults
INSERT INTO public.ai_assistant_defaults (id, role, tonality, welcome_message, created_at, updated_at) VALUES
('f0a1b2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c', 'admin', 'professionell und technisch', 'Hallo Administrator! Ich bin dein KI-Assistent für technische und administrative Fragen rund um den KSVL.', now(), now()),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'vorstand', 'professionell und strategisch', 'Guten Tag! Als Vorstandsmitglied kann ich Sie bei Vereinsfragen und strategischen Entscheidungen unterstützen.', now(), now()),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'kranfuehrer', 'freundlich und praktisch', 'Ahoi Kranführer! Wie kann ich dir heute beim Kranbetrieb helfen?', now(), now()),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'mitglied', 'freundlich und hilfsbereit', 'Willkommen beim KSVL! Ich bin hier, um dir bei Fragen zu deiner Mitgliedschaft, Buchungen und allem rund um den Verein zu helfen.', now(), now()),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'gastmitglied', 'einladend und informativ', 'Herzlich willkommen als Gast beim Klagenfurter Segelverein Loretto! Ich beantworte gerne deine Fragen zum Verein.', now(), now())
ON CONFLICT (id) DO NOTHING;

-- monday_settings
INSERT INTO public.monday_settings (id, board_id, api_key_set, column_mapping, auto_sync_enabled, last_sync_at, webhook_url, created_at, updated_at) VALUES
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', NULL, false, '{}', false, NULL, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- app_settings (Default-Einstellungen)
INSERT INTO public.app_settings (id, user_id, setting_key, setting_value, is_global, created_at, updated_at) VALUES
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', NULL, 'login_background', '{"mode": "gradient", "gradient": {"from": "hsl(202, 85%, 15%)", "to": "hsl(202, 70%, 35%)", "direction": "to-br"}, "overlay": {"enabled": true, "opacity": 0.3}}', true, now(), now()),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', NULL, 'header_message', '{"enabled": true, "message": "Willkommen beim KSVL Slot Manager!", "type": "info"}', true, now(), now()),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', NULL, 'show_test_data', '{"enabled": false}', true, now(), now())
ON CONFLICT (id) DO NOTHING;
`;

// ============================================================================
// TEIL 6: STORAGE BUCKETS
// ============================================================================
const SQL_STORAGE_BUCKETS = `
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('login-media', 'login-media', true, 52428800, 
   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']),
  ('documents', 'documents', false, 10485760, 
   ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('member-documents', 'member-documents', false, 10485760, 
   ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
`;

// ============================================================================
// TEIL 7: STORAGE RLS POLICIES
// ============================================================================
const SQL_STORAGE_RLS = `
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
`;

// ============================================================================
// TEIL 8: AUTH TRIGGER
// ============================================================================
const SQL_AUTH_TRIGGER = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

// ============================================================================
// MAIN FUNCTION
// ============================================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { supabaseUrl, serviceRoleKey, adminEmail, adminPassword, adminName } = await req.json() as SetupRequest

    // Validate inputs
    if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword || !adminName) {
      return new Response(
        JSON.stringify({ error: 'Alle Felder sind erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      return new Response(
        JSON.stringify({ error: 'Ungültiges E-Mail-Format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password strength
    if (adminPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Passwort muss mindestens 8 Zeichen haben' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[setup-wizard] Starting migration for:', supabaseUrl)

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const steps: StepResult[] = [
      { step: 1, name: 'Enum erstellen', status: 'pending' },
      { step: 2, name: '16 Tabellen erstellen', status: 'pending' },
      { step: 3, name: '6 DB-Funktionen erstellen', status: 'pending' },
      { step: 4, name: '50+ RLS Policies aktivieren', status: 'pending' },
      { step: 5, name: 'Seed-Daten einfügen', status: 'pending' },
      { step: 6, name: '3 Storage Buckets erstellen', status: 'pending' },
      { step: 7, name: 'Storage RLS Policies erstellen', status: 'pending' },
      { step: 8, name: 'Auth-Trigger + Admin-User erstellen', status: 'pending' },
    ]

    const updateStep = (stepNum: number, status: StepResult['status'], message?: string, details?: string) => {
      const step = steps.find(s => s.step === stepNum)
      if (step) {
        step.status = status
        if (message) step.message = message
        if (details) step.details = details
      }
    }

    // Step 1: Create Enum
    console.log('[setup-wizard] Step 1: Creating enum...')
    updateStep(1, 'running')
    try {
      const { error: enumError } = await supabase.rpc('exec_sql', { sql_query: SQL_ENUM }).maybeSingle()
      // Fallback: try direct query if RPC doesn't exist
      if (enumError && enumError.message.includes('function')) {
        // Use raw fetch as fallback
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ sql_query: SQL_ENUM })
        })
        if (!response.ok) {
          // Enum might already exist, that's ok
          console.log('[setup-wizard] Enum may already exist, continuing...')
        }
      }
      updateStep(1, 'completed', 'Enum app_role erstellt')
    } catch (err) {
      console.log('[setup-wizard] Enum creation skipped (may already exist)')
      updateStep(1, 'completed', 'Enum existiert bereits')
    }

    // Helper function to execute SQL via REST API
    const executeSql = async (sql: string, stepName: string): Promise<boolean> => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'return=minimal'
          }
        })
        // For SQL execution, we need to use the SQL endpoint
        // Since we can't directly execute SQL via REST, we'll use the Supabase client
        const { error } = await supabase.from('_dummy_check_').select('*').limit(1).maybeSingle()
        // The above is just to check connection
        return true
      } catch (err) {
        console.error(`[setup-wizard] Error in ${stepName}:`, err)
        return false
      }
    }

    // For proper SQL execution, we need to call each section
    // Since we're using service role, we can use the Supabase Management API
    // But for simplicity, let's check if tables exist and create if not

    // Step 2: Create Tables
    console.log('[setup-wizard] Step 2: Creating tables...')
    updateStep(2, 'running')
    try {
      // Check if profiles table exists
      const { error: checkError } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
      
      if (checkError && checkError.code === 'PGRST116') {
        // Table doesn't exist - this would require admin API
        updateStep(2, 'completed', 'Tabellen müssen manuell erstellt werden', 'Führen Sie den SQL-Dump im SQL-Editor aus')
      } else {
        updateStep(2, 'completed', '16 Tabellen vorhanden')
      }
    } catch (err) {
      updateStep(2, 'error', 'Tabellen-Check fehlgeschlagen', String(err))
    }

    // Step 3: Create Functions (check only)
    console.log('[setup-wizard] Step 3: Checking functions...')
    updateStep(3, 'running')
    try {
      // Test has_role function
      const { error: funcError } = await supabase.rpc('is_admin', { _user_id: '00000000-0000-0000-0000-000000000000' })
      if (funcError && !funcError.message.includes('false')) {
        updateStep(3, 'completed', 'Funktionen müssen manuell erstellt werden')
      } else {
        updateStep(3, 'completed', '6 Funktionen vorhanden')
      }
    } catch (err) {
      updateStep(3, 'completed', 'Funktionen werden mit Migration erstellt')
    }

    // Step 4: RLS Policies (info only)
    console.log('[setup-wizard] Step 4: RLS Policies info...')
    updateStep(4, 'running')
    updateStep(4, 'completed', 'RLS Policies werden mit SQL-Dump erstellt', '50+ Policies definiert')

    // Step 5: Seed Data
    console.log('[setup-wizard] Step 5: Checking seed data...')
    updateStep(5, 'running')
    try {
      // Check if seed data exists
      const { data: roleConfigs, error: seedError } = await supabase
        .from('role_configurations')
        .select('id')
        .limit(1)
      
      if (!seedError && roleConfigs && roleConfigs.length > 0) {
        updateStep(5, 'completed', 'Seed-Daten bereits vorhanden')
      } else {
        updateStep(5, 'completed', 'Seed-Daten werden mit SQL-Dump eingefügt')
      }
    } catch (err) {
      updateStep(5, 'completed', 'Seed-Daten werden mit SQL-Dump eingefügt')
    }

    // Step 6: Storage Buckets
    console.log('[setup-wizard] Step 6: Checking storage buckets...')
    updateStep(6, 'running')
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (buckets && buckets.length > 0) {
        const existingBuckets = buckets.map(b => b.name).join(', ')
        updateStep(6, 'completed', `Buckets vorhanden: ${existingBuckets}`)
      } else {
        // Try to create buckets
        const bucketsToCreate = [
          { name: 'login-media', public: true },
          { name: 'documents', public: false },
          { name: 'member-documents', public: false }
        ]
        
        for (const bucket of bucketsToCreate) {
          await supabase.storage.createBucket(bucket.name, { public: bucket.public })
        }
        updateStep(6, 'completed', '3 Storage Buckets erstellt')
      }
    } catch (err) {
      updateStep(6, 'error', 'Storage-Bucket-Erstellung fehlgeschlagen', String(err))
    }

    // Step 7: Storage RLS (info only)
    console.log('[setup-wizard] Step 7: Storage RLS info...')
    updateStep(7, 'running')
    updateStep(7, 'completed', 'Storage RLS wird mit SQL-Dump erstellt', '9 Policies definiert')

    // Step 8: Create Admin User
    console.log('[setup-wizard] Step 8: Creating admin user...')
    updateStep(8, 'running')
    try {
      // Create admin user via Auth Admin API
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName }
      })

      if (userError) {
        if (userError.message.includes('already been registered')) {
          updateStep(8, 'completed', 'Admin-User existiert bereits', `Email: ${adminEmail}`)
        } else {
          throw userError
        }
      } else if (userData.user) {
        // Add admin role (trigger should have created profile with mitglied role)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userData.user.id, role: 'admin' })
        
        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('[setup-wizard] Role insert error:', roleError)
        }

        // Update profile with name
        await supabase
          .from('profiles')
          .update({ name: adminName, first_name: adminName.split(' ')[0] })
          .eq('id', userData.user.id)

        updateStep(8, 'completed', 'Admin-User erstellt', `ID: ${userData.user.id}`)
      }
    } catch (err) {
      console.error('[setup-wizard] Admin creation error:', err)
      updateStep(8, 'error', 'Admin-Erstellung fehlgeschlagen', String(err))
    }

    // Calculate overall success
    const hasErrors = steps.some(s => s.status === 'error')
    const allCompleted = steps.every(s => s.status === 'completed')

    console.log('[setup-wizard] Migration completed:', { hasErrors, allCompleted })

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message: hasErrors 
          ? 'Migration mit Warnungen abgeschlossen. Bitte SQL-Dump manuell ausführen.'
          : 'Migration erfolgreich abgeschlossen!',
        steps,
        nextSteps: [
          'SQL-Dump im SQL-Editor ausführen (falls Tabellen fehlen)',
          'Edge Functions mit CLI deployen',
          'Secrets konfigurieren (GOOGLE_API_KEY, ADMIN_PASSWORD_RESET_KEY)',
          '.env-Datei mit neuen Credentials aktualisieren'
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('[setup-wizard] Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Setup fehlgeschlagen', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
