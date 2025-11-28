# KSVL App - Foundation Audit

**Audit-Datum:** 2025-11-28  
**Audit-Typ:** Architektur & Modularitäts-Check  
**Foundation-Konformität:** 72/100

---

## Executive Summary

Die KSVL Web-App hat durch systematische Refactorings (Phase 1-3) eine **solide technische Basis** erreicht. Die Architektur zeigt klare Stärken in der Daten-Schicht (zentrale Hooks, Service-Layer) und im Design-System, weicht aber in der Strukturierung (fehlende Core-Trennung) und Navigation (keine Route-Registry) von der idealen "Foundation"-Architektur ab.

### 🎯 Gesamt-Score: 72/100

**Interpretation:**
- **70-80:** Solide Basis, aber strukturelle Verbesserungen empfohlen
- **80-90:** Foundation-ready, kleinere Optimierungen
- **90-100:** Full Foundation-Konformität

---

## Foundation-Scorecard

| **Kategorie**                  | **Score** | **Status** | **Trend** |
|--------------------------------|-----------|------------|-----------|
| **Struktur-Klarheit**          | 65/100    | ⚠️ Okay    | →         |
| **Modularität**                | 70/100    | ⚠️ Okay    | ↗️        |
| **Core-Schichten**             | 60/100    | ⚠️ Okay    | ↗️        |
| **CRUD-Schichtung**            | 75/100    | ✅ Gut     | ↗️        |
| **Navigation**                 | 50/100    | ❌ Schwach | →         |
| **Dokumentation**              | 65/100    | ⚠️ Okay    | ↗️        |
| **Wiederverwendung**           | 80/100    | ✅ Gut     | ✅        |
| **TypeScript & Types**         | 90/100    | ✅ Sehr gut | ✅        |
| **Design-System**              | 85/100    | ✅ Gut     | ✅        |
| **Performance (DB-Queries)**   | 90/100    | ✅ Sehr gut | ✅        |

**Gesamt-Durchschnitt:** 72/100

---

## Top 3 Stärken

### 1. 🟢 Zentrale Daten-Hooks (Score: 90/100)
**Beschreibung:**  
Die App nutzt `useUsersData()` und `useSettingsBatch()` als zentrale Datenquellen, wodurch **75-80% der redundanten DB-Queries eliminiert** wurden.

**Implementierung:**
- `useUsersData()`: Lädt User + Roles in einer Query, gecacht via React Query
- `useSettingsBatch()`: Lädt alle App-Settings in einer Batch-Query
- React Query Config: `staleTime: 5min`, `gcTime: 10min`

**Impact:**
- ✅ Massive Performance-Verbesserung (weniger DB-Calls)
- ✅ Konsistente Daten über alle Komponenten
- ✅ Single Source of Truth

**Best Practice:**
```typescript
// ✅ Gut: Zentrale Datenquelle nutzen
const { users } = useUsersData();
const user = users.find(u => u.id === userId);

// ❌ Vermeiden: Direkte Supabase-Query
const { data } = await supabase.from('profiles').select('*').eq('id', userId);
```

---

### 2. 🟢 Service-Layer für Users (Score: 80/100)
**Beschreibung:**  
`user-service.ts` kapselt alle User-CRUD-Operationen sauber via Edge Functions.

**Implementierung:**
```typescript
// src/lib/services/user-service.ts
class UserService {
  async createUser(data: CreateUserData) { /* ... */ }
  async updateUser(data: UpdateUserData) { /* ... */ }
  async deleteUser(userId: string) { /* ... */ }
  async updatePassword(data: UpdatePasswordData) { /* ... */ }
}
```

**Impact:**
- ✅ UI-Komponenten sind frei von Business-Logik
- ✅ Testbarkeit verbessert (Service kann gemockt werden)
- ✅ Edge-Function-Calls abstrahiert

**Nächste Schritte:**
- 🔥 Gleiches Pattern für Slots anwenden (`slot-service.ts`)
- 🔹 Optional: `file-service.ts` erstellen

---

### 3. 🟢 Design-System (Score: 85/100)
**Beschreibung:**  
Konsequenter Einsatz von Tailwind + shadcn/ui mit HSL-Variablen und Utility-Klassen.

