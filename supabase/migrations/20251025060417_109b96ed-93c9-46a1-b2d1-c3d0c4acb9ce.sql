-- =====================================================
-- Phase 2: Database Consolidation Migration
-- Moves hardcoded configurations to database tables
-- =====================================================

-- 1. Role Configurations Table
CREATE TABLE IF NOT EXISTS public.role_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.role_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role configurations"
  ON public.role_configurations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage role configurations"
  ON public.role_configurations FOR ALL
  USING (is_admin(auth.uid()));

-- 2. Dashboard Widget Definitions Table
CREATE TABLE IF NOT EXISTS public.dashboard_widget_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  component_name TEXT NOT NULL,
  default_enabled BOOLEAN DEFAULT true,
  allowed_roles TEXT[] NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  default_column INTEGER NOT NULL,
  default_order INTEGER NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dashboard_widget_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read widget definitions"
  ON public.dashboard_widget_definitions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage widget definitions"
  ON public.dashboard_widget_definitions FOR ALL
  USING (is_admin(auth.uid()));

-- 3. Dashboard Section Definitions Table
CREATE TABLE IF NOT EXISTS public.dashboard_section_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  component_name TEXT NOT NULL,
  default_enabled BOOLEAN DEFAULT true,
  allowed_roles TEXT[] NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  default_column INTEGER NOT NULL,
  default_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dashboard_section_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read section definitions"
  ON public.dashboard_section_definitions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage section definitions"
  ON public.dashboard_section_definitions FOR ALL
  USING (is_admin(auth.uid()));

-- 4. Menu Item Definitions Table
CREATE TABLE IF NOT EXISTS public.menu_item_definitions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  allowed_roles TEXT[] NOT NULL,
  menu_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.menu_item_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu definitions"
  ON public.menu_item_definitions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage menu definitions"
  ON public.menu_item_definitions FOR ALL
  USING (is_admin(auth.uid()));

-- 5. AI Assistant Defaults Table
CREATE TABLE IF NOT EXISTS public.ai_assistant_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE,
  tonality TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_assistant_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read AI defaults"
  ON public.ai_assistant_defaults FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage AI defaults"
  ON public.ai_assistant_defaults FOR ALL
  USING (is_admin(auth.uid()));

-- 6. Create triggers for updated_at
CREATE TRIGGER update_role_configurations_updated_at
  BEFORE UPDATE ON public.role_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_definitions_updated_at
  BEFORE UPDATE ON public.dashboard_widget_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_section_definitions_updated_at
  BEFORE UPDATE ON public.dashboard_section_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_definitions_updated_at
  BEFORE UPDATE ON public.menu_item_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_defaults_updated_at
  BEFORE UPDATE ON public.ai_assistant_defaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Initial Data Migration from Hardcoded Values
-- =====================================================

-- Insert Role Configurations
INSERT INTO public.role_configurations (role, label, display_order) VALUES
  ('admin', 'Admin', 1),
  ('vorstand', 'Vorstand', 2),
  ('kranfuehrer', 'Kranführer', 3),
  ('mitglied', 'Mitglied', 4),
  ('gastmitglied', 'Gastmitglied', 5)
ON CONFLICT (role) DO NOTHING;

-- Insert Dashboard Widget Definitions
INSERT INTO public.dashboard_widget_definitions 
  (id, name, description, component_name, default_enabled, allowed_roles, category, size, default_column, default_order, settings)
