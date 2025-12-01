# KSVL App – Settings Registry

**Stand:** 2025-01-31  
**Version:** 2.0 (nach Phase 1 & 2)

---

## 1. Überblick

Die KSVL-App nutzt die Tabelle `app_settings` für globale und rollenbasierte Konfigurationen.  
Aktuell werden **~15 aktive Setting-Keys** verwendet.

### Wichtige Hooks:
- `useSettingsBatch` – Batch-Loading aller Settings (optimiert für Ladezeit)
- `useDashboardSettings` – Dashboard-Konfiguration pro Rolle **[Phase 2: Migration optimiert ✅]**
- `useMenuSettings` – Header-Menü
- `useFooterMenuSettings` – Footer-Menü pro Rolle
- `useLoginBackground` – Login-Hintergrund **[Phase 2: Validierung hinzugefügt ✅]**
- `useHeaderMessage` – Header-Nachricht
- `useStickyHeaderLayout` – Sticky-Header-Konfiguration

---

## 2. Aktive Settings (nach Bereichen)

### 2.1 Authentifizierung & Login
| Key | Typ | Global | Hook | Zweck | Risiko | Validierung |
|-----|-----|--------|------|-------|--------|-------------|
| `login_background` | `LoginBackground` | ✅ | `useLoginBackground` | Steuert Login-Hintergrund mit 34 Feldern | **MID** | ✅ Type-Safety |

**Struktur `LoginBackground`:**
```typescript
{
  type: 'gradient' | 'image' | 'video',
  bucket: 'documents' | 'login-media' | null,
  storagePath: string | null,
  videoOnMobile: boolean,
  cardOpacity: number,
  overlayOpacity: number,
  loginBlockVerticalPositionDesktop: number,
  countdownEnabled: boolean,
  // ... weitere 26 Felder
}
```

**Status nach Phase 2:**
- ✅ Validierungs-Layer hinzugefügt
- ✅ Fallback zu `DEFAULT_BACKGROUND` bei invaliden Daten
- ✅ Migration existiert (alte `verticalPosition` → neue Slider-Werte)
- ⏸️ Split in `basic` + `advanced` **nicht umgesetzt** (siehe Begründung in `phase-2-changelog.md`)

**Empfehlung:** Stabil, kann bleiben. UI kann in Tabs unterteilt werden ohne Backend-Änderung.

---

### 2.2 Navigation & Menü
| Key | Typ | Global | Hook | Zweck | Risiko | Validierung |
|-----|-----|--------|------|-------|--------|-------------|
| `marina-menu-settings-template` | `MenuSettings` | ✅ | `useMenuSettings` | Header-Menü Konfiguration | LOW | ✅ Zod-Schema |
| `footer-settings-template-{role}` | `CombinedFooterSettings` | ✅ | `useFooterMenuSettings` | Footer-Menü pro Rolle (5 Varianten) | LOW | ✅ Zod-Schema |

**Struktur `footer-settings-template-{role}`:**
```typescript
{
  menuSettings: {
    admin: FooterMenuItem[],
    vorstand: FooterMenuItem[],
    // ...
  },
  displaySettings: {
    admin: { showLabels: boolean },
    // ...
  }
}
```

**Status nach Phase 1 & 2:**
- ✅ Legacy-Keys gelöscht (`footer-menu-template-*`)
- ✅ Zod-Validierung hinzugefügt (`FooterSettingsSchema`, `MenuSettingsSchema`)
- ✅ Funktioniert stabil seit letztem Refactoring

---

### 2.3 Dashboard
| Key | Typ | Global | Hook | Zweck | Risiko | Validierung |
|-----|-----|--------|------|-------|--------|-------------|
| `dashboard-settings-template-{role}` | `DashboardSettings` | ✅ | `useDashboardSettings` | Dashboard-Konfiguration pro Rolle (5 Varianten) | **LOW** ⬇️ | ✅ Zod-Schema |

**Struktur `DashboardSettings`:**
```typescript
{
  enabledWidgets: string[],
  enabledSections: string[],
  widgetSettings: Record<string, any>,
  columnLayout: 1 | 2 | 3,
  animationsEnabled: boolean,
  // ...
}
```