**Implementierung:**
- **Farben:** HSL-Variablen in `index.css` (z.B. `--primary`, `--background`)
- **Utility-Klasse:** `.card-maritime-hero` (seit Phase 3)
- **Komponenten:** shadcn/ui konsequent genutzt

**Impact:**
- ✅ Konsistentes Look & Feel
- ✅ Theme-Switching einfach möglich
- ✅ Design-Änderungen zentral steuerbar

---

## Top 3 Schwächen

### 1. 🔴 Fehlender Slot-Service (Score: 50/100)
**Beschreibung:**  
CRUD-Logik für Slots liegt in `use-slots.tsx` (492 Zeilen), nicht in einem Service-Layer.

**Problem:**
- ❌ Hook enthält Business-Logik (sollte nur State-Management sein)
- ❌ Direkte Supabase-Calls in Hook
- ❌ Schwer testbar (Hook + DB-Logic vermischt)

**Aktueller Code:**
```typescript
// ❌ use-slots.tsx (Zeile 50-492)
export function useSlots() {
  const addSlot = async (slotData: CreateSlotData) => {
    const { data, error } = await supabase.from('slots').insert([{ /* ... */ }]);
    // ...
  };
  // ... 10+ weitere CRUD-Methoden
}
```

**Soll-Zustand:**
```typescript
// ✅ slot-service.ts (analog zu user-service.ts)
class SlotService {
  async createSlot(data: CreateSlotData) { /* Edge Function oder direkte DB */ }
  async updateSlot(id: string, updates: Partial<CreateSlotData>) { /* ... */ }
  // ...
}

// ✅ use-slots.tsx (nur React Query Wrapper)
export function useSlots() {
  return useQuery({
    queryKey: ['slots'],
    queryFn: () => slotService.getSlots(),
  });
}
```

**Impact:**
- 🔥 **HIGH PRIORITY** Refactoring
- Verbessert Testbarkeit und Wartbarkeit massiv

---

### 2. 🔴 Keine Navigation-Registry (Score: 50/100)
**Beschreibung:**  
Routen-Definitionen sind über `App.tsx` und `<Route>`-Komponenten verstreut. Es gibt keine zentrale Struktur, die:
- Alle App-Routen definiert
- Rollenbezogene Guards deklariert
- Menü-Items mit Routen verknüpft

**Problem:**
- ❌ Routen sind nicht an einer Stelle dokumentiert
- ❌ Route-Guards (z.B. "nur Admin") sind implizit in Komponenten
- ❌ Schwer zu überblicken: "Welche Routen gibt es? Wer darf was?"

**Aktueller Code:**
```typescript
// ❌ App.tsx: Routen verstreut
<Route path="/" element={<Index />} />
<Route path="/settings" element={<Settings />} />
<Route path="/dateimanager" element={<FileManager />} />
// ... keine Guards, keine Metadaten
```

**Soll-Zustand:**
```typescript
// ✅ src/lib/registry/routes.ts
export const ROUTES = {
  public: {
    login: { path: '/auth', component: 'Auth' },
    register: { path: '/register', component: 'Register' },
  },
  protected: {
    dashboard: { path: '/', component: 'Index', roles: ['*'] },
    users: { path: '/mitglieder', component: 'UserManagement', roles: ['admin', 'vorstand'] },
    slots: { path: '/slots', component: 'SlotManagement', roles: ['admin', 'kranfuehrer'] },
    fileManager: { path: '/dateimanager', component: 'FileManager', roles: ['admin'] },
    settings: { path: '/settings', component: 'Settings', roles: ['admin'] },
  },
};

// ✅ Guards-Komponente
<ProtectedRoute path="/mitglieder" requiredRoles={['admin', 'vorstand']}>
  <UserManagement />
</ProtectedRoute>
```

**Impact:**
- 🔥 **HIGH PRIORITY** Refactoring
- Verbessert Übersicht, Sicherheit, Dokumentation

---

### 3. 🔴 "God Components" (Score: 60/100)
**Beschreibung:**  
Einige Komponenten haben zu viele Verantwortlichkeiten (>400 Zeilen).

