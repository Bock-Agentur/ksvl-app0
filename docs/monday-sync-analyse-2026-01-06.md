# KSVL App – Monday.com Synchronisations-Analyse

**Datum:** 06.01.2026  
**Status:** Analyse (keine Implementierung)  
**Autor:** Lovable AI

---

## Inhaltsverzeichnis

1. [High-Level Architektur Snapshot](#1-high-level-architektur-snapshot)
2. [Aktueller Status der Mitglieder-/Profil-Daten](#2-aktueller-status-der-mitglieder-profil-daten)
3. [Aktueller Status Monday-Integration](#3-aktueller-status-monday-integration)
4. [Detaillierte Datenstrukturen für Sync](#4-detaillierte-datenstrukturen-für-sync)
5. [Datenflüsse beim Profil-Speichern](#5-datenflüsse-beim-profil-speichern)
6. [Risiken & Technische Schulden](#6-risiken-technische-schulden)
7. [Konkrete Vorbereitungsschritte](#7-konkrete-vorbereitungsschritte)

---

## 1. High-Level Architektur Snapshot

### 1.1 Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix Primitives) |
| State Management | TanStack React Query + React Context |
| Backend | Supabase (Lovable Cloud) |
| Auth | Supabase Auth (email/password) |
| Database | PostgreSQL via Supabase |
| Edge Functions | Deno (Supabase Functions) |
| Realtime | Supabase Realtime (Slots) |

### 1.2 Projekt-Struktur

```
src/
├── pages/              # Route-Seiten (Profile, Users, Calendar, etc.)
├── components/         # UI-Komponenten
│   ├── profile/        # Profil-Ansicht (Cards, Forms)
│   ├── user-management/ # Admin Mitgliederverwaltung
│   ├── common/         # Wiederverwendbare Komponenten
│   └── ui/             # shadcn/ui Basis-Komponenten
├── hooks/
│   ├── core/
│   │   ├── auth/       # useRole, usePermissions
│   │   ├── data/       # useUsersData, useProfileData, useSlots
│   │   ├── settings/   # useAppSettings, useSettingsBatch
│   │   └── forms/      # useCrudOperations, useFormHandler
│   └── index.ts        # Re-exports
├── lib/
│   ├── services/       # userService, slotService, fileService
│   └── registry/       # routes, navigation, modules
├── contexts/           # AuthContext, SlotsContext
└── types/              # TypeScript Typen (user.ts, slot.ts, etc.)

supabase/
├── functions/          # Edge Functions
│   ├── manage-user/    # CRUD für User (via Admin)
│   ├── manage-user-password/
│   ├── sync-monday/    # ⚠️ Skeleton vorhanden
│   └── monday-webhook/ # ⚠️ Skeleton vorhanden
└── migrations/         # DB Schema (read-only)
```

### 1.3 Architektur-Prinzipien (aktuell)

- **Service-Layer**: `userService` für alle User-CRUD-Operationen
- **React Query**: Zentrales Caching für User-Daten (`useUsersData`)
- **Edge Functions**: Admin-Operationen (Create/Update/Delete User) laufen über Edge Functions
- **Direkte DB-Zugriffe**: Eigenes Profil kann direkt via Supabase Client aktualisiert werden

---

## 2. Aktueller Status der Mitglieder-/Profil-Daten

### 2.1 Tabelle `profiles` – Vollständige Spaltenübersicht

Die `profiles`-Tabelle enthält **68 Spalten**. Hier die kategorisierte Übersicht:

#### Identifikation & Auth
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `id` | uuid | No | Primary Key (= auth.users.id) |
| `email` | text | No | E-Mail-Adresse |
| `username` | text | Yes | Benutzername für Login |
| `password_change_required` | boolean | Yes | Passwort muss geändert werden |
| `two_factor_method` | text | Yes | 2FA Methode |

#### Stammdaten (Persönliche Daten)
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `name` | text | Yes | Vollständiger Name (Legacy) |
| `first_name` | text | Yes | Vorname |
| `last_name` | text | Yes | Nachname |
| `birth_date` | date | Yes | Geburtsdatum |
| `phone` | text | Yes | Telefonnummer |
| `street_address` | text | Yes | Straße & Hausnummer |
| `postal_code` | text | Yes | PLZ |
| `city` | text | Yes | Stadt/Ort |
| `address` | text | Yes | Adresse (Legacy-Feld) |

#### Mitgliedschaft
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `member_number` | text | Yes | Mitgliedsnummer |
| `membership_type` | text | Yes | Mitgliedsart (Ordentlich, etc.) |
| `membership_status` | text | Yes | Status (Aktiv, Ruhend, etc.) |
| `entry_date` | date | Yes | Eintrittsdatum |
| `status` | text | Yes | Aktiv/Inaktiv (System) |
| `oesv_number` | text | Yes | ÖSV Nummer |
| `membership_status_history` | jsonb | Yes | Statusverlauf |

#### Vorstand
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `vorstand_funktion` | text | Yes | Vorstandsfunktion |
| `board_position_start_date` | date | Yes | Beginn Vorstandsamt |
| `board_position_end_date` | date | Yes | Ende Vorstandsamt |
| `board_position_history` | jsonb | Yes | Vorstandshistorie |

#### Boot & Liegeplatz
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `boat_name` | text | Yes | Bootsname |
| `boat_type` | text | Yes | Bootstyp |
| `boat_length` | numeric | Yes | Bootslänge (m) |
| `boat_width` | numeric | Yes | Bootsbreite (m) |
| `boat_color` | text | Yes | Bootsfarbe |
| `berth_number` | text | Yes | Liegeplatz-Nr. |
| `berth_type` | text | Yes | Liegeplatztyp |
| `berth_length` | numeric | Yes | Liegeplatz-Länge |
| `berth_width` | numeric | Yes | Liegeplatz-Breite |
| `buoy_radius` | numeric | Yes | Bojen-Radius |
| `has_dinghy_berth` | boolean | Yes | Hat Beibootplatz |
| `dinghy_berth_number` | text | Yes | Beibootplatz-Nr. |

#### Parkplatz & Getränkechip
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `parking_permit_number` | text | Yes | Parkausweis-Nr. |
| `parking_permit_issue_date` | date | Yes | Ausstellungsdatum |
| `beverage_chip_number` | text | Yes | Getränkechip-Nr. |
| `beverage_chip_issue_date` | date | Yes | Ausstellungsdatum |
| `beverage_chip_status` | text | Yes | Status (Aktiv/Gesperrt) |

#### Notfallkontakt
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `emergency_contact` | text | Yes | Legacy-Feld |
| `emergency_contact_name` | text | Yes | Name |
| `emergency_contact_phone` | text | Yes | Telefon |
| `emergency_contact_relationship` | text | Yes | Beziehung |

#### Dokumente (URLs)
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `document_bfa` | text | Yes | BFA Dokument |
| `document_insurance` | text | Yes | Versicherung |
| `document_berth_contract` | text | Yes | Liegeplatzvertrag |
| `document_member_photo` | text | Yes | Mitgliedsfoto |
| `avatar_url` | text | Yes | Profilbild |

#### Datenschutz & Einstellungen
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `data_public_in_ksvl` | boolean | Yes | Daten vereinsintern sichtbar |
| `contact_public_in_ksvl` | boolean | Yes | Kontakt vereinsintern sichtbar |
| `statute_accepted` | boolean | Yes | Satzung akzeptiert |
| `privacy_accepted` | boolean | Yes | Datenschutz akzeptiert |
| `newsletter_optin` | boolean | Yes | Newsletter Opt-in |
| `ai_info_enabled` | boolean | Yes | AI-Info aktiviert |

#### Technische Felder
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `created_at` | timestamp | Yes | Erstellt am |
| `updated_at` | timestamp | Yes | Geändert am |
| `created_by` | uuid | Yes | Erstellt von |
| `modified_by` | uuid | Yes | Geändert von |
| `is_test_data` | boolean | Yes | Testdaten-Flag |
| `is_role_user` | boolean | Yes | System-User |
| `notes` | text | Yes | Notizen (Admin) |

#### ⭐ Monday.com Integration (bereits vorhanden!)
| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `monday_item_id` | text | Yes | Monday.com Item-ID |

### 2.2 Tabelle `user_roles`

```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,  -- ENUM: admin, kranfuehrer, mitglied, gastmitglied, vorstand
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);
```

**Rollenmodell:**
- Ein User kann **mehrere Rollen** haben
- Rollen werden via `generateRolesFromPrimary()` abgeleitet (hierarchisch)
- RLS: Nur Admins können Rollen ändern

### 2.3 Unterstützende Tabellen

| Tabelle | Zweck |
|---------|-------|
| `custom_fields` | Dynamische Zusatzfelder (inkl. `monday_column_id`) |
| `custom_field_values` | Werte der Zusatzfelder pro User |
| `monday_settings` | Monday.com Konfiguration |
| `monday_sync_logs` | Sync-Protokoll |

### 2.4 UI-Bearbeitung der Felder

#### Profilseite (`/profile`)
- **Komponente:** `ProfileView` → `ProfileFormCards`
- **Sub-Komponenten:**
  - `ProfileMasterDataCard` – Stammdaten (Name, Adresse, etc.)
  - `ProfilePersonalCards` – Persönliche Daten
  - `ProfileBoatCards` – Boot & Liegeplatz
  - `ProfileMembershipCard` – Mitgliedschaft
  - `ProfilePrivacyCard` – Datenschutz
  - `ProfileLoginCard` – Zugangsdaten
  - `ProfileDocumentsSection` – Dokumente

#### Admin Mitgliederverwaltung (`/users`)
- **Komponente:** `UserManagementRefactored`
- **Detail-Ansicht:** Öffnet `ProfileView` mit `isAdmin=true`
- Zusätzliche Funktionen: Passwort zurücksetzen, Rollen ändern, User löschen

---

## 3. Aktueller Status Monday-Integration

### 3.1 Vorhandene Monday.com Infrastruktur

✅ **Es existiert bereits eine grundlegende Monday-Infrastruktur!**

#### Datenbank-Tabellen

**`monday_settings`** (Konfiguration):
```sql
- id: uuid
- board_id: text          -- Monday Board ID
- api_key_set: boolean    -- Flag ob API Key gesetzt
- auto_sync_enabled: boolean
- column_mapping: jsonb   -- Feld-Mapping
- webhook_url: text
- last_sync_at: timestamp
```

**`monday_sync_logs`** (Protokoll):
```sql
- id: uuid
- user_id: uuid
- sync_type: text         -- 'manual', 'webhook', 'auto'
- direction: text         -- 'app_to_monday', 'monday_to_app'
- board_id: text
- item_id: text
- action: text
- success: boolean
- error_details: jsonb
- started_at / completed_at: timestamp
```

**`profiles.monday_item_id`**: ✅ Bereits vorhanden!

**`custom_fields.monday_column_id`**: ✅ Für Custom Field Mapping vorhanden!

#### Edge Functions

**`sync-monday/index.ts`** (Skeleton):
```typescript
// Status: SKELETON - nicht produktiv
// Prüft nur monday_settings.auto_sync_enabled
// Loggt Sync-Versuch in monday_sync_logs
// TODO-Kommentar: "Implement Monday.com API calls here"
```

**`monday-webhook/index.ts`** (Teilweise implementiert):
```typescript
// Status: TEILWEISE IMPLEMENTIERT
// ✅ HMAC-SHA256 Signatur-Validierung
// ✅ Challenge-Response für Webhook-Setup
// ✅ Logging in monday_sync_logs
// ❌ Keine tatsächliche Datenverarbeitung
```

#### Secrets

| Secret | Vorhanden | Beschreibung |
|--------|-----------|--------------|
| `MONDAY_API_KEY` | ✅ Ja | API Token für Monday.com |
| `MONDAY_SIGNING_SECRET` | ❌ Nein | Für Webhook-Validierung (optional) |

### 3.2 Aktueller Nutzungsstatus

> **⚠️ Die Monday-Integration ist VORBEREITET, aber NICHT produktiv aktiv.**

- Die Infrastruktur (Tabellen, Secrets, Edge Functions) existiert
- Die Edge Functions sind Skeletons ohne echte API-Aufrufe
- `auto_sync_enabled` ist standardmäßig `false`
- Es gibt **keine UI** zum Triggern eines manuellen Syncs
- Es werden **keine Daten** zwischen Monday und Supabase synchronisiert

### 3.3 Memory-Einträge (Kontext aus vorherigen Arbeiten)

Laut den Memory-Einträgen wurde folgendes geplant:

1. **Board:** `APP_SYNC_Mitgliedsdaten`
2. **Gruppe:** `Stammdaten`
3. **Geplante Felder:** Nachname, Vorname, PLZ, ORT, Telefon, eMail
4. **Sync-Richtung:** Monday.com → Supabase (One-way, Monday als Master)
5. **Matching:** Per E-Mail-Adresse
6. **Manueller Sync:** Soll unabhängig von `auto_sync_enabled` funktionieren

---

## 4. Detaillierte Datenstrukturen für Sync

### 4.1 Empfohlene Sync-Felder

#### Kernfelder (hohe Priorität)

| Supabase Spalte | Monday Column (Vorschlag) | Richtung | Anmerkung |
|-----------------|---------------------------|----------|-----------|
| `first_name` | Vorname | ↔ Bidirektional | Stammdaten |
| `last_name` | Nachname | ↔ Bidirektional | Stammdaten |
| `email` | eMail | Monday → Supabase | Matching-Key |
| `phone` | Telefon | ↔ Bidirektional | - |
| `postal_code` | PLZ | ↔ Bidirektional | - |
| `city` | ORT | ↔ Bidirektional | - |
| `street_address` | Adresse | ↔ Bidirektional | - |
| `member_number` | Mitgliedsnummer | Supabase → Monday | Von App generiert |

#### Erweiterte Felder (mittlere Priorität)

| Supabase Spalte | Monday Column (Vorschlag) | Richtung |
|-----------------|---------------------------|----------|
| `membership_type` | Mitgliedsart | ↔ Bidirektional |
| `membership_status` | Status | ↔ Bidirektional |
| `entry_date` | Eintrittsdatum | Monday → Supabase |
| `boat_name` | Bootsname | ↔ Bidirektional |
| `berth_number` | Liegeplatz | ↔ Bidirektional |
| `oesv_number` | ÖSV-Nummer | ↔ Bidirektional |

#### Felder die NICHT synchronisiert werden sollten

| Supabase Spalte | Grund |
|-----------------|-------|
| `id` | Interner Supabase UUID |
| `password_change_required` | Auth-bezogen |
| `two_factor_method` | Auth-bezogen |
| Alle `document_*` | URLs zu Supabase Storage |
| `avatar_url` | Supabase Storage |
| `created_at`, `updated_at` | Technische Metadaten |
| `is_test_data`, `is_role_user` | System-Flags |
| Alle `*_history` jsonb Felder | Komplexe Struktur |

### 4.2 Bereits vorhandene Sync-Felder

✅ **`monday_item_id`** in `profiles` – Für Verlinkung Supabase ↔ Monday

### 4.3 Fehlende Sync-Felder (Empfehlung)

| Spalte | Typ | Zweck |
|--------|-----|-------|
| `last_synced_from_monday_at` | timestamp | Wann zuletzt von Monday geholt |
| `last_synced_to_monday_at` | timestamp | Wann zuletzt zu Monday gepusht |
| `sync_conflict_at` | timestamp | Wann Konflikt aufgetreten |
| `sync_status` | text | 'synced', 'pending', 'conflict', 'error' |

---

## 5. Datenflüsse beim Profil-Speichern

### 5.1 Mitglied ändert eigenes Profil

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROFIL SELBST BEARBEITEN                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ProfileView                                                     │
│      │                                                           │
│      ▼                                                           │
│  handleSaveProfile()                                             │
│      │                                                           │
│      ▼                                                           │
│  userService.updateProfile(data)   ← Direkter DB-Zugriff        │
│      │                                                           │
│      ▼                                                           │
│  supabase.from('profiles').update()                             │
│      │                                                           │
│      ▼                                                           │
│  RLS Policy: "Users can update their own profile"               │
│      │                                                           │
│      ▼                                                           │
│  ✅ Profil gespeichert                                          │
│                                                                  │
│  ⚠️ KEIN Monday-Sync wird ausgelöst!                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Beteiligte Dateien:**
- `src/components/profile-view.tsx` (Zeile 76-171)
- `src/lib/services/user-service.ts` → `updateProfile()` (Zeile 377-442)
- Direkte Supabase-Query (kein Edge Function)

### 5.2 Admin/Vorstand ändert Mitglied

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN BEARBEITET MITGLIED                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UserManagement → ProfileView (isAdmin=true)                     │
│      │                                                           │
│      ▼                                                           │
│  handleSaveProfile()                                             │
│      │                                                           │
│      ▼                                                           │
│  userService.updateUser(data)   ← Edge Function Call            │
│      │                                                           │
│      ▼                                                           │
│  POST /functions/v1/manage-user                                  │
│      │                                                           │
│      ▼                                                           │
│  Edge Function: manage-user/index.ts                             │
│      │                                                           │
│      ├── Update profiles Tabelle                                 │
│      └── Update user_roles Tabelle (falls Rollen geändert)       │
│      │                                                           │
│      ▼                                                           │
│  ✅ User gespeichert                                             │
│                                                                  │
│  ⚠️ KEIN Monday-Sync wird ausgelöst!                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Beteiligte Dateien:**
- `src/components/profile-view.tsx`
- `src/lib/services/user-service.ts` → `updateUser()` (Zeile 227-302)
- `supabase/functions/manage-user/index.ts`

---

## 6. Risiken & Technische Schulden

### 6.1 Feld-Inkonsistenzen

| Problem | Details | Risiko |
|---------|---------|--------|
| `name` vs. `first_name`/`last_name` | Legacy `name` Feld existiert parallel | Mittel |
| `address` vs. `street_address` | Zwei Adressfelder | Niedrig |
| `emergency_contact` (Legacy) | Neben den neuen Feldern | Niedrig |
| Type-Casts in `profile-view.tsx` | Viele `(editedUser as any)` | Mittel |

### 6.2 Fehlende Timestamps für Sync

| Problem | Auswirkung |
|---------|------------|
| Kein `profile_last_modified_at` mit Trigger | Konflikt-Erkennung schwierig |
| Keine Sync-Timestamps | Unklare Sync-Historie |

### 6.3 Architektur-Risiken

| Problem | Details |
|---------|---------|
| Dual-Path für Updates | `updateProfile()` (direkt) vs. `updateUser()` (Edge Function) |
| Keine zentrale Sync-Hook-Stelle | Beide Pfade müssten Sync triggern |
| RLS für monday_settings | Nur Admin kann lesen/schreiben |

### 6.4 Monday-spezifische Risiken

| Problem | Details |
|---------|---------|
| Kein Konflikt-Handling | Was passiert bei gleichzeitiger Änderung? |
| Keine Retry-Logik | Edge Functions haben keine Wiederholungsversuche |
| Kein Batch-Sync | Nur Einzelperson-Sync geplant |

---

## 7. Konkrete Vorbereitungsschritte

### 7.1 Datenmodell erweitern (Migration)

```sql
-- Sync-Timestamps hinzufügen
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_synced_from_monday_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_synced_to_monday_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_profiles_monday_item_id 
ON profiles(monday_item_id) WHERE monday_item_id IS NOT NULL;

-- Trigger für updated_at (falls nicht vorhanden)
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();
```

### 7.2 Feld-Mapping Tabelle (Vorschlag)

```typescript
// Könnte in monday_settings.column_mapping gespeichert werden
const FIELD_MAPPING = {
  // supabase_field → monday_column_id
  first_name: 'text_123',
  last_name: 'text_456',
  email: 'email_789',
  phone: 'phone_abc',
  postal_code: 'text_def',
  city: 'text_ghi',
  street_address: 'text_jkl',
  member_number: 'text_mno',
  membership_status: 'status_pqr',
  boat_name: 'text_stu',
  berth_number: 'text_vwx'
};
```

### 7.3 UI-Erweiterungen (Vorschlag)

| Ort | Funktion | Priorität |
|-----|----------|-----------|
| Mitgliederliste (Admin) | "Alle von Monday synchronisieren" Button | Hoch |
| Profil-Detailansicht (Admin) | "Von Monday aktualisieren" / "Zu Monday senden" | Hoch |
| Settings-Manager | Monday-Konfiguration (Board-ID, Mapping) | Mittel |
| Profil-Header | Sync-Status Badge | Niedrig |

### 7.4 Edge Functions (Vorschlag)

#### `sync-profile-from-monday`
```
Eingabe: { userId: string } oder { all: true }
Ablauf:
1. monday_settings.board_id lesen
2. Monday GraphQL API aufrufen (Gruppe "Stammdaten")
3. Items mit E-Mail matchen
4. Profil-Felder aktualisieren
5. last_synced_from_monday_at setzen
6. Sync-Log schreiben
```

#### `sync-profile-to-monday`
```
Eingabe: { userId: string }
Ablauf:
1. Profil laden
2. monday_item_id prüfen
   - Vorhanden: Item updaten
   - Nicht vorhanden: Neues Item erstellen
3. monday_item_id speichern (falls neu)
4. last_synced_to_monday_at setzen
5. Sync-Log schreiben
```

### 7.5 Integration in bestehende Flows

**Option A: Nach jedem Speichern automatisch synchen**
```typescript
// In userService.updateProfile() / updateUser()
await syncProfileToMonday(userId);
```
⚠️ Risiko: Langsame Speichervorgänge, Fehlerbehandlung komplex

**Option B: Manuelle Buttons + Background-Job**
- Sync nur bei explizitem Klick
- Optional: Cron-Job für nächtlichen Batch-Sync
✅ Empfohlen für Bidirektionalen Sync

### 7.6 Nächste Schritte (Reihenfolge)

1. **Phase 1: Datenmodell** (Migration)
   - Sync-Timestamps hinzufügen
   - Index auf monday_item_id

2. **Phase 2: Edge Functions** (Core Logic)
   - `sync-profile-from-monday` implementieren
   - `sync-profile-to-monday` implementieren
   - Bestehende Skeletons ersetzen

3. **Phase 3: UI** (Admin)
   - Sync-Buttons in Mitgliederverwaltung
   - Status-Anzeige in Profil-Header

4. **Phase 4: Konflikt-Handling**
   - Zeitstempel-basierte Konflikt-Erkennung
   - UI für manuelle Konflikt-Lösung

5. **Phase 5: Automatisierung** (Optional)
   - Webhook-Integration aktivieren
   - Automatischer Sync bei Monday-Änderungen

---

## Anhang: Relevante Dateipfade

| Bereich | Pfad |
|---------|------|
| User Types | `src/types/user.ts` |
| User Service | `src/lib/services/user-service.ts` |
| User Data Hook | `src/hooks/core/data/use-users-data.tsx` |
| Profile View | `src/components/profile-view.tsx` |
| Profile Components | `src/components/profile/` |
| User Management | `src/components/user-management.tsx` |
| Edge: Manage User | `supabase/functions/manage-user/` |
| Edge: Sync Monday | `supabase/functions/sync-monday/` |
| Edge: Monday Webhook | `supabase/functions/monday-webhook/` |
| Supabase Types | `src/integrations/supabase/types.ts` |

---

**Ende der Analyse**

*Dieser Bericht dient als Grundlage für die Implementierung der bidirektionalen Monday.com-Synchronisation. Keine Code-Änderungen wurden vorgenommen.*