VALUES
  ('weather', 'Wetter', 'Aktuelle Wetterbedingungen und Vorhersage', 'WeatherWidget', true, 
   ARRAY['mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'info', 'medium', 1, 1, 
   '{"refreshInterval": 300000, "showDetails": true}'::jsonb),
  
  ('harborStatus', 'Hafenstatus', 'Aktuelle Bedingungen im Hafen', 'HarborStatusWidget', true,
   ARRAY['kranfuehrer', 'admin', 'vorstand'], 'info', 'medium', 1, 2,
   '{"refreshInterval": 60000, "showDetails": true}'::jsonb),
  
  ('memberStats', 'Mitglieder-Statistiken', 'Übersicht über Mitgliederzahlen und Aktivitäten', 'MemberStatsWidget', true,
   ARRAY['admin', 'vorstand'], 'stats', 'medium', 2, 1,
   '{"refreshInterval": 3600000, "showDetails": false}'::jsonb),
  
  ('financeOverview', 'Finanz-Übersicht', 'Einnahmen, Ausgaben und Budgets', 'FinanceOverviewWidget', true,
   ARRAY['admin', 'vorstand'], 'management', 'medium', 2, 2,
   '{"refreshInterval": 3600000, "showDetails": true}'::jsonb),
  
  ('maintenanceAlerts', 'Wartungshinweise', 'Anstehende Wartungen und Reparaturen', 'MaintenanceAlertsWidget', true,
   ARRAY['kranfuehrer', 'admin', 'vorstand'], 'management', 'medium', 3, 1,
   '{"refreshInterval": 1800000, "showDetails": true}'::jsonb),
  
  ('eventsCalendar', 'Vereinsevents', 'Anstehende Veranstaltungen und Termine', 'EventsCalendarWidget', true,
   ARRAY['mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'communication', 'medium', 2, 3,
   '{"refreshInterval": 3600000, "showDetails": false}'::jsonb),
  
  ('harborChat', 'KSVL-Assistent', 'AI-Chatbot für Fragen zu Terminen und Mitgliedern', 'HarborChatWidget', false,
   ARRAY['mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'communication', 'large', 3, 2,
   '{"refreshInterval": 0, "showDetails": true}'::jsonb),
  
  ('aiChatMini', 'AI-Assistent (Mini)', 'Kompakter AI-Chat mit Ausklapp-Funktion', 'AIChatMiniWidget', true,
   ARRAY['mitglied', 'gastmitglied', 'kranfuehrer', 'admin', 'vorstand'], 'communication', 'small', 3, 1,
   '{"refreshInterval": 0, "showDetails": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert Dashboard Section Definitions
INSERT INTO public.dashboard_section_definitions
  (id, name, description, component_name, default_enabled, allowed_roles, category, size, default_column, default_order)
VALUES
  ('headerCard', 'Header-Card', 'Profilbereich mit Suche und Benachrichtigungen', 'DashboardHeader', true,
   ARRAY['mitglied', 'gastmitglied', 'kranfuehrer', 'admin', 'vorstand'], 'core', 'large', 1, -1),
  
  ('welcomeSection', 'Willkommensnachricht', 'Begrüßung und nächster Termin', 'WelcomeSection', true,
   ARRAY['mitglied', 'gastmitglied', 'kranfuehrer', 'admin', 'vorstand'], 'core', 'large', 1, 0),
  
  ('statsGrid', 'Statistik-Übersicht', 'Buchungen und Auslastung', 'StatsGridSection', true,
   ARRAY['mitglied', 'gastmitglied', 'kranfuehrer', 'admin', 'vorstand'], 'stats', 'large', 1, 1),
  
  ('quickActions', 'Schnellzugriff', 'Direkte Links zu häufig genutzten Funktionen', 'QuickActionsSection', true,
   ARRAY['mitglied', 'gastmitglied', 'kranfuehrer', 'admin', 'vorstand'], 'actions', 'large', 1, 100),
  
  ('activityFeed', 'Live-Activity Feed', 'Echtzeitaktivitäten und Benachrichtigungen', 'ActivityFeedSection', true,
   ARRAY['mitglied', 'gastmitglied', 'kranfuehrer', 'admin', 'vorstand'], 'feed', 'large', 1, 101)
ON CONFLICT (id) DO NOTHING;

-- Insert Menu Item Definitions
INSERT INTO public.menu_item_definitions (id, label, icon, allowed_roles, menu_type) VALUES
  -- Header Items
  ('settings', 'Einstellungen', 'Settings', ARRAY['admin', 'vorstand'], 'header'),
  ('users', 'Mitglieder', 'Users', ARRAY['admin', 'vorstand'], 'header'),
  ('slots', 'Slot Manager', 'Layers', ARRAY['admin', 'kranfuehrer', 'vorstand'], 'header'),
  
  -- Footer Items
  ('dashboard', 'Dashboard', 'Home', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer'),
  ('calendar', 'Kalender', 'Calendar', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer'),
  ('profile', 'Profil', 'User', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer'),
  ('reports', 'Berichte', 'BarChart3', ARRAY['admin', 'kranfuehrer', 'vorstand'], 'footer'),
  ('notifications', 'Hinweise', 'Bell', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer'),
  ('help', 'Hilfe', 'HelpCircle', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer'),
  ('weather', 'Wetter', 'Cloud', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer'),
  ('harbor', 'Hafenstatus', 'Anchor', ARRAY['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'], 'footer')
ON CONFLICT (id) DO NOTHING;

-- Insert AI Assistant Defaults
INSERT INTO public.ai_assistant_defaults (role, tonality, welcome_message) VALUES
  ('gastmitglied', 'witty', '🌊 Willkommen als Gast im Hafenverwaltungssystem! 

Als Gastmitglied können Sie:
• Termine buchen 📅
• Ihre Buchungen verwalten 📋
• Den Kalender einsehen 👀

Viel Spaß beim Segeln! ⛵'),
  
  ('mitglied', 'witty', '🌊 Willkommen im Hafenverwaltungssystem! 

Als Mitglied können Sie:
• Termine buchen 📅
• Ihre Buchungen verwalten 📋
• Den Kalender einsehen 👀

Viel Spaß beim Segeln! ⛵'),
  
  ('kranfuehrer', 'funny', '🚢 Willkommen Kranführer! 

Ihre Aufgaben:
• Termine erstellen und verwalten ⚙️
• Kranführung koordinieren 🎯
• Mitglieder unterstützen 🤝

Bereit für den Hafenbetrieb! ⚓'),
  
  ('admin', 'formal', '⚙️ Administrator-Dashboard 

Vollzugriff auf:
• Benutzerverwaltung 👥
• Systemeinstellungen 🔧
• Alle Termine und Buchungen 📊
• Dashboard-Konfiguration 📋

System bereit! ✅'),
  
  ('vorstand', 'formal', '👔 Vorstand-Dashboard 

Vollzugriff auf:
• Benutzerverwaltung 👥
• Systemeinstellungen 🔧
• Alle Termine und Buchungen 📊
• Dashboard-Konfiguration 📋
• Vorstandsfunktionen 🏛️

System bereit! ✅')
ON CONFLICT (role) DO NOTHING;