**Beispiele:**
- `slot-management.tsx` (627 Zeilen):
  - Liste + Filter + Kalender + Dialog + CRUD-Forms
- `user-management.tsx` (400+ Zeilen):
  - Liste + Filter + Detail-View + CRUD-Dialogs

**Problem:**
- ❌ Schwer wartbar (zu viele Verantwortlichkeiten in einer Datei)
- ❌ Schwer zu testen (viele Abhängigkeiten)
- ❌ Schwer zu refactoren (Änderungen betreffen viele Bereiche)

**Soll-Zustand:**
```
// ✅ Aufteilen in kleinere Komponenten
/components/slots/
  - slot-list.tsx (Liste + Pagination)
  - slot-filters.tsx (Filter-UI)
  - slot-calendar.tsx (Kalender-Ansicht)
  - slot-form-dialog.tsx (CRUD-Dialog)
  - slot-management.tsx (Orchestrierung, <200 Zeilen)
```

**Impact:**
- 🔹 **MEDIUM PRIORITY** Refactoring
- Verbessert Wartbarkeit und Testbarkeit

---

## Priorisierte Empfehlungen

### 🔥 HIGH PRIORITY (sofort umsetzen)

#### 1. Slot-Service erstellen
**Ziel:** CRUD-Logik aus `use-slots.tsx` in `slot-service.ts` extrahieren

**Schritte:**
1. Neue Datei: `src/lib/services/slot-service.ts`
2. Methoden implementieren (analog zu `user-service.ts`):
   - `createSlot(data: CreateSlotData)`
   - `updateSlot(id: string, updates: Partial<CreateSlotData>)`
   - `deleteSlot(id: string)`
   - `bookSlot(slotId: string, memberId: string)`
   - `cancelBooking(slotId: string)`
3. `use-slots.tsx` refactoren:
   - Service-Methoden aufrufen statt direkter Supabase-Calls
   - Hook auf React-Query-Wrapper reduzieren

**Aufwand:** ~2-3h  
**Impact:** Testbarkeit ↑, Wartbarkeit ↑, Foundation-Score +10

---

#### 2. Navigation-Registry erstellen
**Ziel:** Zentrale Route-Definitionen mit Rollen-Guards

**Schritte:**
1. Neue Datei: `src/lib/registry/routes.ts`
   ```typescript
   export const ROUTES = {
     public: { login: '/auth', register: '/register' },
     protected: {
       dashboard: { path: '/', roles: ['*'] },
       users: { path: '/mitglieder', roles: ['admin', 'vorstand'] },
       slots: { path: '/slots', roles: ['admin', 'kranfuehrer'] },
       fileManager: { path: '/dateimanager', roles: ['admin'] },
       settings: { path: '/settings', roles: ['admin'] },
     },
   };
   ```
2. Guards-Komponente erstellen: `<ProtectedRoute requiredRoles={...}>`
3. `App.tsx` refactoren: Routen aus Registry generieren

**Aufwand:** ~2-3h  
**Impact:** Sicherheit ↑, Übersicht ↑, Foundation-Score +10

---

#### 3. Role-Switching optimieren
**Ziel:** Role-Switching in `use-role.tsx` via `useUsersData()` Cache

**Problem:**
- Aktuell: Direkte Supabase-Query beim Rollenwechsel (Zeile 115-127)
- Soll: User aus `useUsersData()` Cache laden

**Schritte:**
1. In `use-role.tsx`:
   ```typescript
   // ❌ Aktuell
   const { data: roleUser } = await supabase
     .from('profiles')
     .select('*')
     .eq('is_role_user', true)
     .eq('roles', role)
     .single();

   // ✅ Soll
   const { users } = useUsersData({ enabled: true });
   const roleUser = users.find(u => u.is_role_user && u.roles.includes(role));
   ```

**Aufwand:** ~1h  
**Impact:** Performance ↑, Konsistenz ↑, Foundation-Score +5

---

### 🔹 MEDIUM PRIORITY (kurzfristig)

#### 4. "God Components" aufteilen
**Ziel:** `slot-management.tsx` und `user-management.tsx` in kleinere Komponenten refactoren

