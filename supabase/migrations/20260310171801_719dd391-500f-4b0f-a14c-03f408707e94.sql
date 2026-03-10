
-- Drop 7 unused tables (no frontend code references them)
DROP TABLE IF EXISTS public.role_configurations CASCADE;
DROP TABLE IF EXISTS public.ai_assistant_defaults CASCADE;
DROP TABLE IF EXISTS public.dashboard_widget_definitions CASCADE;
DROP TABLE IF EXISTS public.dashboard_section_definitions CASCADE;
DROP TABLE IF EXISTS public.menu_item_definitions CASCADE;
DROP TABLE IF EXISTS public.monday_settings CASCADE;
DROP TABLE IF EXISTS public.monday_sync_logs CASCADE;
