# KSVL App - Remix Migration Guide

> Vollständige Anleitung zur Migration der KSVL App in eine neue Supabase-Instanz

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Schritt-für-Schritt-Anleitung](#3-schritt-für-schritt-anleitung)
4. [Checkliste](#4-checkliste)
5. [Troubleshooting](#5-troubleshooting)
6. [Übertragungs-Matrix](#6-übertragungs-matrix)

---

## 1. Übersicht

### Was ist ein Remix?

Ein "Remix" erstellt eine Kopie des Lovable-Projekts mit dem gesamten Frontend-Code, aber **ohne** die Datenbank-Daten und Konfiguration. Die neue Instanz benötigt eine eigene Supabase-Datenbank.

### Was wird übertragen?

| Element | Methode | Automatisch? |
|---------|---------|--------------|
| Frontend-Code | Remix | ✅ Ja |
| DB-Schema | SQL-Dump | ⚠️ Manuell |
| RLS Policies | SQL-Dump | ⚠️ Manuell |
| DB-Funktionen | SQL-Dump | ⚠️ Manuell |
| Seed-Daten | SQL-Dump | ⚠️ Manuell |
| Storage Buckets | SQL-Dump | ⚠️ Manuell |
| Storage RLS | SQL-Dump | ⚠️ Manuell |
| Auth-Trigger | SQL-Dump | ⚠️ Manuell |
| Edge Functions | Supabase CLI | ⚠️ Manuell |
| Secrets | Dashboard | ⚠️ Manuell |
| User-Daten | - | ❌ Nicht möglich |
| Uploads (Bilder) | - | ❌ Nicht möglich |

---

## 2. Voraussetzungen

### 2.1 Neues Supabase-Projekt

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. **Empfohlene Region**: Frankfurt (eu-central-1) für DSGVO-Konformität
3. Notiere die Credentials:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbG...` (öffentlich)
   - **Service Role Key**: `eyJhbG...` (geheim!)

### 2.2 Supabase CLI

```bash
# Installation
npm install -g supabase

# Login
supabase login

# Mit Projekt verbinden
supabase link --project-ref <project-id>
```

### 2.3 Benötigte Dateien

- `docs/database/ksvl_database_dump_2026-01-23.sql` (vollständiger DB-Dump)
- `supabase/functions/*` (Edge Functions)

---

## 3. Schritt-für-Schritt-Anleitung

### Schritt 1: Supabase-Projekt erstellen

1. Auf [supabase.com](https://supabase.com) einloggen
2. "New Project" klicken
3. Projektname: z.B. `ksvl-remix`
4. Datenbank-Passwort festlegen (sicher aufbewahren!)
5. Region: `eu-central-1` (Frankfurt)
6. "Create new project" klicken
7. Warten bis das Projekt bereit ist (~2 Minuten)

### Schritt 2: SQL-Dump ausführen

1. Im Supabase Dashboard: **SQL Editor** öffnen
2. Den kompletten Inhalt von `docs/database/ksvl_database_dump_2026-01-23.sql` einfügen
3. **"Run"** klicken
4. Auf erfolgreiche Ausführung prüfen (grüner Haken)

> ⚠️ **Wichtig**: Der Dump enthält alle 8 Teile:
> - TEIL 1: Enums
> - TEIL 2: Tabellen (14 Stück)
> - TEIL 3: DB-Funktionen (6 Stück)
> - TEIL 4: RLS Policies (50+ Stück)
> - TEIL 5: Seed-Daten
> - TEIL 6: Storage Buckets (3 Stück)
> - TEIL 7: Storage RLS Policies
> - TEIL 8: Auth-Trigger

### Schritt 3: Auth-Einstellungen konfigurieren

1. **Authentication** → **Providers** → **Email**
2. ✅ "Enable Email provider" aktivieren
3. ✅ "Confirm email" **deaktivieren** (für einfacheres Testing)
4. **Save** klicken

### Schritt 4: Edge Functions deployen

```bash
# Terminal öffnen und ins Projektverzeichnis wechseln
cd ksvl-app

# Mit neuem Supabase-Projekt verbinden
supabase link --project-ref <neue-project-id>

# Alle Edge Functions deployen
supabase functions deploy harbor-chat
supabase functions deploy manage-user
supabase functions deploy manage-user-password
supabase functions deploy reset-password-admin
supabase functions deploy create-admin
supabase functions deploy monday-webhook
supabase functions deploy sync-monday
supabase functions deploy migrate-storage-files
```

### Schritt 5: Secrets konfigurieren

Im Supabase Dashboard: **Project Settings** → **Edge Functions** → **Secrets**

| Secret | Wert | Pflicht |
|--------|------|---------|
| `GOOGLE_API_KEY` | API-Key von [ai.google.dev](https://ai.google.dev) | ✅ Ja |
| `ADMIN_PASSWORD_RESET_KEY` | Selbst generierter sicherer String | ✅ Ja |
| `MONDAY_API_KEY` | Monday.com API Key | ⚪ Optional |
| `MONDAY_SIGNING_SECRET` | Monday.com Webhook Secret | ⚪ Optional |

### Schritt 6: Admin-User erstellen

**Option A: Über Supabase Dashboard**
1. **Authentication** → **Users** → **Add User**
2. Email und Passwort eingeben
3. Nach Login: Admin-Rolle manuell zuweisen

**Option B: Über Edge Function**
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/create-admin \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ksvl.at",
    "password": "sicheres-passwort-123!",
    "name": "Administrator"
  }'
```

### Schritt 7: Frontend konfigurieren

Die `.env` Datei im Projektroot aktualisieren:

```env
VITE_SUPABASE_URL=https://<neue-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<neuer-anon-key>
VITE_SUPABASE_PROJECT_ID=<neue-project-id>
```

### Schritt 8: Verifizierung

1. **Login testen**: Mit Admin-User einloggen
2. **Profil prüfen**: Wurde automatisch erstellt? (handle_new_user Trigger)
3. **Dashboard laden**: Widgets sichtbar?
4. **Kalender öffnen**: Slot-Ansicht funktioniert?
5. **Harbor-Chat testen**: AI antwortet? (GOOGLE_API_KEY erforderlich)
6. **Dateimanager**: Upload testen (Storage Buckets)

---

## 4. Checkliste

### ✅ Datenbank

- [ ] Enum `app_role` erstellt
- [ ] Tabelle `profiles` erstellt
- [ ] Tabelle `user_roles` erstellt
- [ ] Tabelle `slots` erstellt
- [ ] Tabelle `app_settings` erstellt
- [ ] Tabelle `file_metadata` erstellt
- [ ] Tabelle `theme_settings` erstellt
- [ ] Tabelle `menu_item_definitions` erstellt
- [ ] Tabelle `dashboard_widget_definitions` erstellt
- [ ] Tabelle `dashboard_section_definitions` erstellt
- [ ] Tabelle `role_badge_settings` erstellt
- [ ] Tabelle `role_configurations` erstellt
- [ ] Tabelle `ai_assistant_defaults` erstellt
- [ ] Tabelle `monday_settings` erstellt
- [ ] Tabelle `monday_sync_logs` erstellt

### ✅ DB-Funktionen

- [ ] `has_role(_user_id, _role)` erstellt
- [ ] `is_admin(_user_id)` erstellt
- [ ] `handle_new_user()` erstellt
- [ ] `update_updated_at_column()` erstellt
- [ ] `get_email_for_login(username_input)` erstellt
- [ ] `can_access_file(storage_path)` erstellt

### ✅ RLS Policies

- [ ] RLS auf allen Tabellen aktiviert
- [ ] Policies für `profiles` (6 Stück)
- [ ] Policies für `user_roles` (4 Stück)
- [ ] Policies für `slots` (6 Stück)
- [ ] Policies für `app_settings` (9 Stück)
- [ ] Policies für `file_metadata` (11 Stück)
- [ ] Policies für alle anderen Tabellen

### ✅ Storage

- [ ] Bucket `login-media` (public) erstellt
- [ ] Bucket `documents` (private) erstellt
- [ ] Bucket `member-documents` (private) erstellt
- [ ] Storage RLS Policies für alle Buckets

### ✅ Auth

- [ ] Trigger `on_auth_user_created` aktiv
- [ ] Email-Provider aktiviert
- [ ] "Confirm email" deaktiviert (für Testing)
- [ ] Admin-User erstellt

### ✅ Edge Functions

- [ ] `harbor-chat` deployed
- [ ] `manage-user` deployed
- [ ] `manage-user-password` deployed
- [ ] `reset-password-admin` deployed
- [ ] `create-admin` deployed
- [ ] `monday-webhook` deployed
- [ ] `sync-monday` deployed
- [ ] `migrate-storage-files` deployed

### ✅ Secrets

- [ ] `GOOGLE_API_KEY` konfiguriert
- [ ] `ADMIN_PASSWORD_RESET_KEY` konfiguriert
- [ ] `MONDAY_API_KEY` konfiguriert (optional)

### ✅ Frontend

- [ ] `VITE_SUPABASE_URL` aktualisiert
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` aktualisiert

---

## 5. Troubleshooting

### Problem: "relation does not exist"

**Ursache**: SQL-Dump wurde nicht vollständig ausgeführt.

**Lösung**: 
1. SQL Editor öffnen
2. `SELECT * FROM profiles LIMIT 1;` testen
3. Falls Fehler: Dump erneut ausführen

### Problem: "new row violates row-level security policy"

**Ursache**: RLS Policies blockieren den Zugriff.

**Lösung**:
1. Prüfen ob User eingeloggt ist
2. Prüfen ob User die richtige Rolle hat
3. RLS Policies im Dashboard prüfen

### Problem: "GOOGLE_API_KEY not set"

**Ursache**: Secret wurde nicht konfiguriert.

**Lösung**:
1. Project Settings → Edge Functions → Secrets
2. `GOOGLE_API_KEY` hinzufügen
3. Edge Function neu deployen: `supabase functions deploy harbor-chat`

### Problem: "Function not found"

**Ursache**: Edge Functions wurden nicht deployed.

**Lösung**:
```bash
supabase functions deploy harbor-chat
supabase functions list  # Prüfen ob aktiv
```

### Problem: Profil wird nicht automatisch erstellt

**Ursache**: Auth-Trigger fehlt oder ist inaktiv.

**Lösung**:
1. SQL Editor öffnen
2. Trigger prüfen:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
3. Falls leer, TEIL 8 des Dumps erneut ausführen

### Problem: Storage-Upload schlägt fehl

**Ursache**: Bucket existiert nicht oder RLS blockiert.

**Lösung**:
1. Storage → Buckets prüfen
2. Falls Bucket fehlt: TEIL 6 des Dumps ausführen
3. Policies prüfen: TEIL 7 des Dumps ausführen

---

## 6. Übertragungs-Matrix

| Element | Übertragen via | Status nach Migration |
|---------|----------------|----------------------|
| **Automatisch via Remix** | | |
| Frontend-Code (React/TS) | Lovable Remix | ✅ Vollständig |
| Styling (Tailwind) | Lovable Remix | ✅ Vollständig |
| Komponenten | Lovable Remix | ✅ Vollständig |
| Edge Function Code | Lovable Remix | ✅ Vollständig |
| **Manuell via SQL-Dump** | | |
| DB-Schema (14 Tabellen) | SQL-Dump | ✅ Nach Ausführung |
| RLS Policies (50+) | SQL-Dump | ✅ Nach Ausführung |
| DB-Funktionen (6) | SQL-Dump | ✅ Nach Ausführung |
| Seed-Daten | SQL-Dump | ✅ Nach Ausführung |
| Storage Buckets (3) | SQL-Dump | ✅ Nach Ausführung |
| Storage RLS | SQL-Dump | ✅ Nach Ausführung |
| Auth-Trigger | SQL-Dump | ✅ Nach Ausführung |
| **Manuell via CLI/Dashboard** | | |
| Edge Functions (deployed) | Supabase CLI | ⚠️ Manuelles Deploy |
| Secrets | Supabase Dashboard | ⚠️ Manuelle Eingabe |
| **Nicht übertragbar** | | |
| User-Daten (auth.users) | - | ❌ Neu erstellen |
| Hochgeladene Dateien | - | ❌ Neu hochladen |
| Session-Daten | - | ❌ Neu einloggen |

---

## Zusammenfassung

Die Migration eines KSVL App Remixes umfasst 8 Schritte:

1. ✅ Neues Supabase-Projekt erstellen
2. ✅ SQL-Dump ausführen (Schema + RLS + Funktionen + Storage + Trigger)
3. ✅ Auth konfigurieren
4. ✅ Edge Functions deployen
5. ✅ Secrets konfigurieren
6. ✅ Admin-User erstellen
7. ✅ Frontend `.env` aktualisieren
8. ✅ Verifizieren

**Geschätzte Dauer**: 30-60 Minuten

---

**Letzte Aktualisierung**: 2026-01-26  
**Version**: 1.0.0