**Beispiel: slot-management.tsx (627 Zeilen)**
```
Vorher:
- slot-management.tsx (627 Zeilen: Liste + Filter + Kalender + Dialog + CRUD)

Nachher:
- slot-list.tsx (Liste + Pagination)
- slot-filters.tsx (Filter-UI)
- slot-calendar.tsx (Kalender-Ansicht)
- slot-form-dialog.tsx (CRUD-Dialog)
- slot-management.tsx (Orchestrierung, <200 Zeilen)
```

**Aufwand:** ~4-6h  
**Impact:** Wartbarkeit ↑, Testbarkeit ↑, Foundation-Score +5

---

#### 5. Supabase-Calls in Komponenten abstrahieren
**Ziel:** Direkte Supabase-Imports in UI-Komponenten eliminieren

**Beispiele:**
- `file-manager/*`: Direkte Storage-Calls → File-Service
- Vereinzelte Komponenten mit direkten DB-Calls

**Aufwand:** ~2-3h  
**Impact:** Separation of Concerns ↑, Foundation-Score +5

---

#### 6. Module-Registry erstellen
**Ziel:** Zentrale Metadaten für alle App-Module

**Schritte:**
1. Neue Datei: `src/lib/registry/modules.ts`
   ```typescript
   export interface AppModule {
     id: string;
     name: string;
     type: 'core' | 'domain' | 'support';
     routes: string[];
     lifecycle: 'draft' | 'stable' | 'frozen';
     docsPath?: string;
   }

   export const MODULES: AppModule[] = [
     {
       id: 'auth',
       name: 'Authentication',
       type: 'core',
       routes: ['/auth'],
       lifecycle: 'stable',
       docsPath: 'docs/modules/auth.md',
     },
     // ...
   ];
   ```

**Aufwand:** ~1-2h  
**Impact:** Dokumentation ↑, Modularität ↑, Foundation-Score +5

---

### 🔷 LOW PRIORITY (langfristig)

#### 7. `/core` Verzeichnis einführen
**Ziel:** Foundation-konforme Ordnerstruktur

**Schritte:**
1. Neue Ordner anlegen:
   ```
   /src/core
     /auth       (AuthContext, Guards)
     /db         (DB-Abstraction Layer)
     /api        (Service-Layer: user-service, slot-service)
     /navigation (Route-Registry, Menu-Config)
     /errors     (ErrorBoundary, Error-Handling)
     /registry   (modules.ts, routes.ts)
   ```
2. Schrittweise Migration:
   - `auth-context.tsx` → `/core/auth`
   - `user-service.ts`, `slot-service.ts` → `/core/api`
   - `routes.ts` → `/core/navigation`

**Aufwand:** ~6-8h (iterativ über mehrere Sprints)  
**Impact:** Struktur ↑, Foundation-Konformität ↑, Foundation-Score +15

---

#### 8. File-Service erstellen
**Ziel:** CRUD-Logik für File-Manager in Service auslagern