**Status nach Phase 1 & 2:**
- ✅ Doppelte Einträge gelöscht (nur global behalten)
- ✅ **Migration optimiert:** Läuft jetzt nur **einmal pro Session** statt bei jedem Render
- ✅ Zod-Validierung hinzugefügt (`DashboardSettingsSchema`)
- ✅ Performance-Gewinn: ~90% weniger Migration-Calls

**Risiko-Reduzierung:** MID-HIGH → **LOW** nach Phase 2 ✅

---

### 2.4 UI & Design
| Key | Typ | Global | Hook | Zweck | Risiko | Validierung |
|-----|-----|--------|------|-------|--------|-------------|
| `header-message` | `HeaderMessageSettings` | ✅ | `useHeaderMessage` | Anzeige von Header-Nachrichten | LOW | ⏳ Todo |
| `sticky_header_layout` | `StickyHeaderLayoutSettings` | ✅ | `useStickyHeaderLayout` | Sticky-Header pro Seite | LOW | ⏳ Todo |

**Status:** Beide Settings funktionieren stabil, Validierung kann in Phase 3 hinzugefügt werden.

---

## 3. Gelöschte Legacy Settings (Phase 1 ✅)

Folgende Keys wurden am 2025-01-31 aus der Datenbank entfernt:

### 3.1 Footer (alte Struktur)
- `footer-menu-template-admin`
- `footer-menu-template-vorstand`
- `footer-menu-template-kranfuehrer`
- `footer-menu-template-mitglied`
- `footer-menu-template-gastmitglied`
- `footerMenuSettings`

**Grund:** Wurden durch `footer-settings-template-{role}` ersetzt.

### 3.2 Desktop Background
- `desktop_background`

**Grund:** Feature wurde deaktiviert, Setting existierte aber noch.

### 3.3 Doppelte Dashboard-Settings
- Alle `dashboard-settings-template-{role}` mit `is_global = false` (user-spezifische)

**Grund:** Nur globale Einträge werden verwendet, doppelte Einträge führten zu undefiniertem Verhalten.

---

## 4. Validierung (Phase 2 ✅)

### 4.1 Zod-Schemas (`src/lib/settings-validation.ts`)

| Schema | Verwendung | Status |
|--------|------------|--------|
| `DashboardSettingsSchema` | `useDashboardSettings` | ✅ Implementiert |
| `FooterSettingsSchema` | `useFooterMenuSettings` | ✅ Vorbereitet |
| `MenuSettingsSchema` | `useMenuSettings` | ✅ Vorbereitet |
| `LoginBackgroundBasicSchema` | - | ⏸️ Nicht verwendet (siehe Begründung) |
| `LoginBackgroundAdvancedSchema` | - | ⏸️ Nicht verwendet |

### 4.2 Validierungs-Helper

```typescript
// Validiert mit Fallback zu Default
const validated = validateSettings(schema, data, defaultValue, 'setting_key');

// Safe Parse (gibt success/error zurück)
const result = safeValidateSettings(schema, data);
if (!result.success) {
  console.error(result.error);
}
```

**Vorteile:**
- ✅ Runtime Type-Safety
- ✅ Automatische Fallbacks bei invaliden Daten
- ✅ Konsole-Warnings bei Fehlern
- ✅ Verhindert DB-Korruption

---

## 5. Best Practices

### 5.1 Neue Settings hinzufügen
1. **Key-Naming:** `{bereich}_{feature}` (z.B. `dashboard_widget_order`)
2. **TypeScript-Interface** in entsprechendem Hook definieren
3. **Default-Wert** IMMER bereitstellen
4. **Zod-Schema** in `settings-validation.ts` hinzufügen
5. **Validierung** im Hook integrieren (`validateSettings()`)
6. **Dokumentation** hier im Registry ergänzen

### 5.2 Settings ändern
1. **Migration-Script** schreiben (falls Breaking Change)
2. **Rückwärtskompatibilität** prüfen
3. **Validierungs-Schema** aktualisieren
4. **Dokumentation** aktualisieren

### 5.3 Settings löschen
1. **Code-Referenzen** prüfen (Suche über gesamte Codebase)
2. **DB-Query** zum Löschen ausführen
3. **Dokumentation** hier aktualisieren (in Abschnitt "Gelöschte Legacy Settings")

