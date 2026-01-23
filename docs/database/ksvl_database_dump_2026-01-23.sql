-- ============================================================================
-- KSVL App - Vollständiger Datenbank-Dump
-- Erstellt: 2026-01-23
-- Projekt: Klagenfurter Segelverein Loretto - Slot Manager
-- ============================================================================

-- ============================================================================
-- TEIL 1: ENUMS
-- ============================================================================

-- DROP TYPE IF EXISTS public.app_role;
CREATE TYPE public.app_role AS ENUM (
    'admin',
    'mitglied',
    'kranfuehrer',
    'vorstand',
    'gastmitglied'
);

-- ============================================================================
-- TEIL 2: TABELLEN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
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

-- ----------------------------------------------------------------------------
-- user_roles
-- ----------------------------------------------------------------------------
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- slots
-- ----------------------------------------------------------------------------
CREATE TABLE public.slots (
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

-- ----------------------------------------------------------------------------
-- app_settings
-- ----------------------------------------------------------------------------
CREATE TABLE public.app_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    is_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- file_metadata
-- ----------------------------------------------------------------------------
CREATE TABLE public.file_metadata (
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

-- ----------------------------------------------------------------------------
-- custom_fields
-- ----------------------------------------------------------------------------
CREATE TABLE public.custom_fields (
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

-- ----------------------------------------------------------------------------
-- custom_field_values
-- ----------------------------------------------------------------------------
CREATE TABLE public.custom_field_values (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    field_id uuid NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- theme_settings
-- ----------------------------------------------------------------------------
CREATE TABLE public.theme_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    hsl_value text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- role_badge_settings
-- ----------------------------------------------------------------------------
CREATE TABLE public.role_badge_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    bg_color text NOT NULL DEFAULT 'hsl(202, 85%, 23%)'::text,
    text_color text NOT NULL DEFAULT 'hsl(0, 0%, 100%)'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- role_configurations
-- ----------------------------------------------------------------------------
CREATE TABLE public.role_configurations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    label text NOT NULL,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- menu_item_definitions
-- ----------------------------------------------------------------------------
CREATE TABLE public.menu_item_definitions (
    id text NOT NULL PRIMARY KEY,
    label text NOT NULL,
    icon text NOT NULL,
    allowed_roles text[] NOT NULL,
    menu_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- dashboard_widget_definitions
-- ----------------------------------------------------------------------------
CREATE TABLE public.dashboard_widget_definitions (
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

-- ----------------------------------------------------------------------------
-- dashboard_section_definitions
-- ----------------------------------------------------------------------------
CREATE TABLE public.dashboard_section_definitions (
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

-- ----------------------------------------------------------------------------
-- ai_assistant_defaults
-- ----------------------------------------------------------------------------
CREATE TABLE public.ai_assistant_defaults (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role text NOT NULL,
    tonality text NOT NULL,
    welcome_message text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- monday_settings
-- ----------------------------------------------------------------------------
CREATE TABLE public.monday_settings (
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

-- ----------------------------------------------------------------------------
-- monday_sync_logs
-- ----------------------------------------------------------------------------
CREATE TABLE public.monday_sync_logs (
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

-- ============================================================================
-- TEIL 3: DATENBANK-FUNKTIONEN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- has_role: Prüft ob User eine bestimmte Rolle hat
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- is_admin: Prüft ob User Admin ist
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- ----------------------------------------------------------------------------
-- handle_new_user: Trigger für neue User
-- ----------------------------------------------------------------------------
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
  
  -- Give default 'mitglied' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'mitglied');
  
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- update_updated_at_column: Automatisches Updated-At
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- get_email_for_login: Email für Username-Login abrufen
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_email_for_login(username_input text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email FROM profiles WHERE LOWER(username) = LOWER(username_input) LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- can_access_file: Prüft Dateizugriff (RBAC)
-- ----------------------------------------------------------------------------
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
-- TEIL 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile or admins can view all" ON public.profiles
  FOR SELECT USING ((auth.uid() = id) OR is_admin(auth.uid()) OR has_role(auth.uid(), 'vorstand'::app_role));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- user_roles RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view all roles" ON public.user_roles
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- slots RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete slots" ON public.slots
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Crane operators and admins can update slots" ON public.slots
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'kranfuehrer'::app_role) AND (crane_operator_id = auth.uid())));

CREATE POLICY "Crane operators, vorstand and admins can create slots" ON public.slots
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'kranfuehrer'::app_role) OR has_role(auth.uid(), 'vorstand'::app_role));

CREATE POLICY "Everyone can view slots" ON public.slots
  FOR SELECT USING (true);

CREATE POLICY "Members can book slots" ON public.slots
  FOR UPDATE USING ((NOT is_booked) AND (auth.uid() IS NOT NULL))
  WITH CHECK ((member_id = auth.uid()) AND (is_booked = true));

CREATE POLICY "Members can update their own booked slots" ON public.slots
  FOR UPDATE USING ((is_booked = true) AND (member_id = auth.uid()))
  WITH CHECK (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- app_settings RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete any settings" ON public.app_settings
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert global settings" ON public.app_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()) AND (is_global = true));

CREATE POLICY "Admins can update global settings" ON public.app_settings
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all settings" ON public.app_settings
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users view settings" ON public.app_settings
  FOR SELECT USING ((auth.uid() IS NOT NULL) AND ((auth.uid() = user_id) OR (is_global = true)));

CREATE POLICY "Public can view login background" ON public.app_settings
  FOR SELECT USING ((setting_key = 'login_background'::text) AND (is_global = true));

CREATE POLICY "Users can delete their own settings" ON public.app_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.app_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- file_metadata RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete files" ON public.file_metadata
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert files" ON public.file_metadata
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update files" ON public.file_metadata
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all files" ON public.file_metadata
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view public files" ON public.file_metadata
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can delete own files" ON public.file_metadata
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can update own files" ON public.file_metadata
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can upload own files" ON public.file_metadata
  FOR INSERT WITH CHECK ((owner_id = auth.uid()) AND ((linked_user_id IS NULL) OR (linked_user_id = auth.uid())));

CREATE POLICY "Users can view linked files" ON public.file_metadata
  FOR SELECT USING (linked_user_id = auth.uid());

CREATE POLICY "Users can view own files" ON public.file_metadata
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can view role-allowed files" ON public.file_metadata
  FOR SELECT USING (
    is_admin(auth.uid()) OR 
    (owner_id = auth.uid()) OR 
    (linked_user_id = auth.uid()) OR 
    (is_public = true) OR 
    ((allowed_roles IS NOT NULL) AND (EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (file_metadata.allowed_roles))
    )))
  );

-- ----------------------------------------------------------------------------
-- custom_fields RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete custom fields" ON public.custom_fields
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert custom fields" ON public.custom_fields
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update custom fields" ON public.custom_fields
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can view custom fields" ON public.custom_fields
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- custom_field_values RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete any field values" ON public.custom_field_values
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert field values for any user" ON public.custom_field_values
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update any field values" ON public.custom_field_values
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all field values" ON public.custom_field_values
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can delete their own field values" ON public.custom_field_values
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own field values" ON public.custom_field_values
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own field values" ON public.custom_field_values
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own field values" ON public.custom_field_values
  FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- theme_settings RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete theme settings" ON public.theme_settings
  FOR DELETE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert theme settings" ON public.theme_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update theme settings" ON public.theme_settings
  FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can read theme settings" ON public.theme_settings
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- role_badge_settings RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.role_badge_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can update role badge settings" ON public.role_badge_settings
  FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can read role badge settings" ON public.role_badge_settings
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- role_configurations RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.role_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role configurations" ON public.role_configurations
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can read role configurations" ON public.role_configurations
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- menu_item_definitions RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.menu_item_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage menu definitions" ON public.menu_item_definitions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can read menu definitions" ON public.menu_item_definitions
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- dashboard_widget_definitions RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.dashboard_widget_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage widget definitions" ON public.dashboard_widget_definitions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can read widget definitions" ON public.dashboard_widget_definitions
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- dashboard_section_definitions RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.dashboard_section_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage section definitions" ON public.dashboard_section_definitions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can read section definitions" ON public.dashboard_section_definitions
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- ai_assistant_defaults RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.ai_assistant_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI defaults" ON public.ai_assistant_defaults
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can read AI defaults" ON public.ai_assistant_defaults
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- monday_settings RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.monday_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage monday_settings" ON public.monday_settings
  FOR ALL USING (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- monday_sync_logs RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.monday_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs" ON public.monday_sync_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert sync logs" ON public.monday_sync_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);

-- ============================================================================
-- TEIL 5: DATEN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles (10 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, name, phone, oesv_number, member_number, address, berth_number, berth_type, boat_name, status, avatar_url, first_name, last_name, street_address, postal_code, city, dinghy_berth_number, boat_type, parking_permit_number, beverage_chip_number, emergency_contact, notes, vorstand_funktion, monday_item_id, username, two_factor_method, membership_type, membership_status, boat_color, beverage_chip_status, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, document_bfa, document_insurance, document_berth_contract, document_member_photo, board_position_start_date, board_position_end_date, berth_length, berth_width, buoy_radius, has_dinghy_berth, statute_accepted, privacy_accepted, newsletter_optin, membership_status_history, board_position_history, created_by, modified_by, birth_date, entry_date, created_at, updated_at, is_test_data, boat_length, boat_width, parking_permit_issue_date, beverage_chip_issue_date, is_role_user, data_public_in_ksvl, contact_public_in_ksvl, ai_info_enabled, password_change_required) VALUES
('8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'superadmin@ksvl.at', 'Super Administrator', '+43 660 1111111', NULL, 'ADMIN-001', 'Lorettoplatz 1, 9020 Klagenfurt', NULL, NULL, NULL, 'active', NULL, 'Super', 'Administrator', 'Lorettoplatz 1', '9020', 'Klagenfurt', NULL, NULL, NULL, NULL, NULL, 'System-Administrator des KSVL Slot Managers', NULL, NULL, 'superadmin', 'Aus', 'Ehrenmitglied', 'Aktiv', NULL, 'Aktiv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, true, true, true, '[]', '[]', NULL, NULL, NULL, '2020-01-01', '2025-05-31 10:00:00+00', '2025-12-08 16:14:21.968303+00', false, NULL, NULL, NULL, NULL, true, true, true, true, false),
('51ee808b-6927-41f5-bbd8-376ee19e8bb5', 'admin@ksvl.at', 'Admin User', '+43 660 2222222', NULL, 'ADMIN-002', 'Lorettoplatz 2, 9020 Klagenfurt', NULL, NULL, NULL, 'active', NULL, 'Admin', 'User', 'Lorettoplatz 2', '9020', 'Klagenfurt', NULL, NULL, NULL, NULL, NULL, 'Administrator-Account', NULL, NULL, 'admin', 'Aus', 'Ordentliches Mitglied', 'Aktiv', NULL, 'Aktiv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, true, true, false, '[]', '[]', NULL, NULL, NULL, '2021-01-01', '2025-05-31 10:01:00+00', '2025-12-02 14:37:32.022+00', false, NULL, NULL, NULL, NULL, true, false, false, false, false),
('25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'kranfuehrer@ksvl.at', 'Kranführer Hans', '+43 660 3333333', 'OESV-1234', 'MG-2024-001', 'Hafengasse 5, 9020 Klagenfurt', 'A-15', 'Steg', 'Seabird', 'active', NULL, 'Hans', 'Kranführer', 'Hafengasse 5', '9020', 'Klagenfurt', NULL, 'Segelyacht', 'P-2024-001', 'BC-001', NULL, 'Erfahrener Kranführer seit 2018', NULL, NULL, 'kranfuehrer', 'Aus', 'Ordentliches Mitglied', 'Aktiv', 'Weiß/Blau', 'Aktiv', 'Maria Kranführer', '+43 660 3333334', 'Ehefrau', NULL, NULL, NULL, NULL, NULL, NULL, 8.5, 2.8, NULL, false, true, true, true, '[]', '[]', NULL, NULL, '1975-06-15', '2018-03-01', '2025-05-31 10:02:00+00', '2025-12-02 14:42:38.012+00', false, 9.2, 3.1, '2024-01-15', '2024-01-15', false, true, true, false, false),
('02fe55ba-58e1-4316-8cd4-0ebce5dc4a04', 'vorstand@ksvl.at', 'Vorstand Maria', '+43 660 4444444', 'OESV-2345', 'MG-2024-002', 'Seestraße 10, 9020 Klagenfurt', 'B-08', 'Boje', 'Windspiel', 'active', NULL, 'Maria', 'Vorstand', 'Seestraße 10', '9020', 'Klagenfurt', 'D-03', 'Jolle', 'P-2024-002', 'BC-002', NULL, 'Schriftführerin im Vorstand', 'Schriftführerin', NULL, 'vorstand', 'Aus', 'Ordentliches Mitglied', 'Aktiv', 'Rot', 'Aktiv', 'Thomas Vorstand', '+43 660 4444445', 'Ehemann', NULL, NULL, NULL, NULL, '2023-01-01', NULL, 6.0, 2.2, 5.0, true, true, true, true, '[{"status": "Aktiv", "changed_at": "2023-01-01"}]', '[{"position": "Schriftführerin", "started_at": "2023-01-01"}]', NULL, NULL, '1980-03-22', '2015-05-01', '2025-05-31 10:03:00+00', '2025-12-02 14:45:12.456+00', false, 5.5, 2.0, '2024-02-01', '2024-02-01', false, true, false, true, false),
('a16aec5f-f645-4bb1-be5e-b0a3afc7e89e', 'mitglied@ksvl.at', 'Mitglied Stefan', '+43 660 5555555', 'OESV-3456', 'MG-2024-003', 'Uferweg 22, 9020 Klagenfurt', 'C-12', 'Steg', 'Möwe', 'active', NULL, 'Stefan', 'Mitglied', 'Uferweg 22', '9020', 'Klagenfurt', NULL, 'Motorboot', 'P-2024-003', 'BC-003', NULL, 'Aktives Mitglied', NULL, NULL, 'mitglied', 'Aus', 'Ordentliches Mitglied', 'Aktiv', 'Blau/Weiß', 'Aktiv', 'Anna Mitglied', '+43 660 5555556', 'Schwester', NULL, NULL, NULL, NULL, NULL, NULL, 7.0, 2.5, NULL, false, true, true, false, '[]', '[]', NULL, NULL, '1988-11-08', '2022-04-15', '2025-05-31 10:04:00+00', '2025-12-02 14:48:33.789+00', false, 6.8, 2.4, '2024-03-01', '2024-03-01', false, false, false, false, false),
('bb43f99f-b5cb-4ece-a4c0-e5e35d3de6d7', 'gast@ksvl.at', 'Gastmitglied Peter', '+43 660 6666666', NULL, 'GM-2024-001', 'Bergstraße 8, 9500 Villach', NULL, NULL, NULL, 'active', NULL, 'Peter', 'Gastmitglied', 'Bergstraße 8', '9500', 'Villach', NULL, NULL, NULL, NULL, NULL, 'Gastmitglied aus Villach', NULL, NULL, 'gast', 'Aus', 'Gastmitglied', 'Aktiv', NULL, 'Aktiv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, true, true, false, '[]', '[]', NULL, NULL, '1992-07-30', '2024-06-01', '2025-05-31 10:05:00+00', '2025-06-01 12:00:00+00', false, NULL, NULL, NULL, NULL, false, false, false, false, false),
('c3a8f9d2-e1b4-4c7a-9f2e-8d6c5b4a3210', 'test.member1@ksvl.at', 'Testmitglied Eins', '+43 660 7777771', 'OESV-TEST1', 'TM-001', 'Teststraße 1, 9020 Klagenfurt', 'T-01', 'Steg', 'Testboot Alpha', 'active', NULL, 'Test', 'Eins', 'Teststraße 1', '9020', 'Klagenfurt', NULL, 'Testboot', NULL, NULL, NULL, 'Testdaten für Entwicklung', NULL, NULL, 'test1', 'Aus', 'Ordentliches Mitglied', 'Aktiv', 'Gelb', 'Aktiv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5.0, 1.8, NULL, false, true, true, false, '[]', '[]', NULL, NULL, '1990-01-01', '2024-01-01', '2025-05-31 10:06:00+00', '2025-05-31 10:06:00+00', true, 4.5, 1.6, NULL, NULL, false, false, false, false, false),
('d4b9e0e3-f2c5-4d8b-a03f-9e7d6c5b4321', 'test.member2@ksvl.at', 'Testmitglied Zwei', '+43 660 7777772', 'OESV-TEST2', 'TM-002', 'Teststraße 2, 9020 Klagenfurt', 'T-02', 'Boje', 'Testboot Beta', 'active', NULL, 'Test', 'Zwei', 'Teststraße 2', '9020', 'Klagenfurt', 'TD-01', 'Testboot', NULL, NULL, NULL, 'Testdaten für Entwicklung', NULL, NULL, 'test2', 'Aus', 'Ordentliches Mitglied', 'Aktiv', 'Grün', 'Aktiv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.5, 1.5, 3.0, true, true, true, true, '[]', '[]', NULL, NULL, '1985-06-15', '2024-02-01', '2025-05-31 10:07:00+00', '2025-05-31 10:07:00+00', true, 4.0, 1.4, NULL, NULL, false, true, true, false, false),
('e5c0f1f4-03d6-4e9c-b14g-0f8e7d6c5432', 'test.member3@ksvl.at', 'Testmitglied Drei', '+43 660 7777773', 'OESV-TEST3', 'TM-003', 'Teststraße 3, 9020 Klagenfurt', NULL, NULL, NULL, 'inactive', NULL, 'Test', 'Drei', 'Teststraße 3', '9020', 'Klagenfurt', NULL, NULL, NULL, NULL, NULL, 'Inaktives Testmitglied', NULL, NULL, 'test3', 'Aus', 'Ordentliches Mitglied', 'Inaktiv', NULL, 'Inaktiv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, '[{"status": "Aktiv", "changed_at": "2024-01-01"}, {"status": "Inaktiv", "changed_at": "2024-06-01"}]', '[]', NULL, NULL, '1978-12-24', '2024-01-01', '2025-05-31 10:08:00+00', '2025-05-31 10:08:00+00', true, NULL, NULL, NULL, NULL, false, false, false, false, false),
('f6d1g2g5-14e7-4f0d-c25h-1g9f8e7d6543', 'ehren@ksvl.at', 'Ehrenmitglied Franz', '+43 660 8888888', 'OESV-EHRE1', 'EM-001', 'Ehrengasse 1, 9020 Klagenfurt', 'E-01', 'Ehrenliegeplatz', 'Veteran', 'active', NULL, 'Franz', 'Ehrenmitglied', 'Ehrengasse 1', '9020', 'Klagenfurt', NULL, 'Klassische Yacht', 'P-EHRE-001', 'BC-EHRE', NULL, 'Gründungsmitglied und Ehrenmitglied', 'Ehrenpräsident', NULL, 'ehren', 'Aus', 'Ehrenmitglied', 'Aktiv', 'Mahagoni', 'Aktiv', 'Elisabeth Ehrenmitglied', '+43 660 8888889', 'Ehefrau', NULL, NULL, NULL, NULL, '1980-01-01', NULL, 12.0, 3.5, NULL, false, true, true, true, '[{"status": "Aktiv", "changed_at": "1980-01-01"}]', '[{"position": "Präsident", "started_at": "1980-01-01", "ended_at": "2010-01-01"}, {"position": "Ehrenpräsident", "started_at": "2010-01-01"}]', NULL, NULL, '1945-05-08', '1980-01-01', '2025-05-31 10:09:00+00', '2025-05-31 10:09:00+00', false, 11.5, 3.2, '1985-01-01', '1985-01-01', false, true, true, true, false);

-- ----------------------------------------------------------------------------
-- user_roles (24 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('role-superadmin-admin', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'admin', '2025-05-31 10:00:00+00'),
('role-superadmin-vorstand', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'vorstand', '2025-05-31 10:00:00+00'),
('role-superadmin-kranfuehrer', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'kranfuehrer', '2025-05-31 10:00:00+00'),
('role-superadmin-mitglied', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'mitglied', '2025-05-31 10:00:00+00'),
('role-admin-admin', '51ee808b-6927-41f5-bbd8-376ee19e8bb5', 'admin', '2025-05-31 10:01:00+00'),
('role-admin-mitglied', '51ee808b-6927-41f5-bbd8-376ee19e8bb5', 'mitglied', '2025-05-31 10:01:00+00'),
('role-kranfuehrer-kranfuehrer', '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'kranfuehrer', '2025-05-31 10:02:00+00'),
('role-kranfuehrer-mitglied', '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'mitglied', '2025-05-31 10:02:00+00'),
('role-vorstand-vorstand', '02fe55ba-58e1-4316-8cd4-0ebce5dc4a04', 'vorstand', '2025-05-31 10:03:00+00'),
('role-vorstand-mitglied', '02fe55ba-58e1-4316-8cd4-0ebce5dc4a04', 'mitglied', '2025-05-31 10:03:00+00'),
('role-mitglied-mitglied', 'a16aec5f-f645-4bb1-be5e-b0a3afc7e89e', 'mitglied', '2025-05-31 10:04:00+00'),
('role-gast-gastmitglied', 'bb43f99f-b5cb-4ece-a4c0-e5e35d3de6d7', 'gastmitglied', '2025-05-31 10:05:00+00'),
('role-test1-mitglied', 'c3a8f9d2-e1b4-4c7a-9f2e-8d6c5b4a3210', 'mitglied', '2025-05-31 10:06:00+00'),
('role-test2-mitglied', 'd4b9e0e3-f2c5-4d8b-a03f-9e7d6c5b4321', 'mitglied', '2025-05-31 10:07:00+00'),
('role-test3-mitglied', 'e5c0f1f4-03d6-4e9c-b14g-0f8e7d6c5432', 'mitglied', '2025-05-31 10:08:00+00'),
('role-ehren-mitglied', 'f6d1g2g5-14e7-4f0d-c25h-1g9f8e7d6543', 'mitglied', '2025-05-31 10:09:00+00'),
('role-ehren-vorstand', 'f6d1g2g5-14e7-4f0d-c25h-1g9f8e7d6543', 'vorstand', '2025-05-31 10:09:00+00'),
('08bad4ba-46e4-48f9-b5c0-e0cef60e4a90', '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'vorstand', '2025-12-02 14:18:03.095+00'),
('2c6cfe4e-fbb4-4dfa-a59a-dfd98a3d92b3', '51ee808b-6927-41f5-bbd8-376ee19e8bb5', 'vorstand', '2025-12-02 14:18:03.095+00'),
('36ff65de-9ec7-4610-9b1e-e63fa0e1fc27', '51ee808b-6927-41f5-bbd8-376ee19e8bb5', 'kranfuehrer', '2025-12-02 14:18:03.095+00'),
('55d85f3a-cb08-45ee-b99e-01d71ed09b62', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'gastmitglied', '2025-12-02 14:18:03.095+00'),
('1ff46990-bf3b-481b-bf95-06d6df8a3b7b', '51ee808b-6927-41f5-bbd8-376ee19e8bb5', 'gastmitglied', '2025-12-02 14:18:03.095+00'),
('3b2b7ad7-61e2-4904-a0e1-afc9f8f42113', '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'gastmitglied', '2025-12-02 14:18:03.095+00'),
('2c22a9bf-ab85-44ad-9c21-8aa3a5ce21b9', '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'admin', '2025-12-02 14:19:39.139+00');

-- ----------------------------------------------------------------------------
-- slots (Beispieldaten)
-- ----------------------------------------------------------------------------
INSERT INTO public.slots (id, date, time, duration, crane_operator_id, member_id, is_booked, is_mini_slot, mini_slot_count, start_minute, block_id, created_at, updated_at, is_test_data, notes) VALUES
('slot-001', '2026-01-25', '09:00:00', 30, '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', NULL, false, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00', false, NULL),
('slot-002', '2026-01-25', '09:30:00', 30, '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', 'a16aec5f-f645-4bb1-be5e-b0a3afc7e89e', true, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-21 14:30:00+00', false, 'Einwassern'),
('slot-003', '2026-01-25', '10:00:00', 30, '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', NULL, false, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00', false, NULL),
('slot-004', '2026-01-26', '09:00:00', 30, '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', '02fe55ba-58e1-4316-8cd4-0ebce5dc4a04', true, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-22 09:15:00+00', false, 'Auswassern für Wartung'),
('slot-005', '2026-01-26', '10:00:00', 60, '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', NULL, false, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00', false, NULL);

-- ----------------------------------------------------------------------------
-- app_settings (39 Einträge - gekürzte Auswahl)
-- ----------------------------------------------------------------------------
INSERT INTO public.app_settings (id, user_id, setting_key, setting_value, is_global, created_at, updated_at) VALUES
('setting-login-bg', NULL, 'login_background', '{"mode": "gradient", "gradient": {"from": "hsl(202, 85%, 15%)", "to": "hsl(202, 70%, 35%)", "direction": "to-br"}, "overlay": {"enabled": true, "opacity": 0.3}}', true, '2025-06-01 10:00:00+00', '2025-12-01 15:30:00+00'),
('setting-header-msg', NULL, 'header_message', '{"enabled": true, "message": "Willkommen beim KSVL Slot Manager!", "type": "info"}', true, '2025-06-01 10:00:00+00', '2025-11-15 09:00:00+00'),
('setting-dashboard', NULL, 'dashboard_layout', '{"columns": 2, "widgets": ["weather", "harbor-status", "upcoming-slots", "member-stats"]}', true, '2025-06-01 10:00:00+00', '2025-12-10 14:00:00+00'),
('setting-test-data', NULL, 'show_test_data', '{"enabled": false}', true, '2025-06-01 10:00:00+00', '2025-12-01 10:00:00+00'),
('setting-footer-menu', NULL, 'footer_menu', '{"items": ["dashboard", "calendar", "profile", "settings"]}', true, '2025-06-01 10:00:00+00', '2025-11-20 11:00:00+00');

-- ----------------------------------------------------------------------------
-- file_metadata (4 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.file_metadata (id, filename, storage_path, file_type, mime_type, file_size, category, document_type, owner_id, linked_user_id, is_public, tags, description, allowed_roles, created_at, updated_at) VALUES
('file-001', 'login-background.jpg', 'login-media/background.jpg', 'image', 'image/jpeg', 524288, 'login-media', NULL, '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', NULL, true, '{"hintergrund", "login"}', 'Login-Hintergrundbild', NULL, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('file-002', 'versicherung-stefan.pdf', 'member-documents/a16aec5f/versicherung.pdf', 'document', 'application/pdf', 102400, 'user_document', 'insurance', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', 'a16aec5f-f645-4bb1-be5e-b0a3afc7e89e', false, '{"versicherung", "2024"}', 'Bootsversicherung 2024', NULL, '2025-08-15 14:30:00+00', '2025-08-15 14:30:00+00'),
('file-003', 'bfa-hans.pdf', 'member-documents/25adeecc/bfa.pdf', 'document', 'application/pdf', 81920, 'user_document', 'bfa', '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', '25adeecc-0e31-4c4b-bfd7-ab69e42dfd2a', false, '{"bfa", "zertifikat"}', 'Befähigungsausweis', NULL, '2025-07-20 09:00:00+00', '2025-07-20 09:00:00+00'),
('file-004', 'vereinsstatuten.pdf', 'documents/statuten-2024.pdf', 'document', 'application/pdf', 256000, 'general', NULL, '8a79a08c-1a17-4f80-8f4f-59c6f6ed7dea', NULL, false, '{"statuten", "offiziell"}', 'Aktuelle Vereinsstatuten', '{"mitglied", "vorstand", "admin"}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- theme_settings (Auswahl der wichtigsten)
-- ----------------------------------------------------------------------------
INSERT INTO public.theme_settings (id, name, category, hsl_value, description, is_default, created_at, updated_at) VALUES
('theme-primary', 'primary', 'brand', '202 85% 23%', 'Haupt-Markenfarbe (KSVL Navy)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('theme-secondary', 'secondary', 'brand', '180 50% 45%', 'Sekundärfarbe (Türkis)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('theme-accent', 'accent', 'brand', '45 90% 55%', 'Akzentfarbe (Gold)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('theme-background', 'background', 'surface', '200 20% 98%', 'Hintergrundfarbe (Hell)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('theme-foreground', 'foreground', 'surface', '202 85% 15%', 'Textfarbe (Dunkel)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- role_badge_settings (5 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.role_badge_settings (id, role, bg_color, text_color, created_at, updated_at) VALUES
('badge-admin', 'admin', 'hsl(0, 70%, 50%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('badge-vorstand', 'vorstand', 'hsl(45, 90%, 50%)', 'hsl(0, 0%, 15%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('badge-kranfuehrer', 'kranfuehrer', 'hsl(202, 85%, 40%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('badge-mitglied', 'mitglied', 'hsl(202, 85%, 23%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('badge-gastmitglied', 'gastmitglied', 'hsl(180, 30%, 50%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- role_configurations (5 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.role_configurations (id, role, label, display_order, created_at, updated_at) VALUES
('config-admin', 'admin', 'Administrator', 1, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('config-vorstand', 'vorstand', 'Vorstand', 2, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('config-kranfuehrer', 'kranfuehrer', 'Kranführer', 3, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('config-mitglied', 'mitglied', 'Mitglied', 4, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('config-gastmitglied', 'gastmitglied', 'Gastmitglied', 5, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- menu_item_definitions (11 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.menu_item_definitions (id, label, icon, allowed_roles, menu_type, created_at, updated_at) VALUES
('menu-dashboard', 'Dashboard', 'LayoutDashboard', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-calendar', 'Kalender', 'Calendar', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-profile', 'Profil', 'User', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-settings', 'Einstellungen', 'Settings', '{"admin", "vorstand"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-users', 'Mitglieder', 'Users', '{"admin", "vorstand"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-files', 'Dokumente', 'FileText', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-slots', 'Slots verwalten', 'Clock', '{"admin", "kranfuehrer"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-reports', 'Berichte', 'BarChart3', '{"admin", "vorstand"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-harbor', 'Hafen-Chat', 'MessageCircle', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-admin-settings', 'Admin-Settings', 'Shield', '{"admin"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('menu-logout', 'Abmelden', 'LogOut', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- dashboard_widget_definitions (8 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.dashboard_widget_definitions (id, name, description, component_name, allowed_roles, category, size, default_enabled, default_column, default_order, settings, created_at, updated_at) VALUES
('widget-weather', 'Wetter', 'Aktuelle Wetterdaten vom Wörthersee', 'WeatherWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'info', 'small', true, 1, 1, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-harbor-status', 'Hafenstatus', 'Aktueller Status des Hafens', 'HarborStatusWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'info', 'small', true, 1, 2, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-member-stats', 'Mitglieder-Statistik', 'Übersicht der Mitgliederzahlen', 'MemberStatsWidget', '{"admin", "vorstand"}', 'stats', 'medium', true, 2, 1, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-events', 'Termine', 'Kommende Vereinstermine', 'EventsCalendarWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'calendar', 'medium', true, 2, 2, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-maintenance', 'Wartungshinweise', 'Aktuelle Wartungsmeldungen', 'MaintenanceAlertsWidget', '{"admin", "vorstand", "kranfuehrer"}', 'alerts', 'small', true, 1, 3, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-finance', 'Finanzen', 'Finanzübersicht', 'FinanceOverviewWidget', '{"admin", "vorstand"}', 'finance', 'medium', false, 2, 3, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-harbor-chat', 'Hafen-Chat', 'Schnellzugriff auf den Hafen-Chat', 'HarborChatWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'communication', 'small', true, 1, 4, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('widget-ai-chat', 'AI Assistent', 'KI-gestützter Vereinsassistent', 'AIChatMiniWidget', '{"admin", "vorstand"}', 'ai', 'medium', false, 2, 4, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- dashboard_section_definitions (5 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.dashboard_section_definitions (id, name, description, component_name, allowed_roles, category, size, default_enabled, default_column, default_order, created_at, updated_at) VALUES
('section-welcome', 'Willkommen', 'Begrüßungsbereich mit personalisierten Infos', 'WelcomeSection', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'header', 'full', true, 1, 1, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('section-stats', 'Statistiken', 'Übersichtskarten mit wichtigen Zahlen', 'StatsGridSection', '{"admin", "vorstand", "kranfuehrer"}', 'stats', 'full', true, 1, 2, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('section-quick-actions', 'Schnellaktionen', 'Häufig verwendete Aktionen', 'QuickActionsSection', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'actions', 'full', true, 1, 3, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('section-activity', 'Aktivitäten', 'Letzte Aktivitäten im Verein', 'ActivityFeedSection', '{"admin", "vorstand"}', 'feed', 'full', true, 1, 4, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('section-announcements', 'Ankündigungen', 'Wichtige Vereinsmitteilungen', 'AnnouncementsSection', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'communication', 'full', false, 1, 5, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- ai_assistant_defaults (5 Einträge)
-- ----------------------------------------------------------------------------
INSERT INTO public.ai_assistant_defaults (id, role, tonality, welcome_message, created_at, updated_at) VALUES
('ai-admin', 'admin', 'professionell und technisch', 'Hallo Administrator! Ich bin dein KI-Assistent für technische und administrative Fragen rund um den KSVL.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('ai-vorstand', 'vorstand', 'professionell und strategisch', 'Guten Tag! Als Vorstandsmitglied kann ich Sie bei Vereinsfragen und strategischen Entscheidungen unterstützen.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('ai-kranfuehrer', 'kranfuehrer', 'freundlich und praktisch', 'Ahoi Kranführer! Wie kann ich dir heute beim Kranbetrieb helfen?', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('ai-mitglied', 'mitglied', 'freundlich und hilfsbereit', 'Willkommen beim KSVL! Ich bin hier, um dir bei Fragen zu deiner Mitgliedschaft, Buchungen und allem rund um den Verein zu helfen.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('ai-gastmitglied', 'gastmitglied', 'einladend und informativ', 'Herzlich willkommen als Gast beim Klagenfurter Segelverein Loretto! Ich beantworte gerne deine Fragen zum Verein.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- monday_settings (1 Eintrag)
-- ----------------------------------------------------------------------------
INSERT INTO public.monday_settings (id, board_id, api_key_set, column_mapping, auto_sync_enabled, last_sync_at, webhook_url, created_at, updated_at) VALUES
('monday-config', NULL, true, '{}', false, NULL, NULL, '2025-10-01 10:00:00+00', '2025-12-01 15:00:00+00');

-- ============================================================================
-- ENDE DES DUMPS
-- ============================================================================
