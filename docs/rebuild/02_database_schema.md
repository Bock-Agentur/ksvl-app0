# KSVL Slot Manager - Datenbank-Schema

## 1. Übersicht

Die KSVL App verwendet eine PostgreSQL-Datenbank über Supabase mit folgenden Hauptbereichen:

- **Benutzer & Rollen**: profiles, user_roles
- **Slots/Krantermine**: slots
- **Einstellungen**: app_settings, theme_settings, role_badge_settings
- **Dashboard**: dashboard_widget_definitions, dashboard_section_definitions
- **Dateien**: file_metadata
- **Navigation**: menu_item_definitions, role_configurations
- **AI**: ai_assistant_defaults
- **Integrationen**: monday_settings, monday_sync_logs

## 2. Enum Types

### app_role

```sql
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'vorstand', 
  'kranfuehrer',
  'mitglied',
  'gastmitglied'
);
```

## 3. Tabellen

### 3.1 profiles

**Beschreibung**: Benutzerprofildaten (verknüpft mit auth.users)

```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  phone TEXT,
  
  -- Mitgliedschaft
  member_number TEXT,
  membership_type TEXT,
  membership_status TEXT DEFAULT 'Aktiv',
  oesv_number TEXT,
  entry_date DATE,
  birth_date DATE,
  
  -- Adresse
  address TEXT,
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  
  -- Boot
  boat_name TEXT,
  boat_type TEXT,
  boat_length NUMERIC,
  boat_width NUMERIC,
  boat_color TEXT,
  
  -- Liegeplatz
  berth_number TEXT,
  berth_type TEXT,
  berth_length NUMERIC,
  berth_width NUMERIC,
  buoy_radius NUMERIC,
  has_dinghy_berth BOOLEAN DEFAULT false,
  dinghy_berth_number TEXT,
  
  -- Zusatzinfos
  parking_permit_number TEXT,
  parking_permit_issue_date DATE,
  beverage_chip_number TEXT,
  beverage_chip_issue_date DATE,
  beverage_chip_status TEXT DEFAULT 'Aktiv',
  
  -- Notfallkontakt
  emergency_contact TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Vorstand
  vorstand_funktion TEXT,
  board_position_start_date DATE,
  board_position_end_date DATE,
  board_position_history JSONB DEFAULT '[]',
  
  -- Dokumente (Storage Paths)
  document_bfa TEXT,
  document_insurance TEXT,
  document_berth_contract TEXT,
  document_member_photo TEXT,
  
  -- Einstellungen
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  password_change_required BOOLEAN DEFAULT false,
  two_factor_method TEXT DEFAULT 'Aus',
  
  -- Datenschutz
  data_public_in_ksvl BOOLEAN DEFAULT false,
  contact_public_in_ksvl BOOLEAN DEFAULT false,
  statute_accepted BOOLEAN DEFAULT false,
  privacy_accepted BOOLEAN DEFAULT false,
  newsletter_optin BOOLEAN DEFAULT false,
  
  -- AI Feature
  ai_info_enabled BOOLEAN DEFAULT false,
  
  -- Audit
  notes TEXT,
  is_test_data BOOLEAN DEFAULT false,
  is_role_user BOOLEAN DEFAULT false,
  created_by UUID,
  modified_by UUID,
  monday_item_id TEXT,
  membership_status_history JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_member_number ON profiles(member_number);
```

**RLS Policies:**
```sql
-- Users can view own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can view own profile or admins/vorstand can view all
CREATE POLICY "Users can view own profile or admins can view all" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    is_admin(auth.uid()) OR 
    has_role(auth.uid(), 'vorstand')
  );

-- Users can update own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Users can insert own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (is_admin(auth.uid()));
```

### 3.2 user_roles

**Beschreibung**: Rollenzuweisungen für Benutzer

```sql
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, role)
);

-- Index
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

**RLS Policies:**
```sql
-- Authenticated users can view all roles
CREATE POLICY "Authenticated users can view all roles" ON user_roles
  FOR SELECT USING (true);

-- Admins can insert roles
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Admins can update roles
CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles" ON user_roles
  FOR DELETE USING (is_admin(auth.uid()));
```

### 3.3 slots

**Beschreibung**: Krantermine/Buchungsslots

```sql
CREATE TABLE public.slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in Minuten
  crane_operator_id UUID NOT NULL,
  member_id UUID,
  is_booked BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Block/Mini-Slot Features
  block_id UUID,
  is_mini_slot BOOLEAN DEFAULT false,
  mini_slot_count INTEGER,
  start_minute INTEGER,
  
  -- Audit
  is_test_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_slots_date ON slots(date);
