# KSVL App - Remix Migration Guide

> Vollständige Anleitung zur Migration der KSVL App in eine neue Supabase-Instanz

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Voraussetzungen](#2-voraussetzungen)
3. [**Setup-Wizard (Automatisiert)**](#3-setup-wizard-automatisiert) ⭐ NEU
4. [Manuelle Schritt-für-Schritt-Anleitung](#4-manuelle-schritt-für-schritt-anleitung)
5. [Checkliste](#5-checkliste)
6. [Troubleshooting](#6-troubleshooting)
7. [Übertragungs-Matrix](#7-übertragungs-matrix)

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

- `docs/database/ksvl_database_dump_2026-03-10.sql` (vollständiger DB-Dump)
- `supabase/functions/*` (Edge Functions)

---

## 3. Setup-Wizard (Automatisiert) ⭐

> **Empfohlen!** Der Setup-Wizard automatisiert den Großteil der Migration.

### 3.1 Voraussetzungen

1. Neues Supabase-Projekt erstellen (siehe [Abschnitt 2.1](#21-neues-supabase-projekt))
2. Folgende Credentials bereithalten:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbG...` (öffentlich)
   - **Service Role Key**: `eyJhbG...` (geheim!)

### 3.2 Setup-Wizard starten

1. Im Remix-Projekt die URL `/setup` aufrufen
2. Die Setup-Seite wird angezeigt

### 3.3 Schritt 1: Supabase-Credentials eingeben

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| **Supabase URL** | Project URL aus dem Dashboard | `https://abcdefgh.supabase.co` |
| **Anon Key** | Öffentlicher API-Key | `eyJhbGciOiJIUzI1...` |
| **Service Role Key** | Geheimer Admin-Key | `eyJhbGciOiJIUzI1...` |

> ⚠️ **Sicherheitshinweis**: Der Service Role Key wird nur für das Setup verwendet und nicht gespeichert.

### 3.4 Schritt 2: Admin-Benutzer definieren

| Feld | Beschreibung | Anforderungen |
|------|--------------|---------------|
| **Email** | Admin-Email-Adresse | Gültige Email |
| **Passwort** | Sicheres Passwort | Min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl |
| **Name** | Anzeigename | z.B. "Administrator" |

### 3.5 Migration starten

1. **"Migration starten"** klicken
2. Der Wizard prüft, ob die Datenbank bereits initialisiert ist:

#### Fall A: Datenbank ist leer (Ersteinrichtung)

Der Wizard gibt den **kompletten SQL-Dump** zurück mit:
- 1 Enum (`app_role`)
- 7 Tabellen
- 6 DB-Funktionen
- 40+ RLS Policies
- Storage Buckets & Policies
- Auth-Trigger

**Vorgehen:**
1. SQL-Code kopieren (Button "SQL kopieren")
2. Im Supabase Dashboard: **SQL Editor** öffnen
3. SQL einfügen und **"Run"** klicken
4. Zurück zum Setup-Wizard und **erneut "Migration starten"** klicken

#### Fall B: Datenbank ist bereits initialisiert

Der Wizard führt automatisch aus:
- ✅ Seed-Daten einfügen (3 Tabellen)
- ✅ Storage Buckets erstellen (3 Buckets)
- ✅ Admin-User erstellen mit `admin`-Rolle

### 3.6 Nach erfolgreicher Migration

Der Wizard zeigt:

1. **Erfolgs-Meldung** mit Zusammenfassung
2. **`.env`-Werte zum Kopieren**:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
   VITE_SUPABASE_PROJECT_ID=xxxxx
   ```
3. **Hinweis auf manuelle Schritte** (Secrets, Edge Functions)

### 3.7 Manuelle Nacharbeiten

Nach dem Setup-Wizard müssen noch manuell erledigt werden:

| Schritt | Beschreibung | Anleitung |
|---------|--------------|-----------|
| **Secrets konfigurieren** | API-Keys im Supabase Dashboard | [Schritt 5 in Abschnitt 4](#schritt-5-secrets-konfigurieren) |
| **Edge Functions deployen** | Via Supabase CLI | [Schritt 4 in Abschnitt 4](#schritt-4-edge-functions-deployen) |
| **Auth konfigurieren** | Email-Bestätigung deaktivieren | [Schritt 3 in Abschnitt 4](#schritt-3-auth-einstellungen-konfigurieren) |

### 3.8 Was der Setup-Wizard automatisiert

| Element | Manuell | Setup-Wizard |
|---------|---------|--------------|
| Supabase-Projekt erstellen | ✅ | ❌ |
| SQL-Dump ausführen | ✅ | ⚠️ Gibt SQL zurück |
| Seed-Daten einfügen | ✅ | ✅ Automatisch |
| Storage Buckets erstellen | ✅ | ✅ Automatisch |
| Admin-User erstellen | ✅ | ✅ Automatisch |
| Secrets konfigurieren | ✅ | ❌ |
| Edge Functions deployen | ✅ | ❌ |
| `.env` aktualisieren | ✅ | ⚠️ Zeigt Werte |

**Zeitersparnis**: ~20-30 Minuten

---

## 4. Manuelle Schritt-für-Schritt-Anleitung

> Diese Anleitung ist für Fälle, in denen der Setup-Wizard nicht verwendet werden kann.

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
2. Den kompletten Inhalt von `docs/database/ksvl_database_dump_2026-03-10.sql` einfügen
3. **"Run"** klicken
4. Auf erfolgreiche Ausführung prüfen (grüner Haken)

> ⚠️ **Wichtig**: Der Dump enthält alle 8 Teile:
> - TEIL 1: Enums
> - TEIL 2: Tabellen (7 Stück)
> - TEIL 3: DB-Funktionen (6 Stück)
> - TEIL 4: RLS Policies (40+ Stück)
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
supabase functions deploy setup-wizard
supabase functions deploy migrate-storage-files
```

### Schritt 5: Secrets konfigurieren

Im Supabase Dashboard: **Project Settings** → **Edge Functions** → **Secrets**

| Secret | Wert | Pflicht |
|--------|------|---------|
| `GOOGLE_API_KEY` | API-Key von [ai.google.dev](https://ai.google.dev) | ✅ Ja |
| `ADMIN_PASSWORD_RESET_KEY` | Selbst generierter sicherer String | ✅ Ja |

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

## 5. Checkliste

### ✅ Datenbank

- [ ] Enum `app_role` erstellt
- [ ] Tabelle `profiles` erstellt
- [ ] Tabelle `user_roles` erstellt
- [ ] Tabelle `slots` erstellt
- [ ] Tabelle `app_settings` erstellt
- [ ] Tabelle `file_metadata` erstellt
- [ ] Tabelle `theme_settings` erstellt
- [ ] Tabelle `role_badge_settings` erstellt

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

## 6. Troubleshooting

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

### Problem: Setup-Wizard zeigt "SQL manuell ausführen"

**Ursache**: DDL-Befehle (CREATE TABLE, etc.) können nicht via REST API ausgeführt werden.

**Lösung**:
1. SQL-Code kopieren (Button im Wizard)
2. Supabase Dashboard → SQL Editor
3. SQL einfügen und ausführen
4. Wizard erneut starten

### Problem: Setup-Wizard Fehler "Tabelle existiert bereits"

**Ursache**: Datenbank wurde bereits teilweise initialisiert.

**Lösung**:
1. Entweder: Neues Supabase-Projekt erstellen
2. Oder: Alle Tabellen manuell löschen und neu starten

---

## 7. Übertragungs-Matrix

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

### Option A: Mit Setup-Wizard (Empfohlen)

1. ✅ Neues Supabase-Projekt erstellen
2. ✅ `/setup` aufrufen und Credentials eingeben
3. ✅ SQL-Dump ausführen (vom Wizard bereitgestellt)
4. ✅ Wizard erneut starten → Seed-Daten + Buckets + Admin automatisch
5. ⚠️ Auth konfigurieren (manuell)
6. ⚠️ Edge Functions deployen (CLI)
7. ⚠️ Secrets konfigurieren (Dashboard)
8. ✅ Frontend `.env` aktualisieren (Werte vom Wizard)

**Geschätzte Dauer**: 15-30 Minuten

### Option B: Komplett manuell

1. ✅ Neues Supabase-Projekt erstellen
2. ✅ SQL-Dump ausführen
3. ✅ Auth konfigurieren
4. ✅ Edge Functions deployen
5. ✅ Secrets konfigurieren
6. ✅ Admin-User erstellen
7. ✅ Frontend `.env` aktualisieren
8. ✅ Verifizieren

**Geschätzte Dauer**: 30-60 Minuten

---

**Letzte Aktualisierung**: 2026-01-26  
**Version**: 2.0.0 (Setup-Wizard hinzugefügt)
