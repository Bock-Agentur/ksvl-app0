# KSVL Slot Manager - Gesamtübersicht

> Vollständige technische Dokumentation für den LLM-Nachbau der KSVL App

## 1. Projekt-Informationen

| Feld | Wert |
|------|------|
| **Projektname** | KSVL Slot Manager |
| **Organisation** | Klagenfurter Segelverein Loretto (KSVL) |
| **Standort** | Wörthersee, Loretto, Kärnten, Österreich |
| **Sprache** | Deutsch (Österreichisch) |
| **Plattform** | Lovable Cloud (Supabase Backend) |

## 2. Zweck der App

Die KSVL Slot Manager App ist ein umfassendes **Vereinsmanagement-System** für den Klagenfurter Segelverein Loretto mit folgenden Hauptfunktionen:

### 2.1 Kernfunktionen

1. **Krantermin-Buchungssystem**
   - Mitglieder können Krantermine buchen (Boot ein-/auswassern)
   - Kranführer erstellen und verwalten Zeitslots
   - 15-Minuten-Intervall-System für präzise Buchungen
   - Kalender mit Tag-, Wochen- und Monatsansicht

2. **Mitgliederverwaltung**
   - Vollständige Profildaten (persönlich, Boot, Liegeplatz)
   - Multi-Rollen-System (Admin, Vorstand, Kranführer, Mitglied, Gastmitglied)
   - Dokumentenverwaltung (BFA, Versicherung, Liegeplatzvertrag)

3. **Dateimanager**
   - Rollenbasiertes Dateisystem
   - Login-Hintergrund-Medien
   - Mitglieder-Dokumente
   - Zentrale Dokumentenverwaltung

4. **Dashboard**
   - Personalisierte Widgets pro Rolle
   - Wetter-Widget
   - AI-Chat-Assistent (Capitano)
   - Statistiken und Quick-Actions

5. **Einstellungs-System**
   - Login-Hintergrund konfigurierbar
   - Theme-Einstellungen
   - Menü-Konfiguration
   - AI-Assistenten-Einstellungen

