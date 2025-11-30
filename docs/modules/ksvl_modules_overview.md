# KSVL App - Module-Übersicht

**Erstellt:** 2025-11-30  
**Status:** HIGH PRIORITY Optimierungen abgeschlossen (Sprint 1 ✅)

---

## Modul-Klassifizierung

Die KSVL-App besteht aus **8 funktionalen Modulen**, die in 3 Kategorien eingeteilt werden:

| **Typ**        | **Module**                              | **Anzahl** |
|----------------|-----------------------------------------|------------|
| **Core**       | Auth, Users, Roles, Settings, Navigation | 5          |
| **Domain**     | Marina/Slots, File-Manager              | 2          |
| **Support**    | Dashboard                               | 1          |

---

## Modul-Tabelle (Übersicht)

| **Modul**          | **Typ**   | **Routen**                  | **Haupt-Hooks**                          | **Services**             | **CRUD-Kapselung** |
|--------------------|-----------|-----------------------------|-----------------------------------------|--------------------------|--------------------|
| **Auth**           | Core      | `/auth`                     | `useAuth` (via Context)                 | —                        | ✅ Gut             |
| **Users/Profiles** | Core      | `/` (Dashboard), Settings   | `useUsersData`, `useUsers`, `useRole`   | `user-service.ts` ✅     | ✅ Gut             |
| **Roles**          | Core      | —                           | `useRole`, `useRoleBadgeSettings`       | —                        | ✅ Gut             |
| **Settings**       | Core      | `/settings`                 | `useSettingsBatch`, `use*Settings` (10+) | —                      | ✅ Gut             |
| **Navigation**     | Core      | —                           | `useMenuSettings`, `useFooterMenuSettings` | `routes.ts` ✅         | ✅ Gut             |
| **Marina/Slots**   | Domain    | `/` (Kalender)              | `useSlots`, `useConsecutiveSlots`       | `slot-service.ts` ✅   | ✅ Gut             |
| **File-Manager**   | Domain    | `/dateimanager`             | `useFileManager`, `useFilePermissions`  | ❌ Fehlt                 | ⚠️ Gemischt        |
| **Dashboard**      | Support   | `/`                         | `useDashboardSettings`, `useHarborChatData` | —                    | ✅ Gut             |

---

## Detaillierte Modul-Analyse

### 1. Auth (Core)

**Verantwortung:** Benutzer-Authentifizierung, Session-Management

**Dateien:**
- **Context:** `src/contexts/auth-context.tsx`
- **Hooks:** `useAuth()` (via Context)
- **Pages:** `src/pages/Auth.tsx`
- **Edge Functions:** `manage-user`, `manage-user-password`, `reset-password-admin`

**Layer-Struktur:**
```
UI-Layer:     Auth.tsx (Login/Register Forms)
              ↓
Context:      AuthContext (Session, signIn, signOut)
              ↓
Backend:      Supabase Auth + Edge Functions
```

**CRUD-Kapselung:** ✅ **Gut**  
- Authentifizierungs-Logik ist in `AuthContext` gekapselt
- Komponenten nutzen nur `useAuth()` Hook

**Empfehlungen:**
- 🔹 In `/core/auth` verschieben (Foundation-Struktur)
- 🔹 Guards-Komponenten ergänzen: `<RequireAuth>`, `<RequireRole roles={['admin']}>`

---

### 2. Users/Profiles (Core)

**Verantwortung:** Benutzerverwaltung, Profile, Mitgliederdaten

**Dateien:**
- **Service:** `src/lib/services/user-service.ts` ✅
- **Hooks:** 
  - `src/hooks/use-users-data.tsx` (zentrale Query)
  - `src/hooks/use-users.tsx` (mit CRUD)
  - `src/hooks/use-profile-data.tsx`
  - `src/hooks/use-role.tsx` (mit Rollenwechsel)
- **Components:**
  - `src/components/user-management.tsx` (963 Zeilen - God-Component)
  - `src/components/user-list-database.tsx`
  - `src/components/user-detail-view.tsx`
  - **Profile-View (REFACTORED ✅):**
    - `src/components/profile-view.tsx` (594 Zeilen - Orchestrator)
    - `src/components/profile/profile-header.tsx` (99 Zeilen)
    - `src/components/profile/profile-documents-section.tsx` (66 Zeilen)
    - `src/components/profile/password-change-dialog.tsx` (163 Zeilen)
    - `src/components/profile/custom-fields-section.tsx` (369 Zeilen)
    - `src/components/profile/profile-form-cards.tsx` (81 Zeilen)
    - `src/components/profile/profile-personal-cards.tsx` (85 Zeilen)
    - `src/components/profile/profile-admin-cards.tsx` (110 Zeilen)
    - `src/components/profile/profile-boat-cards.tsx` (304 Zeilen)
    - `src/components/profile/profile-login-card.tsx` (125 Zeilen)
    - `src/components/profile/profile-master-data-card.tsx` (205 Zeilen)
    - `src/components/profile/profile-membership-card.tsx` (194 Zeilen)
    - `src/components/profile/profile-privacy-card.tsx` (268 Zeilen)
