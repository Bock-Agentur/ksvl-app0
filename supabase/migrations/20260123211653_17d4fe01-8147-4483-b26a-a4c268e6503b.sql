-- Entferne nicht mehr benötigte Custom Fields Tabellen
-- Diese Tabellen sind leer und das Modul wurde aus dem Code entfernt

-- Erst die abhängige Tabelle löschen
DROP TABLE IF EXISTS public.custom_field_values CASCADE;

-- Dann die Haupttabelle löschen
DROP TABLE IF EXISTS public.custom_fields CASCADE;