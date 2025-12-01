# KSVL App – Data Flow Optimization

**Datum:** 2025-12-01  
**Status:** Abgeschlossen

## Zusammenfassung

Diese Dokumentation beschreibt die durchgeführten Optimierungen zur Vereinfachung der Datenflüsse und Eliminierung von doppelten Datenaufrufen in der KSVL App.

---

## Durchgeführte Optimierungen

### 1. Profil-Datenaufrufe konsolidiert (High Priority)

**Problem:** 3 Chat-Widgets machten bei jeder Nachricht separate DB-Queries für Profildaten.

**Betroffene Dateien:**
- `src/components/dashboard-header.tsx`
- `src/components/dashboard-widgets/harbor-chat-widget.tsx`
- `src/components/dashboard-widgets/ai-chat-mini-widget.tsx`

**Lösung:** Alle Widgets nutzen jetzt `useProfileData()` Hook, der gecachte Profildaten aus React Query liefert.

**Ergebnis:** 
- ✅ -3 DB-Queries pro Chat-Nachricht
- ✅ Einheitliches Caching über React Query

---

### 2. Slot-Datenzugriff vereinheitlicht (High Priority)

**Problem:** Zwei parallele Slot-Loading-Mechanismen existierten:
- `useSlots` Hook mit eigenem `useState` und Realtime-Subscription
- `SlotsContext` mit React Query und eigener Realtime-Subscription

**Betroffene Dateien:**
- `src/hooks/core/data/use-slots.tsx`
- `src/contexts/slots-context.tsx`

**Lösung:** `useSlots` wurde zu einem Bridge-Hook konvertiert, der intern `useSlotsContext` nutzt.

**Ergebnis:**
- ✅ ~320 Zeilen → 52 Zeilen Code-Reduktion
- ✅ -1 Realtime-Subscription (nur noch eine in SlotsContext)
- ✅ Einheitlicher React Query Cache für alle Slot-Daten
- ✅ API-Kompatibilität erhalten

---

### 3. Settings-Direktzugriffe migriert (Mid Priority)

**Problem:** Komponenten machten direkte Supabase-Aufrufe für `app_settings` statt zentrale Hooks zu nutzen.

**Betroffene Dateien:**
- `src/components/consecutive-slots-settings.tsx` → `role_switching_enabled`
- `src/components/test-data-manager.tsx` → `hide_test_data`

**Lösung:** Migration zu `useAppSettings` Hook mit automatischem Caching.

**Ergebnis:**
- ✅ ~100 Zeilen direkter Supabase-Calls eliminiert
- ✅ Einheitliches Settings-Caching
- ✅ Konsistente Error-Handling

---

### 4. Harbor-Chat-Data konsolidiert (Low Priority)

**Problem:** `useHarborChatData` hatte eigene React Query für `aiAssistantSettings`.

**Betroffene Dateien:**
- `src/hooks/core/data/use-harbor-chat-data.tsx`

**Lösung:** Nutzt jetzt intern `useAIAssistantSettings`, das bereits über `useSettingsBatch` gecacht ist.

**Ergebnis:**
- ✅ Eliminierte doppelte Query für AI-Settings
- ✅ Einheitlicher Cache-Key

---

## Simplified Data Flow Plan

### Architektur-Prinzipien

```
┌─────────────────────────────────────────────────────────────┐
│                        COMPONENTS                           │
│  (Pages, Widgets, UI Components)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ nutzen
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     HOOKS (Bridge Layer)                    │
│  useSlots, useUsers, useProfileData, useAppSettings, etc.  │
│  - API-Stabilität für Komponenten                          │
│  - Delegation an Context/Services                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ delegieren an
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONTEXTS & SERVICES                         │
│  SlotsContext, AuthContext, slotService, userService       │
│  - Single Source of Truth                                  │
│  - React Query Caching                                     │
│  - Realtime-Subscriptions                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ kommunizieren mit
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE                                │
│  Database, Auth, Storage, Edge Functions                   │
└─────────────────────────────────────────────────────────────┘
```

### Daten-Domain → Empfohlene Quelle

| Domain | Single Source of Truth | Hooks |
|--------|------------------------|-------|
| **User/Profiles** | `useUsersData` | `useUsers`, `useProfileData` |
| **Slots** | `SlotsContext` | `useSlots`, `useSlotsContext` |
| **Settings** | `useSettingsBatch` | `useAppSettings`, `useDashboardSettings`, etc. |
| **Files** | `useFileManager` | `useFilePermissions` |
| **Auth** | `AuthContext` | `useRole`, `usePermissions` |

### Best Practices

1. **Keine direkten Supabase-Calls in Komponenten** – Immer über Hooks/Services
2. **React Query für alle Daten-Fetching** – Automatisches Caching
3. **Ein Realtime-Subscription pro Domain** – Vermeidet doppelte Updates
4. **Bridge-Hooks für API-Stabilität** – Komponenten ändern sich nicht bei internen Refactorings

---

## Metriken

| Metrik | Vorher | Nachher | Verbesserung |
|--------|--------|---------|--------------|
| DB-Queries pro Chat-Nachricht | 4 | 1 | -75% |
| Realtime-Subscriptions (Slots) | 2 | 1 | -50% |
| Zeilen Code (use-slots.tsx) | ~320 | ~52 | -84% |
| Direkte app_settings Aufrufe | 4 | 0 | -100% |

---

## Nächste Schritte (Optional)

- [ ] Query-Keys dokumentieren in `docs/query-keys.md`
- [ ] Bridge-Files langfristig entfernen nach vollständiger Import-Migration
- [ ] Lazy-Loading für Tab-spezifische Daten in Index.tsx