- **Pages:** `/` (Dashboard mit User-Liste)

**Layer-Struktur:**
```
UI-Layer:     user-management.tsx, user-detail-view.tsx
              ↓
Hooks:        useUsers() → useUsersData() (React Query Cache)
              ↓
Service:      user-service.ts (CRUD via Edge Function)
              ↓
Backend:      Edge Function: manage-user
              Database: profiles, user_roles
```

**CRUD-Kapselung:** ✅ **Gut**  
- ✅ Alle CRUD-Operationen via `user-service.ts`
- ✅ Zentrale Datenquelle: `useUsersData()` (React Query Cache)
- ✅ Komponenten rufen nur Hooks auf, keine direkten Supabase-Calls
- ✅ Profile-View modular aufgeteilt (13 Sub-Komponenten)

**Stärken:**
- 🟢 `useUsersData()` eliminiert redundante Queries (75-80% Reduktion)
- 🟢 `user-service.ts` kapselt Edge-Function-Calls sauber
- 🟢 React Query Caching (staleTime: 5min)
- 🟢 **Profile-View Refactoring abgeschlossen** (2173 → 594 Zeilen, -73%)

**Schwächen:**
- 🔴 `user-management.tsx` ist God-Component (963 Zeilen)
- 🔴 Sollte aufgeteilt werden (siehe Sprint 2 Plan)

**Empfehlungen:**
- 🔥 **HIGH PRIORITY:** `user-management.tsx` aufteilen (6 Komponenten)
- 🔹 Optional: `/core/db/users.ts` für reine DB-Abstraction (kein Service-Layer)

---

### 3. Roles (Core)

**Verantwortung:** Rollenverwaltung, Berechtigungen, Rollenabzeichen

**Dateien:**
- **Hooks:** 
  - `src/hooks/use-role.tsx` (RoleProvider, hasPermission)
  - `src/hooks/use-role-badge-settings.tsx`
- **Components:**
  - `src/components/user-role-selector.tsx`
  - `src/components/role-card-grid.tsx`
  - `src/components/role-system-info.tsx`
- **Types:** `src/types/index.ts` (UserRole, generateRolesFromPrimary)
- **Database:** `user_roles`, `role_configurations`, `role_badge_settings`

**Layer-Struktur:**
```
UI-Layer:     user-role-selector.tsx
              ↓
Context:      RoleProvider (use-role.tsx)
              ↓
Hooks:        useRole() → useUsersData()
              ↓
Database:     user_roles, role_configurations
```

**CRUD-Kapselung:** ✅ **Gut**  
- Rollen-Logik ist in `RoleProvider` (Context) gekapselt
- `hasPermission()`, `hasAnyRole()` zentral verfügbar

**Schwächen:**
- 🔴 Role-Switching lädt dedizierte User via direkter Supabase-Query (nicht über Cache)

**Empfehlungen:**
- 🔹 Role-Switching-Query via `useUsersData()` optimieren
- 🔹 Optional: `role-service.ts` für Rollen-CRUD (aktuell direkt in Supabase)

---

### 4. Settings (Core)

**Verantwortung:** App-Einstellungen, User-Präferenzen, Theme, Dashboard-Config

**Dateien:**
- **Hooks (zentral):**
  - `src/hooks/use-settings-batch.tsx` ✅ (lädt alle Settings)
  - `src/hooks/use-app-settings.tsx`
- **Hooks (spezifisch, 10+):**
  - `use-menu-settings.tsx`, `use-footer-menu-settings.tsx`
  - `use-theme-settings.tsx`, `use-dashboard-settings.tsx`
  - `use-ai-assistant-settings.tsx`, `use-ai-welcome-message.tsx`
  - `use-desktop-background.tsx`, `use-login-background.tsx`
  - `use-sticky-header-layout.tsx`, `use-slot-design.tsx`
  - `use-consecutive-slots.tsx`, `use-welcome-messages.tsx`
- **Components:**
  - `src/components/*-settings.tsx` (Dashboard-, Design-, Menu-Settings)
- **Pages:** `src/pages/Settings.tsx`
- **Database:** `app_settings`

