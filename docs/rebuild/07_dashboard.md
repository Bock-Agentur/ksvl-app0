# KSVL Slot Manager - Dashboard & Widgets

## 1. Dashboard-Struktur

Das Dashboard zeigt rollenbasierte Widgets und Sections in einem konfigurierbaren Grid-Layout.

## 2. Widgets

| Widget | Komponente | Rollen |
|--------|------------|--------|
| Wetter | WeatherWidget | Alle |
| Harbor Chat | HarborChatWidget | Alle |
| Mitglieder-Stats | MemberStatsWidget | admin, vorstand |
| Events-Kalender | EventsCalendarWidget | Alle |
| Hafen-Status | HarborStatusWidget | admin, vorstand |
| Wartungs-Alerts | MaintenanceAlertsWidget | admin |
| Finanz-Übersicht | FinanceOverviewWidget | admin, vorstand |

## 3. useDashboardSettings Hook

```typescript
export function useDashboardSettings() {
  const { currentRole } = useRole();
  const { getSetting, updateSetting } = useSettingsBatch();
  
  const settings = getSetting(`dashboard-settings-template-${currentRole}`, DEFAULT_SETTINGS);
  
  return {
    items: settings.items,
    updateLayout: (newItems) => updateSetting(`dashboard-settings-template-${currentRole}`, { items: newItems }),
  };
}
```

## 4. Harbor Chat (AI-Assistent)

- Model: `google/gemini-2.5-flash`
- Tonalität pro Rolle konfigurierbar
- Zugriff auf Slot- und Mitgliederdaten
- Edge Function: `harbor-chat`

---

**Letzte Aktualisierung**: 2026-01-23