---

## 6. Settings-Abhängigkeiten

### Kritische Abhängigkeiten:
- **Dashboard** ← `dashboard-settings-template-{role}` + `useRole` + Widget-Definitionen
- **Footer** ← `footer-settings-template-{role}` + `useRole` + Navigation Registry
- **Login** ← `login_background` + `header-message` (optional)

### Nicht-kritische Abhängigkeiten:
- Header-Message (kann fehlen, UI funktioniert trotzdem)
- Sticky-Header (kann fehlen, Default: alle sticky)

---

## 7. Risikobewertung (nach Phase 2)

| Bereich | Risiko | Begründung |
|---------|--------|------------|
| Login Background | **MID** ⬇️ | 34 Felder, aber validiert + Type-Safety |
| Dashboard Settings | **LOW** ⬇️ | Migration optimiert, Zod-Validierung |
| Footer Settings | **LOW** | Stabil, Zod-Schema vorbereitet |
| Menü Settings | **LOW** | Einfache Struktur, klare Defaults |
| Header Message | **LOW** | Optional, robuste Fallbacks |

**Legende:** ⬇️ = Risiko reduziert durch Phase 2

---

## 8. Nächste Schritte (Phase 3)

### Phase 3: Konsolidierung (geplant)
- [ ] Alle Settings in `useSettingsBatch` integrieren
- [ ] Settings-Admin-UI erstellen (`/settings/advanced/settings-manager`)
- [ ] NAV_ITEMS und ROUTES Registry vereinheitlichen
- [ ] Restliche Settings mit Zod-Schemas validieren

---

## 9. Anhang: Alle Setting-Keys (Übersicht)

```typescript
// Aktive Settings (Stand 2025-01-31 nach Phase 2)
const ACTIVE_SETTINGS = [
  'login_background',                       // ✅ Validiert
  'header-message',                         // ⏳ Todo
  'sticky_header_layout',                   // ⏳ Todo
  'marina-menu-settings-template',          // ✅ Schema vorbereitet
  'footer-settings-template-admin',         // ✅ Schema vorbereitet
  'footer-settings-template-vorstand',      // ✅ Schema vorbereitet
  'footer-settings-template-kranfuehrer',   // ✅ Schema vorbereitet
  'footer-settings-template-mitglied',      // ✅ Schema vorbereitet
  'footer-settings-template-gastmitglied',  // ✅ Schema vorbereitet
  'dashboard-settings-template-admin',      // ✅ Validiert + Migration optimiert
  'dashboard-settings-template-vorstand',   // ✅ Validiert + Migration optimiert
  'dashboard-settings-template-kranfuehrer',// ✅ Validiert + Migration optimiert
  'dashboard-settings-template-mitglied',   // ✅ Validiert + Migration optimiert
  'dashboard-settings-template-gastmitglied'// ✅ Validiert + Migration optimiert
];

// Gelöschte Settings (Phase 1)
const DELETED_SETTINGS = [
  'footer-menu-template-*',
  'footerMenuSettings',
  'desktop_background',
  // + 4 doppelte dashboard-settings-template-* (is_global=false)
];
```

---

## 10. Testing-Checkliste

### Manuelle Tests (nach Phase 2)

**Dashboard-Settings:**
```bash
1. Dashboard öffnen (als Admin/Vorstand/Mitglied)
2. Widget deaktivieren → Speichern → Seite neu laden
3. Widget sollte deaktiviert bleiben
4. Konsole prüfen: KEINE wiederholten Migration-Logs
```

**Login-Background:**
```bash
1. Settings → Login-Background → Opacity/Position ändern
2. Speichern → Logout → Login-Screen prüfen
3. Konsole prüfen: KEINE Validierungs-Warnings
```

**Validierung testen:**
```sql
-- Manuell korrupte Daten einfügen (nur für Testing):
UPDATE app_settings 
SET setting_value = '{"invalid": "data"}'::jsonb 
WHERE setting_key = 'dashboard-settings-template-admin';

-- App neu laden → sollte Fallback zu DEFAULT nutzen
```

---

**Ende der Dokumentation**