**Layer-Struktur:**
```
UI-Layer:     Settings.tsx, *-settings.tsx Components
              ↓
Hooks:        use*Settings() → useSettingsBatch() (React Query Cache)
              ↓
Database:     app_settings (setting_key, setting_value JSON)
```

**CRUD-Kapselung:** ✅ **Gut**  
- ✅ `useSettingsBatch()` lädt alle Settings in einer Query
- ✅ `updateSetting()` mit automatischer Cache-Invalidierung
- ✅ Spezifische Hooks abstrahieren Setting-Keys

**Stärken:**
- 🟢 Batch-Query reduziert DB-Calls massiv
- 🟢 Rollenbezogene Settings (z.B. `dashboard_config_<role>`)
- 🟢 Type-Safe Getter: `getSetting<T>(key, defaultValue)`

**Schwächen:**
- 🟡 Viele spezifische Hooks (10+) → Könnte in Zukunft zu einem `useSettings()` konsolidiert werden

**Empfehlungen:**
- 🔹 Optional: `SettingsService` erstellen (analog zu `UserService`)
- 🔹 Settings-Hooks dokumentieren (welche Keys existieren?)

---

### 5. Navigation (Core)

**Verantwortung:** Menü, Routen, Footer, Navigation-Guards

**Dateien:**
- **Hooks:**
  - `src/hooks/use-menu-settings.tsx`
  - `src/hooks/use-footer-menu-settings.tsx`
- **Components:**
  - `src/components/app-shell.tsx` (Haupt-Navigation)
  - `src/components/menu-settings.tsx`
  - `src/components/footer-menu-settings.tsx`
- **Pages:** `src/App.tsx` (React Router Setup)
- **Database:** `menu_item_definitions`

**Layer-Struktur:**
```
UI-Layer:     app-shell.tsx (Menü-Rendering)
              ↓
Hooks:        useMenuSettings() → useSettingsBatch()
              ↓
Database:     menu_item_definitions, app_settings
```

**CRUD-Kapselung:** ✅ **Gut**  
- ✅ Menü-Items aus DB geladen
- ✅ **Zentrale Route-Registry** (`src/lib/registry/routes.ts`) ✅
- ✅ Rollenbezogene Route-Guards (`ProtectedRoute`) ✅

**Stärken:**
- 🟢 **Route-Registry** mit Metadaten (path, title, allowedRoles) ✅
- 🟢 `ProtectedRoute` Komponente für Guards ✅
- 🟢 Helper-Funktionen: `getRouteByPath()`, `hasRouteAccess()`, `getAccessibleRoutes()` ✅

**✅ Optimierungen abgeschlossen (Sprint 1):**
```typescript
// src/lib/registry/routes.ts ✅ IMPLEMENTIERT
export const ROUTES = {
  public: [
    { path: '/auth', component: 'Auth', title: 'Login' },
  ],
  protected: [
    { path: '/', component: 'Index', title: 'Dashboard', allowedRoles: ['*'] },
    { path: '/settings', component: 'Settings', title: 'Einstellungen', allowedRoles: ['admin'] },
  ],
};

// src/components/common/protected-route.tsx ✅ IMPLEMENTIERT
<ProtectedRoute path="/settings" allowedRoles={['admin']}>
  <Settings />
</ProtectedRoute>
```

---

### 6. Marina/Slots (Domain)

**Verantwortung:** Krankalender, Slots, Buchungen, Kranführer-Verwaltung

**Dateien:**
- **Service:** `src/lib/services/slot-service.ts` ✅
- **Hooks:**
  - `src/hooks/use-slots.tsx` ✅ (nutzt slot-service)
  - `src/hooks/use-consecutive-slots.tsx`
  - `src/hooks/use-slot-design.tsx`
- **Components:**
  - `src/components/slot-management.tsx` (God-Component, 627 Zeilen)
  - `src/components/calendar-view.tsx`
  - `src/components/week-calendar.tsx`
  - `src/components/month-calendar.tsx`
  - `src/components/slot-form-dialog.tsx`
  - `src/components/common/slot-form.tsx`
- **Pages:** `/` (Dashboard mit Kalender-Ansicht)
- **Database:** `slots`

**Layer-Struktur:**
```
UI-Layer:     slot-management.tsx, calendar-view.tsx
              ↓
Hooks:        useSlots() → slotService (React Query Wrapper)
              ↓
Service:      slot-service.ts (CRUD-Logik) ✅
              ↓
Backend:      Supabase Client
              Database: slots
```