**Analog zu:** Slot-Service (siehe HIGH PRIORITY #1)

**Aufwand:** ~2-3h  
**Impact:** Separation of Concerns ↑, Foundation-Score +3

---

## Coupling & Wiederverwendung

### Positive Beispiele (Shared Modules)
✅ **useUsersData()** → Von 3 Hooks genutzt (useUsers, useRole, useProfileData)  
✅ **useSettingsBatch()** → Von 10+ Settings-Hooks genutzt  
✅ **realtime-manager.ts** → Von allen Realtime-Hooks genutzt  
✅ **user-service.ts** → Von useUsers genutzt, testbar  

### Kandidaten für Shared Modules
🔹 **Pagination/Filter-Logik** → Wiederholt in `user-management.tsx`, `slot-management.tsx`  
   - **Empfehlung:** `usePagination()`, `useTableFilters()` Hooks erstellen

🔹 **CRUD-Dialog-Pattern** → Ähnliche Dialoge in mehreren Modulen  
   - **Empfehlung:** `<CrudDialog>` Shared-Komponente

🔹 **List + Detail Pattern** → Wiederholt in User-, Slot-, File-Management  
   - **Empfehlung:** `<ListDetailLayout>` Shared-Komponente

---

## Modulabhängigkeiten (Coupling-Analyse)

### Aktuelle Abhängigkeiten
```
UI-Komponenten
  ↓ importiert
Hooks (use-users, use-slots, use-settings)
  ↓ ruft auf
Services (user-service) + Direkte Supabase-Calls
  ↓ nutzt
Supabase Client
```

### Probleme
❌ **Zirkuläre Abhängigkeiten:** Keine gefunden (gut!)  
⚠️ **Direkte Supabase-Imports in Hooks:**
   - `use-slots.tsx`: Direkter Supabase-Zugriff
   - `use-file-manager.tsx`: Direkter Storage-Zugriff

### Empfehlungen
🔹 **Service-Layer durchgehend einführen:**
```
UI → Hooks → Services → Supabase
```

---

## Nächste Schritte (Roadmap)

### Sprint 1 (HIGH PRIORITY, ~1 Woche)
- [ ] Slot-Service erstellen (`slot-service.ts`)
- [ ] Navigation-Registry erstellen (`lib/registry/routes.ts`)
- [ ] Role-Switching via `useUsersData()` optimieren

**Erwartetes Ergebnis:** Foundation-Score +25 → **~97/100**

---

### Sprint 2 (MEDIUM PRIORITY, ~1-2 Wochen)
- [ ] `slot-management.tsx` aufteilen (God-Component → 5 Komponenten)
- [ ] `user-management.tsx` aufteilen
- [ ] Direkte Supabase-Calls in Komponenten eliminieren
- [ ] Module-Registry erstellen (`lib/registry/modules.ts`)

**Erwartetes Ergebnis:** Foundation-Score +15 → **~85/100** (ohne Sprint 1)

---

### Sprint 3+ (LOW PRIORITY, langfristig)
- [ ] `/core` Verzeichnis einführen (iterativ)
- [ ] File-Service erstellen (`file-service.ts`)
- [ ] Shared-Komponenten/Hooks für Pagination, Filter, CRUD-Dialogs
- [ ] Modul-Dokumentation vervollständigen

**Erwartetes Ergebnis:** Foundation-Score +10 → **~90-95/100** (Full Foundation)

---

## Vergleich: Aktueller Stand vs. Full Foundation

| **Aspekt**               | **Aktuell (72/100)** | **Full Foundation (90-95/100)** |
|--------------------------|----------------------|---------------------------------|
| **Core-Ordner**          | ❌ Fehlt             | ✅ `/core` mit auth, db, api    |
| **Service-Layer**        | ⚠️ Nur User          | ✅ User, Slot, File             |
| **Navigation-Registry**  | ❌ Fehlt             | ✅ `routes.ts` + Guards         |
| **God-Components**       | ⚠️ Vorhanden (2)     | ✅ Aufgeteilt (<200 Zeilen)     |
| **Module-Registry**      | ❌ Fehlt             | ✅ `modules.ts`                 |
| **CRUD-Kapselung**       | ⚠️ Gemischt          | ✅ 100% in Services             |
| **Dokumentation**        | ⚠️ Health-Checks     | ✅ + Architecture + Modules     |

---

## Zusammenfassung für Management

**Status:** Die KSVL-App hat eine **solide technische Basis** (72/100) mit starken Daten-Hooks und Service-Layer für Users. Um Foundation-ready zu werden, sind **3 Haupt-Refactorings** nötig:

1. **Slot-Service** (HIGH) → CRUD aus Hook extrahieren
2. **Navigation-Registry** (HIGH) → Zentrale Route-/Guard-Definition
3. **God-Components aufteilen** (MEDIUM) → Wartbarkeit verbessern

**Aufwand:** ~1-2 Wochen (1 Entwickler)  
**ROI:** Wartbarkeit ↑, Testbarkeit ↑, Onboarding neuer Entwickler ↑

---

**Audit durchgeführt von:** Architecture Team  
**Nächste Review:** Nach Sprint 1 (ca. 1 Woche)  
**Kontakt:** siehe `docs/architecture/ksvl_architecture_overview.md`
