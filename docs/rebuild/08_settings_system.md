# KSVL Slot Manager - Settings System

## 1. Zentrale Settings-Tabelle: `app_settings`

```typescript
interface AppSetting {
  id: string;
  user_id: string | null;
  setting_key: string;
  setting_value: any; // JSONB
  is_global: boolean;
}
```

## 2. Wichtige Setting Keys

| Key | Typ | Beschreibung |
|-----|-----|--------------|
| `login_background` | Global | Login-Hintergrund |
| `dashboard-settings-template-{role}` | Global | Dashboard-Layout |
| `footer-settings-template-{role}` | Global | Footer-Menü |
| `slot-design-settings` | Global | Slot-Farben |
| `aiAssistantSettings` | Global | AI-Konfiguration |
| `consecutiveSlotsEnabled` | Global | Consecutive Slots |

## 3. useSettingsBatch Hook

```typescript
export function useSettingsBatch(options?: { enabled?: boolean }) {
  const { data: settingsMap, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settingsBatch,
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*');
      return new Map(data?.map(s => [s.setting_key, s.setting_value]));
    },
  });

  const getSetting = <T>(key: string, defaultValue: T): T => {
    return settingsMap?.get(key) ?? defaultValue;
  };

  const updateSetting = async (key: string, value: any, isGlobal = true) => {
    await supabase.from('app_settings').upsert({ setting_key: key, setting_value: value, is_global: isGlobal });
  };

  return { getSetting, updateSetting, isLoading };
}
```

## 4. Zod-Validierung

Alle Settings werden mit Zod-Schemas validiert (siehe `src/lib/settings-validation.ts`).

---

**Letzte Aktualisierung**: 2026-01-23