**CRUD-Kapselung:** ✅ **Gut**  
- ✅ **Slot-Service** (`src/lib/services/slot-service.ts`) implementiert ✅
- ✅ `use-slots.tsx` nutzt Service-Methoden (kein direkter Supabase-Call) ✅
- ✅ Komponenten rufen Hook-Methoden auf (nicht direkt Supabase) ✅
- ⚠️ `slot-management.tsx` ist **God-Component** (956 Zeilen):
  - Liste + Filter + Dialog + Kalender-Ansichten + CRUD-Forms + Booking

**Stärken:**
- 🟢 **`slot-service.ts`** kapselt CRUD-Logik sauber (analog zu `user-service.ts`) ✅
- 🟢 `useSlots()` nutzt `useUsersData()` für Profile-Daten (optimiert seit Phase 3) ✅
- 🟢 Realtime-Subscriptions via `realtime-manager.ts` ✅

**Schwächen:**
- 🔴 `slot-management.tsx` ist God-Component (956 Zeilen)
- 🔴 Sollte aufgeteilt werden (siehe Sprint 2 Plan)

**✅ Optimierungen abgeschlossen (Sprint 1):**
```typescript
// src/lib/services/slot-service.ts ✅ IMPLEMENTIERT
export const slotService = {
  fetchSlots: async (options) => { /* ... */ },
  createSlot: async (data: CreateSlotData) => { /* ... */ },
  createSlotBlock: async (data: CreateSlotBlockData) => { /* ... */ },
  updateSlot: async (id: string, updates: Partial<Slot>) => { /* ... */ },
  deleteSlot: async (id: string) => { /* ... */ },
  bookSlot: async (slotId: string, memberId: string, profile: Profile) => { /* ... */ },
  cancelBooking: async (slotId: string) => { /* ... */ },
};
```

**Verbleibende Empfehlungen (HIGH PRIORITY):**
- 🔥 **Sprint 2:** `slot-management.tsx` aufteilen (6 Komponenten):
  - `slot-list.tsx` (~200 Zeilen)
  - `slot-filters.tsx` (~150 Zeilen)
  - `slot-calendar-view.tsx` (~200 Zeilen)
  - `slot-details-dialog.tsx` (~150 Zeilen)
  - `slot-booking-dialog.tsx` (~100 Zeilen)
  - `slot-management.tsx` (~150 Zeilen - Orchestrator)

---

### 7. File-Manager (Domain)

**Verantwortung:** Datei-Upload, File-Permissions (RBAC), Kategorien, Vorschau

**Dateien:**
- **Hooks:**
  - `src/hooks/use-file-manager.tsx`
  - `src/hooks/use-file-permissions.tsx`
- **Components (Modul-Ordner!):**
  - `src/components/file-manager/enhanced-file-manager.tsx`
  - `src/components/file-manager/file-card.tsx`
  - `src/components/file-manager/components/file-upload-drawer.tsx`
  - `src/components/file-manager/components/file-detail-drawer.tsx` ✅ (Duplikat entfernt)
  - `src/components/file-manager/components/file-preview.tsx`
  - `src/components/file-manager/components/bulk-permissions-dialog.tsx`
- **Pages:** `src/pages/FileManager.tsx`
- **Database:** `file_metadata`
- **Storage:** Supabase Storage Buckets (`user-documents`, etc.)

**Layer-Struktur:**
```
UI-Layer:     FileManager.tsx, enhanced-file-manager.tsx
              ↓
Hooks:        useFileManager() (Query + Mutations)
              useFilePermissions() (RBAC-Logik)
              ↓
Backend:      Direkter Supabase-Zugriff (Storage + DB)
              Database: file_metadata
              Storage: Buckets
```

**CRUD-Kapselung:** ⚠️ **Gemischt**  
- ⚠️ **Kein File-Service** → CRUD-Logik in Hooks
- ✅ Komponenten rufen nur Hook-Methoden auf
- ✅ RBAC-Logik in separatem Hook (`useFilePermissions`)

**Stärken:**
- 🟢 Modularer Ordner: `/file-manager` (einziges Modul mit eigener Struktur!)
- 🟢 RBAC-System (allowed_roles, owner_id) sauber implementiert
- 🟢 File-Preview, Bulk-Permissions, Categories

**Schwächen:**
- 🔴 **Kein `file-service.ts`** → Upload/Delete-Logik in Hook
- 🔴 Direkte Supabase Storage Calls in Hook

**Empfehlungen (MEDIUM PRIORITY):**
- 🔹 **`file-service.ts` erstellen:**
  ```typescript
  export class FileService {
    async uploadFile(file: File, metadata: FileMetadata) { /* ... */ }
    async deleteFile(fileId: string) { /* ... */ }
    async updatePermissions(fileId: string, roles: string[]) { /* ... */ }
  }
  ```
