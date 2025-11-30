# KSVL App – Sprint 2 Roadmap & Lovable-Prompts

**Erstellt:** 2025-11-30  
**Zweck:** Executive Summary, Sprint-2-Backlog und copy-paste-fertige Lovable-Prompts für Architektur-Optimierungen

---

## 1. Executive Summary – KSVL Slot Manager

**Projekt:** KSVL Slot Manager (Hafen- & Mitgliederverwaltung, Klagenfurter Segelverein Loretto)

**Zweck:**  
Die KSVL-App ist das zentrale digitale Werkzeug des Vereins. Sie bündelt:

- **Krantermin-Buchung:** Online-Slot-System für Ein- und Auswassern  
- **Mitgliederverwaltung:** Strukturierte Profile mit vielen Vereins- & Bootsdaten  
- **Dokumentenmanagement:** Upload von Versicherungen, BFA-Scheinen, etc.  
- **Dashboard & Auswertungen:** Übersicht über Hafenstatus, Mitglieder, Events  
- **KI-Assistent („Capitano"):** Beantwortet Fragen rund um Verein & Hafen  
- **Rollen & Rechte:** Unterschiedliche Sichtbarkeit und Funktionen je Rolle (Mitglied, Kranführer, Vorstand, Admin, Gastmitglied)

**Technische Basis:**

- Frontend: React, TypeScript, Vite  
- Styling/UI: Tailwind, shadcn/ui, Radix, maritime Design-Tokens  
- Backend: Supabase (Auth, DB, Storage, Edge Functions), Lovable Cloud  
- Architektur: Service-Layer, zentrale Hooks, RLS-gesicherte Tabellen, Edge Functions für User/Slots/Chat

**Aktueller Status:**

- Architektur & Datenmodell sind **stark und zukunftssicher** (Foundation ~87/100).  
- Die wichtigsten Funktionen (Slots, Mitglieder, File-Manager, Settings, KI-Chat) sind vorhanden und technisch gut getrennt.  
- Die größten Verbesserungshebel liegen in:
  - **Aufbrechen großer "God Components"** (z.B. `slot-management.tsx` 956 Zeilen, `user-management.tsx` 963 Zeilen)
  - **Aufräumen von Debug-Code** (523 `console.log` Statements in 17 Dateien)
  - **Einführen einer klaren Modul-Registry** zur besseren Wartbarkeit und Dokumentation

---

## 2. Sprint-2-Backlog

**Ziel von Sprint 2:**  
Die App **stabiler, wartbarer und klarer strukturiert** machen – ohne neue große Features, nur mit Architektur-/Qualitätsverbesserungen.

---

### EPIC S2-E1 – Slot-Management refactoren (God Component aufteilen)

**Ziel:** `slot-management.tsx` (ca. 956 Zeilen) in klar getrennte, fokussierte Teilkomponenten + Hooks + Services aufteilen.

**User Story:**  
> „Als Kranführer und Admin möchte ich, dass die Slot-Verwaltung stabil und gut wartbar ist, damit neue Funktionen (z.B. Spezial-Slots, Wartungsfenster) ohne Risiko eingebaut werden können."

**Tasks:**

- **T1:** Architektur-Plan für Slots-Modul erstellen (Slot-Page, Slot-List, Slot-Calendar, Slot-Form, Slot-Details)
- **T2:** `slot-management.tsx` in Container + UI-Subkomponenten aufteilen:
  - `SlotManagementPage` (Container, Routing-Logik, ~150-200 Zeilen)
  - `SlotToolbar` (Filter, Aktionen, ~150 Zeilen)
  - `SlotCalendarView` (Monats-/Wochenansicht, ~200 Zeilen)
  - `SlotListView` (Listen-/Tabellenansicht, ~200 Zeilen)
  - `SlotFormDialog` (Neu/Bearbeiten, ~150 Zeilen)
  - `SlotDetailsPanel` (Details, Status, ~100 Zeilen)
- **T3:** Slot-spezifische Logik in eigene Hooks legen:
  - `useSlotsData` (Laden/Cachen, bereits vorhanden in `use-slots.tsx`)
  - `useSlotActions` (create/update/delete/book/cancel)
  - `useSlotFilters` (Filter-State + Logik)
- **T4:** Realtime-Subscription auslagern (Integration mit `realtimeManager`)
- **T5:** Tests & Klickpfade durchgehen (Buchung, Bearbeiten, Löschen, Block-Buchung)

**Aufwand:** ~4-6 Stunden  
**Status:** 🔜 Sprint 2  
**Priorität:** HIGH

---

### EPIC S2-E2 – Console.log Cleanup & Logging-Pattern

**Ziel:**  
523 `console.log`-Aufrufe entfernen oder ersetzen, ein sauberes Logging-Muster etablieren.

**User Story:**  
> „Als Entwickler möchte ich ein zentrales Logging, damit Fehler nachvollziehbar sind, aber die Konsole in Produktion nicht zugemüllt wird."

**Tasks:**

- **T1:** `logger.ts` prüfen/ergänzen (zentrale Funktionen `logInfo`, `logWarn`, `logError`, `logDebug`, dev/prod-Switch)
- **T2:** `console.log` in produktiven Pfaden entfernen oder durch `logger` ersetzen
- **T3:** Besonders kritische Stellen mit klaren Log-Messages ausstatten:
  - Slot-Buchungen (Erfolg/Fehler)
  - User-Änderungen (CRUD)
  - Auth-Events (Login, Logout, Session-Fehler)
  - API-Fehler (Edge Function Errors)
  - Realtime-Subscription-Probleme
- **T4:** Sicherstellen, dass in `production`-Builds nur Fehler/Warnings geloggt werden
- **T5:** Hauptbetroffene Dateien bereinigen:
  - `src/hooks/use-slots.tsx` (62 Matches)
  - `src/hooks/use-users-data.tsx` (58 Matches)
  - `src/contexts/slots-context.tsx` (45 Matches)
  - `src/lib/realtime-manager.ts` (38 Matches)
  - `src/hooks/use-settings-batch.tsx` (32 Matches)

**Aufwand:** ~2-3 Stunden  
**Status:** 🔜 Sprint 2  
**Priorität:** MEDIUM

---

### EPIC S2-E3 – Modul-Registry einführen

**Ziel:**  
Eine zentrale `modules.ts` pflegen, die alle Module (Slots, Users, Files, Dashboard, Settings, Harbor Chat) beschreibt.

**User Story:**  
> „Als Admin/Entwickler möchte ich eine klare Übersicht über alle Module der App, damit ich schnell sehe, was es gibt, welchen Status es hat und welche Routen/Tab-Namen dazugehören."

**Tasks:**

- **T1:** `docs/modules/ksvl_modules_overview.md` mit Daten aus aktueller Doku abgleichen/aktualisieren
- **T2:** `src/lib/registry/modules.ts` erstellen:
  - Interface: `AppModule` (id, name, description, type, lifecycle, routes, requiredRoles, docsPath, components, hooks, services)
  - Alle 8 Module registrieren:
    - **Core:** Auth, Users/Roles, Settings, Navigation
    - **Domain:** Slots, Dashboard, Harbor-Chat
    - **Support:** File-Manager
- **T3:** Helper-Funktionen:
  - `getModuleByRoute(path: string)`
  - `getModulesByType(type: ModuleType)`
  - `getStableModules()`
- **T4:** Optional: Navigation/Routen teilweise aus dieser Registry generieren

**Aufwand:** ~1-2 Stunden  
**Status:** 🔜 Sprint 2  
**Priorität:** MEDIUM

---

### EPIC S2-E4 – User-Management refactoren (BONUS)

**Ziel:** `user-management.tsx` (ca. 963 Zeilen) in klar getrennte Komponenten + Hooks aufteilen.

**User Story:**  
> „Als Admin möchte ich, dass die Mitgliederverwaltung stabil und wartbar ist, damit neue Funktionen (z.B. Bulk-Import, erweiterte Statistiken) ohne Risiko eingebaut werden können."

**Tasks:**

- **T1:** Architektur-Plan für Users-Modul erstellen
- **T2:** `user-management.tsx` aufteilen:
  - `UserManagementPage` (Container, ~200 Zeilen)
  - `UserToolbar` (Filter, Suche, Aktionen, ~150 Zeilen)
  - `UserList` (Listen-Ansicht, ~200 Zeilen)
  - `UserGrid` (Kachel-Ansicht, ~150 Zeilen)
  - `UserCreateDialog` (Neu-Dialog, ~150 Zeilen)
  - `UserStatsPanel` (Statistiken, ~100 Zeilen)
  - `UserExport` (Export-Logik, ~80 Zeilen)
- **T3:** Logik in Hooks auslagern:
  - `useUserFilters` (Filter-State + Logik)
  - `useUserActions` (create/update/delete, nutzt `user-service.ts`)
- **T4:** Bestehende Patterns nutzen:
  - `useUsersData()` für Datenladen (bereits vorhanden)
  - `user-service.ts` für CRUD (bereits vorhanden)
- **T5:** Tests & Klickpfade durchgehen

**Aufwand:** ~4-6 Stunden  
**Status:** 🔜 Sprint 2 (BONUS)  
**Priorität:** MEDIUM

---

## 3. Lovable-Prompts für konkrete Arbeit

Diese Prompts kannst du **direkt in Lovable im KSVL-Projekt** nutzen.

---

### 3.1 Prompt – Slot-Management refactoren

```md
TASK:
Refactore das Slot-Management-Modul der KSVL-App, ohne Funktionalität zu ändern.

KONTEXT:
- Die Datei `src/components/slot-management.tsx` ist aktuell eine God Component mit ca. 956 Zeilen.
- Sie enthält:
  - Laden/Filtern von Slots
  - Darstellung (Liste/Kalender)
  - Slot-Erstellung/Bearbeitung (Dialog)
  - Realtime-Updates
  - Business-Logik für Block-Buchungen und Mini-Slots
- Es existieren bereits:
  - `src/lib/services/slot-service.ts` (Service-Layer für Slots)
  - `src/lib/realtime-manager.ts` (Supabase Realtime)
  - `src/types/slot.ts` (Types)
  - `src/hooks/use-slots.tsx` (Daten-Hook)

ZIELE:
1. Struktur aufbrechen:
   - Erzeuge eine klare Modulstruktur, z.B.:

     src/components/slots/
       SlotManagementPage.tsx        (Container / Einstieg, ~150-200 Zeilen)
       SlotToolbar.tsx               (Filter, Aktionen, ~150 Zeilen)
       SlotCalendarView.tsx          (Monats-/Wochenansicht, ~200 Zeilen)
       SlotListView.tsx              (Listen-/Tabellenansicht, ~200 Zeilen)
       SlotFormDialog.tsx            (Neu/Bearbeiten, ~150 Zeilen)
       SlotDetailsPanel.tsx          (Details, Status, ~100 Zeilen)

   - Verschiebe UI-spezifische Teile in diese Komponenten.
   - Lass `SlotManagementPage` nur noch orchestrieren (State + Render).

2. Logik in Hooks auslagern:
   - Erzeuge Hooks im passenden Ordner (z.B. /hooks oder /lib/hooks):
     - `useSlotActions` → create/update/delete/book/cancel, inkl. Toasts
     - `useSlotFilters` → Filter-State + Logik
   - Verwende intern `slot-service.ts` und `realtimeManager`.
   - `useSlotsData` (aus `use-slots.tsx`) für Laden/Cachen/Realtime.

3. Verantwortlichkeiten trennen:
   - UI-Komponenten sollen möglichst keine direkten Supabase- oder Service-Calls haben, sondern Hooks nutzen.
   - Realtime-Subscription-Setup in einem Hook bündeln (z.B. in `useSlotsData` oder neuer Hook `useSlotsRealtime`).

4. Verhalten nicht ändern:
   - Alle bestehenden Flows (Slot-Buchung, Bearbeiten, Löschen, Block-Buchungen, Mini-Slots) müssen weiterhin funktionieren.
   - Keine neuen Features einbauen.
   - Keine Routen ändern.

5. Codequalität:
   - Entferne offensichtliche Duplikate.
   - Nutze bestehende UI-Komponenten (shadcn/ui) & Maritime Design-Tokens aus `index.css` und `tailwind.config.ts`.
   - Keine neuen Bibliotheken einführen.

OUTPUT:
- Aufgeteilte Komponenten im neuen `src/components/slots/` Modul.
- Neue Hooks für Slots in `src/hooks/` (useSlotActions, useSlotFilters).
- `slot-management.tsx` soll am Ende nur noch ein schlanker Einstiegspunkt sein oder vollständig ersetzt sein durch `SlotManagementPage.tsx`.
- Alle bestehenden Flows funktionieren ohne Breaking Changes.

WICHTIG:
- Ändere KEINE Funktionalität.
- Halte dich an das bestehende Design-System (maritime Tokens).
- Keine neuen Dependencies.
```

---

### 3.2 Prompt – Console.log Cleanup

```md
TASK:
Entferne alle console.log Statements aus der KSVL-App und etabliere ein sauberes Logging-Pattern.

KONTEXT:
- Aktuell: 523 console.log() Statements in 17 Dateien
- Hauptbetroffene Dateien:
  - `src/hooks/use-slots.tsx` (62 Matches)
  - `src/hooks/use-users-data.tsx` (58 Matches)
  - `src/contexts/slots-context.tsx` (45 Matches)
  - `src/lib/realtime-manager.ts` (38 Matches)
  - `src/hooks/use-settings-batch.tsx` (32 Matches)
  - und weitere...
- Es existiert bereits: `src/lib/logger.ts`

ZIELE:
1. Console.log Statements behandeln:
   - **Debug-Statements ENTFERNEN** (nicht ersetzen) → z.B. "✅ Loaded X users", "🔄 Fetching...", "📦 Raw data"
   - **Wichtige Events (Errors, Warnings) durch logger.ts ersetzen** → z.B. API-Fehler, Auth-Probleme, Realtime-Subscription-Errors
   - **Keine console.log in Produktion**

2. Logger.ts erweitern (falls nötig):
   - `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
   - Environment-Check: Debug nur in Development (`import.meta.env.DEV`)
   - Einheitliches Format mit Timestamp und Quelle (z.B. `[2025-11-30 14:23:45] [use-slots] Error: ...`)

3. Wichtige Log-Punkte behalten (via logger):
   - **Auth-Events:** Login-Fehler, Session-Probleme, Logout
   - **API-Fehler:** Edge Function Errors (manage-user, harbor-chat, etc.)
   - **Realtime-Subscription-Probleme:** Channel disconnects, Subscription-Failures
   - **Kritische Geschäftslogik-Fehler:** Slot-Buchung fehlgeschlagen, User-Update failed

4. Production-Optimierung:
   - `logger.debug()` nur in `import.meta.env.DEV === true`
   - `logger.error()` und `logger.warn()` immer aktiv
   - Keine sensiblen Daten loggen (Passwörter, API-Keys, User-IDs nur in Dev)

5. Hauptbetroffene Dateien bereinigen:
   - `src/hooks/use-slots.tsx`
   - `src/hooks/use-users-data.tsx`
   - `src/contexts/slots-context.tsx`
   - `src/lib/realtime-manager.ts`
   - `src/hooks/use-settings-batch.tsx`
   - `src/contexts/auth-context.tsx`
   - `src/pages/Auth.tsx`
   - und alle weiteren mit console.log

OUTPUT:
- Alle console.log entfernt oder durch logger ersetzt
- Logger.ts erweitert (falls nötig) mit Environment-Check
- Keine Breaking Changes an der Funktionalität
- Production-Build ohne Debug-Logs

WICHTIG:
- Debug-Statements entfernen, NICHT ersetzen (z.B. "✅ Loaded X users" → DELETE)
- Nur echte Fehler/Warnings über logger loggen
- Keine neuen Dependencies
```

---

### 3.3 Prompt – Module-Registry erstellen

```md
TASK:
Erstelle eine zentrale Module-Registry für die KSVL-App.

KONTEXT:
- Aktuell: Keine zentrale Übersicht über alle Module
- Existierende Route-Registry: `src/lib/registry/routes.ts`
- Dokumentation: `docs/modules/ksvl_modules_overview.md`
- Es gibt 8 Hauptmodule:
  - **Core:** Auth, Users/Roles, Settings, Navigation
  - **Domain:** Slots, Dashboard, Harbor-Chat
  - **Support:** File-Manager

ZIELE:
1. Neue Datei erstellen: `src/lib/registry/modules.ts`

2. Interface definieren:
   ```typescript
   export type ModuleLifecycle = 'draft' | 'stable' | 'frozen' | 'deprecated';
   export type ModuleType = 'core' | 'domain' | 'support';

   export interface AppModule {
     id: string;
     name: string;
     description: string;
     type: ModuleType;
     lifecycle: ModuleLifecycle;
     routes: string[];
     requiredRoles?: string[];
     docsPath?: string;
     components?: string[];
     hooks?: string[];
     services?: string[];
   }
   ```

3. Alle 8 Module registrieren:
   
   **CORE MODULE:**
   - **auth**: Auth-System (Login, Session, Protected Routes)
     - Routes: ['/auth']
     - Lifecycle: stable
     - Components: ['Auth.tsx', 'ProtectedRoute.tsx']
     - Hooks: ['use-auth.tsx']
     - Context: ['auth-context.tsx']
   
   - **users**: User/Profile-Management
     - Routes: ['/users', '/profile/:id']
     - Lifecycle: stable
     - Components: ['user-management.tsx', 'profile-view.tsx', 'user-list-database.tsx']
     - Hooks: ['use-users.tsx', 'use-users-data.tsx', 'use-profile-data.tsx']
     - Services: ['user-service.ts']
   
   - **settings**: App-Einstellungen (Theme, Design, Menü, etc.)
     - Routes: ['/settings']
     - Lifecycle: stable
     - Components: ['Settings.tsx', 'theme-manager.tsx', 'menu-settings.tsx']
     - Hooks: ['use-app-settings.tsx', 'use-theme-settings.tsx']
   
   - **navigation**: Routing & Navigation
     - Routes: ['/']
     - Lifecycle: stable
     - Registry: ['routes.ts']
     - Components: ['app-shell.tsx']
   
   **DOMAIN MODULE:**
   - **slots**: Krantermin-Buchung & Slot-Management
     - Routes: ['/slots']
     - Lifecycle: stable
     - RequiredRoles: ['admin', 'kranfuehrer', 'mitglied']
     - Components: ['slot-management.tsx', 'slot-form-dialog.tsx', 'calendar-view.tsx']
     - Hooks: ['use-slots.tsx']
     - Services: ['slot-service.ts']
     - Context: ['slots-context.tsx']
   
   - **dashboard**: Dashboard mit Widgets & Stats
     - Routes: ['/dashboard']
     - Lifecycle: stable
     - Components: ['dashboard.tsx', 'dashboard-widgets/*']
     - Hooks: ['use-dashboard-settings.tsx']
   
   - **harbor-chat**: KI-Assistent "Capitano"
     - Routes: ['/harbor-chat'] (if applicable)
     - Lifecycle: stable
     - Components: ['harbor-chat-widget.tsx', 'ai-chat-mini-widget.tsx']
     - Hooks: ['use-harbor-chat-data.tsx', 'use-ai-assistant-settings.tsx']
     - EdgeFunctions: ['harbor-chat']
   
   **SUPPORT MODULE:**
   - **file-manager**: Dokumenten-Upload & Verwaltung
     - Routes: ['/file-manager']
     - Lifecycle: stable
     - RequiredRoles: ['admin', 'vorstand', 'mitglied']
     - Components: ['file-manager/*']
     - Hooks: ['use-file-manager.tsx', 'use-file-permissions.tsx']

4. Metadaten pflegen:
   - Routen pro Modul (aus `routes.ts` und Komponenten)
   - Erforderliche Rollen (aus `ProtectedRoute` Definitionen)
   - Lifecycle-Status (stable für alle aktiven Module)
   - Pfade zu Docs, Hooks, Services

5. Helper-Funktionen:
   ```typescript
   export function getModuleByRoute(path: string): AppModule | undefined {
     return APP_MODULES.find(m => m.routes.some(r => path.startsWith(r)));
   }

   export function getModulesByType(type: ModuleType): AppModule[] {
     return APP_MODULES.filter(m => m.type === type);
   }

   export function getStableModules(): AppModule[] {
     return APP_MODULES.filter(m => m.lifecycle === 'stable');
   }

   export function getModulesByRole(role: string): AppModule[] {
     return APP_MODULES.filter(m => 
       !m.requiredRoles || m.requiredRoles.includes(role)
     );
   }
   ```

6. Export:
   ```typescript
   export const APP_MODULES: AppModule[] = [ ... ];
   ```

OUTPUT:
- Neue Datei: `src/lib/registry/modules.ts`
- Alle 8 Module mit vollständigen Metadaten registriert
- Helper-Funktionen für Navigation/Docs-Generierung
- TypeScript-Interfaces für Typsicherheit

WICHTIG:
- Orientiere dich an bestehender `routes.ts` Registry
- Keine Breaking Changes
- Keine neuen Dependencies
```

---

### 3.4 Prompt – User-Management refactoren (BONUS)

```md
TASK:
Refactore das User-Management-Modul der KSVL-App, ohne Funktionalität zu ändern.

KONTEXT:
- Die Datei `src/components/user-management.tsx` ist aktuell eine God Component mit ca. 963 Zeilen.
- Sie enthält:
  - Laden/Filtern von Users
  - Darstellung (Liste/Kacheln)
  - User-Erstellung/Bearbeitung (Dialoge)
  - Stats-Panel
  - Export-Funktionalität
- Es existieren bereits:
  - `src/lib/services/user-service.ts` (Service-Layer für Users)
  - `src/hooks/use-users-data.tsx` (zentraler Daten-Hook)
  - `src/hooks/use-users.tsx` (CRUD-Logik)
  - `src/types/user.ts` (Types)

ZIELE:
1. Struktur aufbrechen:
   - Erzeuge eine klare Modulstruktur, z.B.:

     src/components/users/
       UserManagementPage.tsx    (Container / Einstieg, ~200 Zeilen)
       UserToolbar.tsx           (Filter, Suche, Aktionen, ~150 Zeilen)
       UserList.tsx              (Listen-Ansicht, ~200 Zeilen)
       UserGrid.tsx              (Kachel-Ansicht, ~150 Zeilen)
       UserCreateDialog.tsx      (Neu-Dialog, ~150 Zeilen)
       UserStatsPanel.tsx        (Statistiken, ~100 Zeilen)
       UserExport.tsx            (Export-Logik, ~80 Zeilen)

   - Verschiebe UI-spezifische Teile in diese Komponenten.
   - Lass `UserManagementPage` nur noch orchestrieren (State + Render).

2. Logik in Hooks auslagern:
   - Erzeuge Hooks im passenden Ordner (z.B. /hooks):
     - `useUserFilters` → Filter-State + Logik (Suche, Rolle, Status)
     - `useUserActions` → create/update/delete (nutzt `user-service.ts`)
   - Verwende intern `user-service.ts` für CRUD.
   - Nutze `useUsersData()` für Datenladen (bereits vorhanden).

3. Verantwortlichkeiten trennen:
   - UI-Komponenten sollen möglichst keine direkten Service-Calls haben, sondern Hooks nutzen.
   - Filter-Logik (Suche, Rollen-Filter, Status-Filter) in `useUserFilters` auslagern.
   - CRUD-Logik (create/update/delete) in `useUserActions` auslagern.

4. Verhalten nicht ändern:
   - Alle bestehenden Flows (User-Anlegen, Bearbeiten, Löschen, Export, Stats) müssen weiterhin funktionieren.
   - Keine neuen Features einbauen.
   - Keine Routen ändern.

5. Bestehende Patterns nutzen:
   - `useUsersData()` für Datenladen (bereits optimiert mit React Query)
   - `user-service.ts` für CRUD (bereits vorhanden)
   - shadcn/ui Komponenten (Dialog, Card, Badge, etc.)
   - Maritime Design-Tokens aus `index.css` und `tailwind.config.ts`

6. Codequalität:
   - Entferne offensichtliche Duplikate.
   - Nutze bestehende UI-Komponenten & Design-System.
   - Keine neuen Bibliotheken einführen.

OUTPUT:
- Aufgeteilte Komponenten im neuen `src/components/users/` Modul.
- Neue Hooks für Users in `src/hooks/` (useUserFilters, useUserActions).
- `user-management.tsx` soll am Ende nur noch ein schlanker Einstiegspunkt sein oder vollständig ersetzt sein durch `UserManagementPage.tsx`.
- Alle bestehenden Flows funktionieren ohne Breaking Changes.

WICHTIG:
- Ändere KEINE Funktionalität.
- Halte dich an das bestehende Design-System (maritime Tokens).
- Keine neuen Dependencies.
- Nutze bestehende Hooks (`useUsersData`, `useUsers`) wo möglich.
```

---

## 4. Zusammenfassung & Priorisierung

| EPIC | Aufwand | Priorität | Status |
|------|---------|-----------|--------|
| S2-E1: Slot-Management Refactoring | 4-6h | HIGH | 🔜 Sprint 2 |
| S2-E2: Console.log Cleanup | 2-3h | MEDIUM | 🔜 Sprint 2 |
| S2-E3: Module-Registry | 1-2h | MEDIUM | 🔜 Sprint 2 |
| S2-E4: User-Management Refactoring | 4-6h | MEDIUM (BONUS) | 🔜 Sprint 2 |

**Empfohlene Reihenfolge:**
1. **S2-E3** (Module-Registry) → Schneller Win, schafft Klarheit
2. **S2-E2** (Console.log Cleanup) → Verbessert Code-Qualität massiv
3. **S2-E1** (Slot-Management) → Größter Architektur-Win
4. **S2-E4** (User-Management) → Wenn Zeit übrig (BONUS)

---

**Dokumenten-Version:** 1.0  
**Zuletzt aktualisiert:** 2025-11-30  
**Verantwortlich:** Architecture Team