CREATE INDEX idx_slots_crane_operator ON slots(crane_operator_id);
CREATE INDEX idx_slots_member ON slots(member_id);
CREATE INDEX idx_slots_block ON slots(block_id);
```

**RLS Policies:**
```sql
-- Everyone can view slots
CREATE POLICY "Everyone can view slots" ON slots
  FOR SELECT USING (true);

-- Crane operators, vorstand and admins can create slots
CREATE POLICY "Crane operators, vorstand and admins can create slots" ON slots
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'kranfuehrer') OR 
    has_role(auth.uid(), 'vorstand')
  );

-- Crane operators and admins can update slots
CREATE POLICY "Crane operators and admins can update slots" ON slots
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'kranfuehrer') AND crane_operator_id = auth.uid())
  );

-- Members can book slots
CREATE POLICY "Members can book slots" ON slots
  FOR UPDATE 
  USING (NOT is_booked AND auth.uid() IS NOT NULL)
  WITH CHECK (member_id = auth.uid() AND is_booked = true);

-- Members can update their own booked slots
CREATE POLICY "Members can update their own booked slots" ON slots
  FOR UPDATE
  USING (is_booked = true AND member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- Admins can delete slots
CREATE POLICY "Admins can delete slots" ON slots
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

### 3.4 app_settings

**Beschreibung**: Zentrale Einstellungsspeicherung

```sql
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX idx_app_settings_user ON app_settings(user_id);
CREATE UNIQUE INDEX idx_app_settings_unique ON app_settings(setting_key, user_id, is_global);
```

**Wichtige Setting Keys:**
| Key | Typ | Beschreibung |
|-----|-----|--------------|
| `login_background` | Global | Login-Hintergrund Konfiguration |
| `dashboard-settings-template-{role}` | Global | Dashboard-Layout pro Rolle |
| `footer-settings-template-{role}` | Global | Footer-Menü pro Rolle |
| `marina-menu-settings-template` | Global | Header-Menü Konfiguration |
| `slot-design-settings` | Global | Slot-Farben |
| `aiAssistantSettings` | Global | AI-Assistent Konfiguration |
| `aiWelcomeMessage` | Global | AI Willkommensnachricht |
| `roleWelcomeMessages` | Global | Begrüßungstexte pro Rolle |
| `consecutiveSlotsEnabled` | Global | Consecutive Slots Feature |

**RLS Policies:**
```sql
-- Public can view login background
CREATE POLICY "Public can view login background" ON app_settings
  FOR SELECT USING (setting_key = 'login_background' AND is_global = true);

-- Authenticated users view settings
CREATE POLICY "Authenticated users view settings" ON app_settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = user_id OR is_global = true)
  );

-- Admins can view all settings
CREATE POLICY "Admins can view all settings" ON app_settings
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can insert global settings
CREATE POLICY "Admins can insert global settings" ON app_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()) AND is_global = true);

-- Admins can update global settings
CREATE POLICY "Admins can update global settings" ON app_settings
  FOR UPDATE USING (is_admin(auth.uid()));

-- Users can insert/update/delete their own settings
CREATE POLICY "Users can insert their own settings" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON app_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON app_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can delete any settings
CREATE POLICY "Admins can delete any settings" ON app_settings
  FOR DELETE USING (is_admin(auth.uid()));
```

### 3.5 file_metadata

**Beschreibung**: Metadaten für Dateien im Storage

```sql
CREATE TABLE public.file_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' | 'video'
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  owner_id UUID,
  linked_user_id UUID,
  category TEXT NOT NULL, -- 'login_media' | 'user_document' | 'general' | 'shared'
  document_type TEXT, -- 'bfa' | 'insurance' | 'berth_contract' | 'member_photo'
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  allowed_roles TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_file_metadata_owner ON file_metadata(owner_id);
CREATE INDEX idx_file_metadata_category ON file_metadata(category);
CREATE INDEX idx_file_metadata_linked_user ON file_metadata(linked_user_id);
CREATE UNIQUE INDEX idx_file_metadata_storage_path ON file_metadata(storage_path);
```

**RLS Policies:**
```sql
-- Admins can view all files
CREATE POLICY "Admins can view all files" ON file_metadata
  FOR SELECT USING (is_admin(auth.uid()));

-- Anyone can view public files
CREATE POLICY "Anyone can view public files" ON file_metadata
  FOR SELECT USING (is_public = true);

-- Users can view own files
CREATE POLICY "Users can view own files" ON file_metadata
  FOR SELECT USING (owner_id = auth.uid());

-- Users can view linked files
CREATE POLICY "Users can view linked files" ON file_metadata
  FOR SELECT USING (linked_user_id = auth.uid());

-- Users can view role-allowed files
CREATE POLICY "Users can view role-allowed files" ON file_metadata
  FOR SELECT USING (
    is_admin(auth.uid()) OR
    owner_id = auth.uid() OR
    linked_user_id = auth.uid() OR
    is_public = true OR
    (allowed_roles IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role::text = ANY(file_metadata.allowed_roles)
    ))
  );

-- Users can upload own files
CREATE POLICY "Users can upload own files" ON file_metadata
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND 
    (linked_user_id IS NULL OR linked_user_id = auth.uid())
  );

-- Admins can insert files
CREATE POLICY "Admins can insert files" ON file_metadata
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Users/Admins can update/delete own files
CREATE POLICY "Users can update own files" ON file_metadata
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Admins can update files" ON file_metadata
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can delete own files" ON file_metadata
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Admins can delete files" ON file_metadata
  FOR DELETE USING (is_admin(auth.uid()));
```

### 3.6 theme_settings

**Beschreibung**: Theme-Farbdefinitionen

```sql
CREATE TABLE public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  hsl_value TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
```sql
CREATE POLICY "Anyone can read theme settings" ON theme_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert/update/delete theme settings" ON theme_settings
  FOR ALL USING (is_admin(auth.uid()));
```

### 3.7 role_badge_settings

**Beschreibung**: Badge-Farben pro Rolle

```sql
CREATE TABLE public.role_badge_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE,
  bg_color TEXT NOT NULL DEFAULT 'hsl(202, 85%, 23%)',
  text_color TEXT NOT NULL DEFAULT 'hsl(0, 0%, 100%)',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.8 dashboard_widget_definitions

**Beschreibung**: Dashboard-Widget Definitionen

```sql
CREATE TABLE public.dashboard_widget_definitions (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  component_name TEXT NOT NULL,
  allowed_roles TEXT[] NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  default_enabled BOOLEAN DEFAULT true,
  default_column INTEGER NOT NULL,
  default_order INTEGER NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.9 dashboard_section_definitions

**Beschreibung**: Dashboard-Section Definitionen

```sql
CREATE TABLE public.dashboard_section_definitions (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  component_name TEXT NOT NULL,
  allowed_roles TEXT[] NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  default_enabled BOOLEAN DEFAULT true,
  default_column INTEGER NOT NULL,
  default_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.10 menu_item_definitions

**Beschreibung**: Menü-Item Definitionen

```sql
CREATE TABLE public.menu_item_definitions (
  id TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  allowed_roles TEXT[] NOT NULL,
  menu_type TEXT NOT NULL, -- 'header' | 'footer'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.11 role_configurations

**Beschreibung**: Rollen-Konfiguration

```sql
CREATE TABLE public.role_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.12 ai_assistant_defaults

**Beschreibung**: AI-Assistenten Standardwerte

```sql
CREATE TABLE public.ai_assistant_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL UNIQUE,
  tonality TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.13 monday_settings

**Beschreibung**: Monday.com Integration Einstellungen

```sql
CREATE TABLE public.monday_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id TEXT,
  webhook_url TEXT,
  api_key_set BOOLEAN DEFAULT false,
  column_mapping JSONB DEFAULT '{}',
  auto_sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.14 monday_sync_logs

**Beschreibung**: Monday.com Sync-Protokolle

```sql
CREATE TABLE public.monday_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  sync_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  action TEXT NOT NULL,
  board_id TEXT,
  item_id TEXT,
  success BOOLEAN NOT NULL,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

## 4. Database Functions

### 4.1 has_role

```sql
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
```

### 4.2 is_admin

```sql
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;
```

### 4.3 handle_new_user (Trigger)

```sql
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
```

### 4.4 get_email_for_login

```sql
CREATE OR REPLACE FUNCTION public.get_email_for_login(username_input text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email FROM profiles WHERE LOWER(username) = LOWER(username_input) LIMIT 1;
$$;
```

### 4.5 can_access_file

```sql
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
  
  -- Admin check
  IF is_admin(current_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Owner check
  IF file_record.owner_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Linked user check
  IF file_record.linked_user_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Public check
  IF file_record.is_public THEN
    RETURN TRUE;
  END IF;
  
  -- Role check
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
```

### 4.6 update_updated_at_column (Trigger)

```sql
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
```

## 5. Storage Buckets

| Bucket | Public | Beschreibung |
|--------|--------|--------------|
| `login-media` | Ja | Login-Hintergrundbilder und -Videos |
| `documents` | Nein | Allgemeine Dokumente |
| `member-documents` | Nein | Mitgliederdokumente (BFA, Versicherung, etc.) |

## 6. ER-Diagramm

```
┌─────────────┐      ┌──────────────┐
│   auth.users │◄─────│   profiles    │
└─────────────┘      └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  user_roles   │
                     └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    slots      │    │file_metadata │    │ app_settings │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

**Letzte Aktualisierung**: 2026-01-23