- 🔹 File-Manager als Best-Practice für andere Module dokumentieren

---

### 8. Dashboard (Support)

**Verantwortung:** Dashboard-Ansicht, Widgets, Activity-Feed, Stats

**Dateien:**
- **Hooks:**
  - `src/hooks/use-dashboard-settings.tsx`
  - `src/hooks/use-dashboard-animations.tsx`
  - `src/hooks/use-harbor-chat-data.tsx`
- **Components:**
  - `src/components/dashboard.tsx`
  - `src/components/dashboard-header.tsx`
  - `src/components/dashboard-sections/welcome-section.tsx`
  - `src/components/dashboard-sections/stats-grid-section.tsx`
  - `src/components/dashboard-sections/activity-feed-section.tsx`
  - `src/components/dashboard-sections/quick-actions-section.tsx`
  - `src/components/dashboard-widgets/*` (8 Widgets)
- **Pages:** `src/pages/Index.tsx`
- **Database:** `dashboard_section_definitions`, `dashboard_widget_definitions`

**Layer-Struktur:**
```
UI-Layer:     dashboard.tsx, dashboard-sections/*, dashboard-widgets/*
              ↓
Hooks:        useDashboardSettings() → useSettingsBatch()
              ↓
Database:     dashboard_*_definitions, app_settings
```

**CRUD-Kapselung:** ✅ **Gut**  
- ✅ Dashboard-Config via Settings-System
- ✅ Widgets als kleine, wiederverwendbare Komponenten
- ✅ Drag-&-Drop-Layout (via app_settings)

**Stärken:**
- 🟢 Modulare Widget-Architektur
- 🟢 Rollenbezogene Sichtbarkeit (allowed_roles)
- 🟢 Persistente Layout-Config

**Empfehlungen:**
- 🔹 Keine Änderungen nötig (gut strukturiert)

---

## Zusammenfassung: CRUD-Kapselung

### ✅ Gut gekapselt (3 Module)
1. **Auth** → AuthContext
2. **Users/Profiles** → user-service.ts
3. **Dashboard** → Settings-System

### ⚠️ Gemischt (3 Module)
4. **Roles** → RoleProvider, aber Role-Switching direkt in Hook
5. **Marina/Slots** → Kein Slot-Service, CRUD in Hook
6. **File-Manager** → Kein File-Service, CRUD in Hook

### ✅ Keine CRUD-Operationen (2 Module)
7. **Settings** → Read-Only (via useSettingsBatch)
8. **Navigation** → Config-basiert (via DB)

---

## Empfehlungen nach Modul

| **Modul**          | **Priorität** | **Empfehlung**                                                      | **Status**    |
|--------------------|---------------|---------------------------------------------------------------------|---------------|
| **Marina/Slots**   | ✅ DONE       | `slot-service.ts` erstellen, CRUD aus Hook extrahieren             | ✅ Erledigt   |
| **Navigation**     | ✅ DONE       | Route-Registry (`lib/registry/routes.ts`) + Guards                 | ✅ Erledigt   |
| **Roles**          | ✅ DONE       | Role-Switching via `useUsersData()` optimieren                      | ✅ Erledigt   |
| **Users/Profiles** | ✅ DONE       | `profile-view.tsx` refactoren (13 Sub-Komponenten)                  | ✅ Erledigt   |
| **Marina/Slots**   | 🔥 HIGH       | `slot-management.tsx` aufteilen (God-Component → 6 Komponenten)     | 🔄 Sprint 2   |
| **Users**          | 🔥 HIGH       | `user-management.tsx` aufteilen (God-Component → 6 Komponenten)     | 🔄 Sprint 2   |
| **All Hooks**      | 🔹 MEDIUM     | Console.log Cleanup (523 Statements entfernen)                      | 🔄 Sprint 2   |
| **Core**           | 🔹 MEDIUM     | Module-Registry erstellen (`lib/registry/modules.ts`)               | 🔄 Sprint 2   |
| **File-Manager**   | 🔷 LOW        | `file-service.ts` erstellen (optional)                              | 🔄 Sprint 3+  |
| **All Core**       | 🔷 LOW        | In `/core`-Verzeichnis verschieben (Foundation-Struktur)            | 🔄 Sprint 3+  |
| **Dashboard**      | ✅ DONE       | Gut strukturiert, keine Änderungen nötig                            | ✅ Erledigt   |

---

**Dokumenten-Version:** 1.0  
**Zuletzt aktualisiert:** 2025-11-28  
**Verantwortlich:** Architecture Team