## 3. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages           │  Components       │  Hooks                    │
│  ───────────────│───────────────────│─────────────────────────  │
│  - Index         │  - Dashboard      │  - useRole                │
│  - Calendar      │  - ProfileView    │  - useSlots               │
│  - Profile       │  - CalendarView   │  - useUsers               │
│  - Users         │  - FileManager    │  - useFileManager         │
│  - FileManager   │  - Settings/*     │  - useSettingsBatch       │
│  - Settings      │  - Navigation     │  - useConsecutiveSlots    │
│  - Auth          │  - SlotCard       │  - useProfileData         │
│  - Reports       │  - UserCard       │  - useDashboardSettings   │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOVABLE CLOUD (Supabase)                      │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)  │  Edge Functions     │  Storage         │
│  ──────────────────────│────────────────────│─────────────────  │
│  - profiles             │  - harbor-chat      │  - login-media   │
│  - user_roles           │  - manage-user      │  - documents     │
│  - slots                │  - manage-user-pw   │  - member-docs   │
│  - app_settings         │  - reset-password   │                  │
│  - file_metadata        │  - create-admin     │                  │
│  - theme_settings       │  - monday-webhook   │                  │
│  - dashboard_*          │  - sync-monday      │                  │
│  - menu_item_*          │  - migrate-files    │                  │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Ordnerstruktur

```
ksvl-app/
├── docs/                          # Dokumentation
│   ├── rebuild/                   # LLM-Nachbau Dokumentation
│   ├── architecture/              # Architektur-Docs
│   └── health/                    # Healthcheck-Reports
│
├── src/                           # Frontend Source Code
│   ├── main.tsx                   # App Entry Point
│   ├── App.tsx                    # Router, Provider Setup
│   ├── index.css                  # CSS Variables, Theme
│   │
│   ├── pages/                     # Route-Seiten
│   │   ├── Index.tsx              # Dashboard (/)
│   │   ├── Calendar.tsx           # Krankalender (/kalender)
│   │   ├── Profile.tsx            # Profil (/profil)
│   │   ├── Users.tsx              # Mitglieder (/mitglieder)
│   │   ├── FileManager.tsx        # Dateimanager (/dateimanager)
│   │   ├── Settings.tsx           # Einstellungen (/einstellungen)
│   │   ├── Reports.tsx            # Berichte (/berichte)
│   │   ├── Auth.tsx               # Login (/auth)
│   │   └── NotFound.tsx           # 404-Seite
│   │
│   ├── components/                # UI-Komponenten
│   │   ├── ui/                    # shadcn/ui Basis-Komponenten
│   │   ├── common/                # Wiederverwendbare Komponenten
│   │   ├── calendar/              # Kalender-Komponenten
│   │   ├── profile/               # Profil-Komponenten
│   │   ├── file-manager/          # Dateimanager-Komponenten
│   │   ├── slots/                 # Slot-Komponenten
│   │   ├── dashboard-widgets/     # Dashboard-Widgets
│   │   ├── dashboard-sections/    # Dashboard-Sections
│   │   ├── user-management/       # User-Management-Komponenten
│   │   └── settings/              # Einstellungs-Komponenten
│   │
│   ├── hooks/                     # React Hooks
│   │   ├── index.ts               # Barrel Export
│   │   └── core/                  # Core Hooks
│   │       ├── auth/              # Auth-Hooks (useRole, usePermissions)
│   │       ├── data/              # Daten-Hooks (useSlots, useUsers, etc.)
│   │       ├── settings/          # Settings-Hooks
│   │       ├── forms/             # Form-Hooks
│   │       └── ui/                # UI-Hooks (useIsMobile, useSearchFilter)
│   │
│   ├── contexts/                  # React Contexts
│   │   ├── auth-context.tsx       # Auth State
│   │   └── slots-context.tsx      # Slots State + Realtime
│   │
│   ├── lib/                       # Utilities
│   │   ├── utils.ts               # cn() Helper
│   │   ├── logger.ts              # Logging
│   │   ├── query-keys.ts          # React Query Keys
│   │   ├── realtime-manager.ts    # Realtime Subscriptions
│   │   ├── registry/              # Route/Navigation Registry
│   │   │   ├── routes.ts          # Route-Definitionen
│   │   │   ├── navigation.ts      # Navigation-Items
│   │   │   └── modules.ts         # Modul-Registry
│   │   ├── services/              # API Services
│   │   │   ├── user-service.ts    # User CRUD
│   │   │   ├── slot-service.ts    # Slot CRUD
│   │   │   ├── file-service.ts    # File Operations
│   │   │   └── weather-service.ts # Weather API
│   │   └── slots/                 # Slot Utilities
│   │       └── slot-view-model.ts # SlotViewModel Mapper
│   │
│   ├── types/                     # TypeScript Types
│   │   ├── index.ts               # Barrel Export
│   │   ├── user.ts                # User Types
│   │   ├── slot.ts                # Slot Types
│   │   ├── common.ts              # Common Types
│   │   └── ai-assistant.ts        # AI Types
│   │
│   └── integrations/              # External Integrations
│       └── supabase/
│           ├── client.ts          # Supabase Client (auto-gen)
│           └── types.ts           # DB Types (auto-gen)
│
├── supabase/                      # Backend
│   ├── config.toml                # Edge Functions Config
│   ├── functions/                 # Edge Functions
│   │   ├── harbor-chat/           # AI-Chat
│   │   ├── manage-user/           # User CRUD
│   │   ├── manage-user-password/  # Password Management
│   │   ├── reset-password-admin/  # Admin Password Reset
│   │   ├── create-admin/          # Create Admin User
│   │   ├── monday-webhook/        # Monday.com Webhook
│   │   ├── sync-monday/           # Monday.com Sync
│   │   └── migrate-storage-files/ # Storage Migration
│   └── migrations/                # SQL Migrations (50 Dateien)
│
├── tailwind.config.ts             # Tailwind Configuration
├── vite.config.ts                 # Vite Configuration
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript Config
```

## 5. Datenfluss

```
┌─────────────────┐
│   User Action   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   React Query   │◄────│   Supabase      │
│   (Cache)       │     │   Realtime      │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Service       │ (slot-service, user-service, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
│   Client        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Lovable Cloud (Supabase)          │
│   ┌─────────┐  ┌─────────────────┐  │
│   │   DB    │  │  Edge Functions │  │
│   └─────────┘  └─────────────────┘  │
└─────────────────────────────────────┘
```

## 6. Benutzer-Rollen

| Rolle | Beschreibung | Berechtigungen |
|-------|-------------|----------------|
| `admin` | Technischer Administrator | Vollzugriff auf alle Funktionen |
| `vorstand` | Vereinsvorstand | Mitgliederverwaltung, Slots, Einstellungen |
| `kranfuehrer` | Kranführer | Slot-Erstellung und -Verwaltung |
| `mitglied` | Normales Mitglied | Profil, Slot-Buchung, Dashboard |
| `gastmitglied` | Gastmitglied | Eingeschränkter Zugriff |

## 7. Technologie-Stack Kurzübersicht

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + React Context
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Lovable AI Gateway (Gemini 2.5 Flash)

## 8. Dokumentations-Index

| Datei | Inhalt |
|-------|--------|
| `00_app_overview.md` | Diese Übersicht |
| `01_tech_stack.md` | Detaillierter Tech-Stack |
| `02_database_schema.md` | Vollständiges DB-Schema |
| `03_auth_system.md` | Authentifizierung & Rollen |
| `04_user_management.md` | Benutzerverwaltung |
| `05_calendar_slots.md` | Krankalender & Slots |
| `06_file_manager.md` | Dateimanager |
| `07_dashboard.md` | Dashboard & Widgets |
| `08_settings_system.md` | Einstellungs-System |
| `09_navigation_routing.md` | Navigation & Routing |
| `10_edge_functions.md` | Edge Functions |
| `11_ui_components.md` | UI-Komponenten & Design |

## 9. Quick Start für Nachbau

### Option A: Neues Projekt von Grund auf

1. **Projekt erstellen**: Neues Lovable-Projekt mit React + TypeScript
2. **Supabase aktivieren**: Cloud-Integration aktivieren
3. **Database Setup**: SQL-Dump aus `docs/database/ksvl_database_dump_2026-01-23.sql` ausführen
4. **Auth konfigurieren**: Email-Auth mit Auto-Confirm aktivieren
5. **Edge Functions**: Functions aus `10_edge_functions.md` deployen
6. **Components**: UI-Komponenten gemäß Dokumentation implementieren
7. **Styling**: Maritime Theme aus `11_ui_components.md` anwenden

### Option B: Remix eines bestehenden Projekts

Für die Migration eines Remix-Projekts zu einer neuen Supabase-Instanz:

👉 **Siehe: [`docs/migration/REMIX_MIGRATION_GUIDE.md`](../migration/REMIX_MIGRATION_GUIDE.md)**

Diese Anleitung enthält:
- Schritt-für-Schritt-Anweisungen (8 Schritte)
- Vollständige Checkliste
- Troubleshooting-Tipps
- Übertragungs-Matrix

### Wichtige Dateien für Migration

| Datei | Beschreibung |
|-------|--------------|
| `docs/database/ksvl_database_dump_2026-01-23.sql` | Vollständiger DB-Dump (Schema, RLS, Funktionen, Storage, Trigger, Seed-Daten) |
| `docs/migration/REMIX_MIGRATION_GUIDE.md` | Migrations-Anleitung mit Checkliste |
| `docs/rebuild/10_edge_functions.md` | Edge Functions Dokumentation mit Deployment-Anleitung |

---

**Letzte Aktualisierung**: 2026-01-26
**Version**: 2.1.0
