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
-- HINWEIS: Dieser Dump enthält Schema-Dokumentation und Beispiel-Referenzdaten.
-- Die echten Produktionsdaten sind in der Datenbank gespeichert.
-- Profile-Daten werden hier nicht exportiert, da sie mit auth.users verknüpft sind.
-- Die user_roles unten zeigen die echten Rollenzuweisungen.

-- ----------------------------------------------------------------------------
-- profiles werden über auth.users erstellt - hier nur Schema-Dokumentation
-- Echte Profile-IDs entsprechen den auth.users IDs
-- ----------------------------------------------------------------------------
-- Hinweis: Profile-INSERT würde Foreign Key Constraints auf auth.users verletzen
-- wenn die entsprechenden Auth-User nicht existieren. Daher werden Profile
-- bei der User-Erstellung automatisch über den handle_new_user() Trigger erstellt.
-- ----------------------------------------------------------------------------
-- user_roles (24 Einträge - echte Produktionsdaten)
-- ----------------------------------------------------------------------------
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('ad97680e-a03b-4d6f-90d9-5f7f6515bd60', '4eb45e13-5b72-44c9-8287-bf314d301feb', 'mitglied', '2025-10-24 20:20:06.031385+00'),
('98ae4b38-940d-4cc6-88e8-81e98b9b7792', '4eb45e13-5b72-44c9-8287-bf314d301feb', 'admin', '2025-10-24 20:20:06.152101+00'),
('9136051d-9871-47ad-a669-4a68eba262d8', 'c5751a82-23b6-4d4a-8aa1-3c89d086a6cf', 'mitglied', '2025-10-24 20:20:06.33438+00'),
('9c945ac0-9569-40e7-b4a5-bdc0623e536a', 'c5751a82-23b6-4d4a-8aa1-3c89d086a6cf', 'vorstand', '2025-10-24 20:20:06.44163+00'),
('54f93286-5cd7-4177-ae92-a18af07b74e8', '9090b21d-8287-4732-a301-9402d3c2b034', 'mitglied', '2025-10-24 20:20:06.627552+00'),
('99fde4ab-68a3-4a1e-af46-8e98e5842aa3', '9090b21d-8287-4732-a301-9402d3c2b034', 'kranfuehrer', '2025-10-24 20:20:06.720839+00'),
('c4fe87e4-0444-4e61-9d6f-e74f400547e6', '8910e641-23a1-483f-822a-d5e5550f1411', 'mitglied', '2025-10-24 20:20:06.89996+00'),
('66823ab2-83eb-4e2d-b68b-b33504a6eeb2', '5f38252a-ce4e-48a2-8f51-1113b8d831e5', 'mitglied', '2025-10-24 20:20:07.193566+00'),
('8622fb85-ee10-4359-b73b-9d4dfed96c9c', '5f38252a-ce4e-48a2-8f51-1113b8d831e5', 'gastmitglied', '2025-10-24 20:20:07.294738+00'),
('5812faf2-3b32-474d-a07f-c99c2ebf8bc7', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', 'admin', '2025-10-24 21:53:48.079922+00'),
('b911b420-a079-4f92-aa6f-8d5b9411a8be', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', 'vorstand', '2025-10-24 21:53:48.122115+00'),
('2eab0350-a4f9-43b2-83fa-b88b402c32d3', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', 'kranfuehrer', '2025-10-24 21:53:48.173875+00'),
('ca0d69a4-a8bf-4450-8196-3a386ff831d0', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', 'mitglied', '2025-10-24 21:53:48.216544+00'),
('b2eb81c0-55b4-4c31-a60b-00dd1eab2d63', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', 'gastmitglied', '2025-10-24 21:53:48.261823+00'),
('aa42d9a4-d340-4769-8a48-71284eeb1925', '4cb7a35d-b5b6-4589-8526-5176f041de89', 'mitglied', '2025-11-04 15:15:20.520831+00'),
('b2a651db-de46-407d-8d12-504a3be69446', '4cb7a35d-b5b6-4589-8526-5176f041de89', 'kranfuehrer', '2025-11-04 15:15:20.697762+00'),
('44b8a514-f8fc-494a-a61a-9f08dadd8263', 'a910808d-0a1d-4bb9-8969-b08be3e44d2f', 'mitglied', '2025-11-17 20:47:45.14131+00'),
('680bf274-ef50-48e6-ad96-a40b53b04657', '99177a44-836c-4edb-b0b5-225bfd1305ee', 'admin', '2025-12-01 21:36:54.586797+00'),
('620b1bed-8862-4df9-81bc-29c7fc839e98', '99177a44-836c-4edb-b0b5-225bfd1305ee', 'vorstand', '2025-12-01 21:36:54.627382+00'),
('f09c8d2c-5f5a-483e-8ee3-24cc34d5858c', '99177a44-836c-4edb-b0b5-225bfd1305ee', 'kranfuehrer', '2025-12-01 21:36:54.667457+00'),
('c1bc2456-14c1-4dbd-aaee-0ffa5501324d', '99177a44-836c-4edb-b0b5-225bfd1305ee', 'mitglied', '2025-12-01 21:36:54.70884+00'),
('ef90ade3-3ecf-4f30-bf77-28ca1fd53173', '99177a44-836c-4edb-b0b5-225bfd1305ee', 'gastmitglied', '2025-12-01 21:36:54.771514+00'),
('72fe8d7f-cf4a-46ce-ab1b-0c1f3c456a62', '75c394f3-0707-4fc3-89ea-fffd3777755c', 'vorstand', '2025-12-04 17:03:06.739301+00'),
('8a108ff8-cd28-4302-ad3f-511b666ddfac', '75c394f3-0707-4fc3-89ea-fffd3777755c', 'mitglied', '2025-12-04 17:03:06.794052+00');

-- ----------------------------------------------------------------------------
-- slots (Beispieldaten - Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.slots (id, date, time, duration, crane_operator_id, member_id, is_booked, is_mini_slot, mini_slot_count, start_minute, block_id, created_at, updated_at, is_test_data, notes) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '2026-01-25', '09:00:00', 30, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', NULL, false, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00', false, NULL),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '2026-01-25', '09:30:00', 30, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', '75c394f3-0707-4fc3-89ea-fffd3777755c', true, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-21 14:30:00+00', false, 'Einwassern'),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '2026-01-25', '10:00:00', 30, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', NULL, false, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00', false, NULL),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', '2026-01-26', '09:00:00', 30, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', 'c5751a82-23b6-4d4a-8aa1-3c89d086a6cf', true, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-22 09:15:00+00', false, 'Auswassern für Wartung'),
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', '2026-01-26', '10:00:00', 60, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', NULL, false, false, NULL, NULL, NULL, '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00', false, NULL);

-- ----------------------------------------------------------------------------
-- app_settings (gekürzte Auswahl - Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.app_settings (id, user_id, setting_key, setting_value, is_global, created_at, updated_at) VALUES
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', NULL, 'login_background', '{"mode": "gradient", "gradient": {"from": "hsl(202, 85%, 15%)", "to": "hsl(202, 70%, 35%)", "direction": "to-br"}, "overlay": {"enabled": true, "opacity": 0.3}}', true, '2025-06-01 10:00:00+00', '2025-12-01 15:30:00+00'),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', NULL, 'header_message', '{"enabled": true, "message": "Willkommen beim KSVL Slot Manager!", "type": "info"}', true, '2025-06-01 10:00:00+00', '2025-11-15 09:00:00+00'),
('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', NULL, 'dashboard_layout', '{"columns": 2, "widgets": ["weather", "harbor-status", "upcoming-slots", "member-stats"]}', true, '2025-06-01 10:00:00+00', '2025-12-10 14:00:00+00'),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', NULL, 'show_test_data', '{"enabled": false}', true, '2025-06-01 10:00:00+00', '2025-12-01 10:00:00+00'),
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', NULL, 'footer_menu', '{"items": ["dashboard", "calendar", "profile", "settings"]}', true, '2025-06-01 10:00:00+00', '2025-11-20 11:00:00+00');

-- ----------------------------------------------------------------------------
-- file_metadata (Beispiel-Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.file_metadata (id, filename, storage_path, file_type, mime_type, file_size, category, document_type, owner_id, linked_user_id, is_public, tags, description, allowed_roles, created_at, updated_at) VALUES
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'login-background.jpg', 'login-media/background.jpg', 'image', 'image/jpeg', 524288, 'login-media', NULL, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', NULL, true, '{"hintergrund", "login"}', 'Login-Hintergrundbild', NULL, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'versicherung-beispiel.pdf', 'member-documents/beispiel/versicherung.pdf', 'document', 'application/pdf', 102400, 'user_document', 'insurance', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', '75c394f3-0707-4fc3-89ea-fffd3777755c', false, '{"versicherung", "2024"}', 'Bootsversicherung 2024', NULL, '2025-08-15 14:30:00+00', '2025-08-15 14:30:00+00'),
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'bfa-beispiel.pdf', 'member-documents/beispiel/bfa.pdf', 'document', 'application/pdf', 81920, 'user_document', 'bfa', '5a7f5773-0c9c-4336-b06b-f2aaaa327764', '9090b21d-8287-4732-a301-9402d3c2b034', false, '{"bfa", "zertifikat"}', 'Befähigungsausweis', NULL, '2025-07-20 09:00:00+00', '2025-07-20 09:00:00+00'),
('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 'vereinsstatuten.pdf', 'documents/statuten-2024.pdf', 'document', 'application/pdf', 256000, 'general', NULL, '5a7f5773-0c9c-4336-b06b-f2aaaa327764', NULL, false, '{"statuten", "offiziell"}', 'Aktuelle Vereinsstatuten', '{"mitglied", "vorstand", "admin"}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- theme_settings (Beispiel-Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.theme_settings (id, name, category, hsl_value, description, is_default, created_at, updated_at) VALUES
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'primary', 'brand', '202 85% 23%', 'Haupt-Markenfarbe (KSVL Navy)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', 'secondary', 'brand', '180 50% 45%', 'Sekundärfarbe (Türkis)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', 'accent', 'brand', '45 90% 55%', 'Akzentfarbe (Gold)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', 'background', 'surface', '200 20% 98%', 'Hintergrundfarbe (Hell)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'foreground', 'surface', '202 85% 15%', 'Textfarbe (Dunkel)', true, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- role_badge_settings (5 Einträge - Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.role_badge_settings (id, role, bg_color, text_color, created_at, updated_at) VALUES
('b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', 'admin', 'hsl(0, 70%, 50%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 'vorstand', 'hsl(45, 90%, 50%)', 'hsl(0, 0%, 15%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', 'kranfuehrer', 'hsl(202, 85%, 40%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', 'mitglied', 'hsl(202, 85%, 23%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', 'gastmitglied', 'hsl(180, 30%, 50%)', 'hsl(0, 0%, 100%)', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- role_configurations (5 Einträge - Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.role_configurations (id, role, label, display_order, created_at, updated_at) VALUES
('a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d', 'admin', 'Administrator', 1, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('b6c7d8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e', 'vorstand', 'Vorstand', 2, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f', 'kranfuehrer', 'Kranführer', 3, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('d8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a', 'mitglied', 'Mitglied', 4, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('e9f0a1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b', 'gastmitglied', 'Gastmitglied', 5, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- menu_item_definitions (11 Einträge - text-basierte IDs sind hier korrekt)
-- ----------------------------------------------------------------------------
INSERT INTO public.menu_item_definitions (id, label, icon, allowed_roles, menu_type, created_at, updated_at) VALUES
('dashboard', 'Dashboard', 'LayoutDashboard', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('calendar', 'Kalender', 'Calendar', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('profile', 'Profil', 'User', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('settings', 'Einstellungen', 'Settings', '{"admin", "vorstand"}', 'footer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('users', 'Mitglieder', 'Users', '{"admin", "vorstand"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('files', 'Dokumente', 'FileText', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('slots', 'Slots verwalten', 'Clock', '{"admin", "kranfuehrer"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('reports', 'Berichte', 'BarChart3', '{"admin", "vorstand"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('harbor', 'Hafen-Chat', 'MessageCircle', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('admin-settings', 'Admin-Settings', 'Shield', '{"admin"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('logout', 'Abmelden', 'LogOut', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'drawer', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- dashboard_widget_definitions (8 Einträge - text-basierte IDs sind hier korrekt)
-- ----------------------------------------------------------------------------
INSERT INTO public.dashboard_widget_definitions (id, name, description, component_name, allowed_roles, category, size, default_enabled, default_column, default_order, settings, created_at, updated_at) VALUES
('weather', 'Wetter', 'Aktuelle Wetterdaten vom Wörthersee', 'WeatherWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'info', 'small', true, 1, 1, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('harbor-status', 'Hafenstatus', 'Aktueller Status des Hafens', 'HarborStatusWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'info', 'small', true, 1, 2, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('member-stats', 'Mitglieder-Statistik', 'Übersicht der Mitgliederzahlen', 'MemberStatsWidget', '{"admin", "vorstand"}', 'stats', 'medium', true, 2, 1, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('events', 'Termine', 'Kommende Vereinstermine', 'EventsCalendarWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'calendar', 'medium', true, 2, 2, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('maintenance', 'Wartungshinweise', 'Aktuelle Wartungsmeldungen', 'MaintenanceAlertsWidget', '{"admin", "vorstand", "kranfuehrer"}', 'alerts', 'small', true, 1, 3, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('finance', 'Finanzen', 'Finanzübersicht', 'FinanceOverviewWidget', '{"admin", "vorstand"}', 'finance', 'medium', false, 2, 3, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('harbor-chat', 'Hafen-Chat', 'Schnellzugriff auf den Hafen-Chat', 'HarborChatWidget', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'communication', 'small', true, 1, 4, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('ai-chat', 'AI Assistent', 'KI-gestützter Vereinsassistent', 'AIChatMiniWidget', '{"admin", "vorstand"}', 'ai', 'medium', false, 2, 4, '{}', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- dashboard_section_definitions (5 Einträge - text-basierte IDs sind hier korrekt)
-- ----------------------------------------------------------------------------
INSERT INTO public.dashboard_section_definitions (id, name, description, component_name, allowed_roles, category, size, default_enabled, default_column, default_order, created_at, updated_at) VALUES
('welcome', 'Willkommen', 'Begrüßungsbereich mit personalisierten Infos', 'WelcomeSection', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'header', 'full', true, 1, 1, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('stats', 'Statistiken', 'Übersichtskarten mit wichtigen Zahlen', 'StatsGridSection', '{"admin", "vorstand", "kranfuehrer"}', 'stats', 'full', true, 1, 2, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('quick-actions', 'Schnellaktionen', 'Häufig verwendete Aktionen', 'QuickActionsSection', '{"admin", "vorstand", "kranfuehrer", "mitglied"}', 'actions', 'full', true, 1, 3, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('activity', 'Aktivitäten', 'Letzte Aktivitäten im Verein', 'ActivityFeedSection', '{"admin", "vorstand"}', 'feed', 'full', true, 1, 4, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('announcements', 'Ankündigungen', 'Wichtige Vereinsmitteilungen', 'AnnouncementsSection', '{"admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"}', 'communication', 'full', false, 1, 5, '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- ai_assistant_defaults (5 Einträge - Schema-Referenz mit validen UUIDs)
-- ----------------------------------------------------------------------------
INSERT INTO public.ai_assistant_defaults (id, role, tonality, welcome_message, created_at, updated_at) VALUES
('f0a1b2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c', 'admin', 'professionell und technisch', 'Hallo Administrator! Ich bin dein KI-Assistent für technische und administrative Fragen rund um den KSVL.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'vorstand', 'professionell und strategisch', 'Guten Tag! Als Vorstandsmitglied kann ich Sie bei Vereinsfragen und strategischen Entscheidungen unterstützen.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'kranfuehrer', 'freundlich und praktisch', 'Ahoi Kranführer! Wie kann ich dir heute beim Kranbetrieb helfen?', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'mitglied', 'freundlich und hilfsbereit', 'Willkommen beim KSVL! Ich bin hier, um dir bei Fragen zu deiner Mitgliedschaft, Buchungen und allem rund um den Verein zu helfen.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'gastmitglied', 'einladend und informativ', 'Herzlich willkommen als Gast beim Klagenfurter Segelverein Loretto! Ich beantworte gerne deine Fragen zum Verein.', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- monday_settings (1 Eintrag - Schema-Referenz mit valider UUID)
-- ----------------------------------------------------------------------------
INSERT INTO public.monday_settings (id, board_id, api_key_set, column_mapping, auto_sync_enabled, last_sync_at, webhook_url, created_at, updated_at) VALUES
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', NULL, true, '{}', false, NULL, NULL, '2025-10-01 10:00:00+00', '2025-12-01 15:00:00+00');

-- ============================================================================
-- ENDE DES DUMPS
-- ============================================================================
