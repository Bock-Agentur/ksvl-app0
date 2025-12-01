# KSVL App – Settings Registry

**Stand:** 2025-01-31  
**Zweck:** Zentrale Dokumentation aller `app_settings` Keys, ihrer Verwendung und Abhängigkeiten.

---

## 1. Überblick

Die KSVL-App nutzt die Tabelle `app_settings` für globale und rollenbasierte Konfigurationen.  
Aktuell werden **~15 aktive Setting-Keys** verwendet.

### Wichtige Hooks:
- `useSettingsBatch` – Batch-Loading aller Settings (optimiert für Ladezeit)
- `useDashboardSettings` – Dashboard-Konfiguration pro Rolle
- `useMenuSettings` – Header-Menü
- `useFooterMenuSettings` – Footer-Menü pro Rolle
- `useLoginBackground` – Login-Hintergrund
- `useHeaderMessage` – Header-Nachricht
- `useStickyHeaderLayout` – Sticky-Header-Konfiguration

---

## 2. Aktive Settings (nach Bereichen)

### 2.1 Authentifizierung & Login
| Key | Typ | Global | Hook | Zweck | Risiko |
|-----|-----|--------|------|-------|--------|
| `login_background` | `LoginBackgroundSettings` | ✅ | `useLoginBackground` | Steuert Login-Hintergrund (Bild/Video/Gradient) mit 30+ Feldern | **HIGH** |

**Struktur `LoginBackgroundSettings`:**
```typescript
{
  mode: 'image' | 'video' | 'gradient' | 'none',
  backgroundImage?: string,
  backgroundVideo?: string,
  gradientColors?: string[],
  overlayOpacity?: number,
  animationEnabled?: boolean,
  // ... weitere 20+ Felder
}
```

**Problem:** Zu komplex, sollte aufgeteilt werden.  
**Empfehlung:** In Phase 2 in `login_background_basic` + `login_background_advanced` splitten.

---

### 2.2 Navigation & Menü
| Key | Typ | Global | Hook | Zweck | Risiko |
|-----|-----|--------|------|-------|--------|
| `marina-menu-settings-template` | `MenuSettings` | ✅ | `useMenuSettings` | Header-Menü Konfiguration | LOW |
| `footer-settings-template-{role}` | `CombinedFooterSettings` | ✅ | `useFooterMenuSettings` | Footer-Menü pro Rolle (5 Varianten) | MID |

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

**Status:** Funktioniert stabil seit letztem Refactoring.  
**Empfehlung:** Legacy-Keys (`footer-menu-template-*`) sind bereits gelöscht (Phase 1). ✅

---

### 2.3 Dashboard
| Key | Typ | Global | Hook | Zweck | Risiko |
|-----|-----|--------|------|-------|--------|
| `dashboard-settings-template-{role}` | `DashboardSettings` | ✅ | `useDashboardSettings` | Dashboard-Konfiguration pro Rolle (5 Varianten) | **MID-HIGH** |

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

**Problem:** 
- Migration-Logik läuft bei jedem Render (`useMemo`)
- Doppelte Einträge (global + user-specific) wurden konsolidiert (Phase 1) ✅

**Empfehlung:** Migration in Phase 2 nur einmalig ausführen.

---

### 2.4 UI & Design
| Key | Typ | Global | Hook | Zweck | Risiko |
|-----|-----|--------|------|-------|--------|
| `header-message` | `HeaderMessageSettings` | ✅ | `useHeaderMessage` | Anzeige von Header-Nachrichten | LOW |
| `sticky_header_layout` | `StickyHeaderLayoutSettings` | ✅ | `useStickyHeaderLayout` | Sticky-Header pro Seite | LOW |

**Status:** Beide Settings funktionieren stabil.

---

### 2.5 Sonstige
| Key | Typ | Global | Hook | Zweck | Risiko |
|-----|-----|--------|------|-------|--------|
| Weitere Settings nach Bedarf | - | - | - | - | - |

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

## 4. Best Practices

### 4.1 Neue Settings hinzufügen
1. **Key-Naming:** `{bereich}_{feature}` (z.B. `dashboard_widget_order`)
2. **TypeScript-Interface** in entsprechendem Hook definieren
3. **Default-Wert** IMMER bereitstellen
4. **Fallback-Logik** bei fehlenden/fehlerhaften Settings
5. **Dokumentation** hier im Registry ergänzen

### 4.2 Settings ändern
1. **Migration-Script** schreiben (falls Breaking Change)
2. **Rückwärtskompatibilität** prüfen
3. **Dokumentation** aktualisieren

### 4.3 Settings löschen
1. **Code-Referenzen** prüfen (Suche über gesamte Codebase)
2. **DB-Query** zum Löschen ausführen
3. **Dokumentation** hier aktualisieren (in Abschnitt "Gelöschte Legacy Settings")

---

## 5. Settings-Abhängigkeiten

### Kritische Abhängigkeiten:
- **Dashboard** ← `dashboard-settings-template-{role}` + `useRole` + Widget-Definitionen
- **Footer** ← `footer-settings-template-{role}` + `useRole` + Navigation Registry
- **Login** ← `login_background` + `header-message` (optional)

### Nicht-kritische Abhängigkeiten:
- Header-Message (kann fehlen, UI funktioniert trotzdem)
- Sticky-Header (kann fehlen, Default: alle sticky)

---

## 6. Risikobewertung

| Bereich | Risiko | Begründung |
|---------|--------|------------|
| Login Background | **HIGH** | 30+ Felder in einem Setting, keine Schema-Validierung |
| Dashboard Settings | **MID-HIGH** | Komplexe Struktur, Migration bei jedem Render |
| Footer Settings | **MID** | Stabil, aber 5 separate Keys pro Rolle |
| Menü Settings | **LOW** | Einfache Struktur, klare Defaults |
| Header Message | **LOW** | Optional, robuste Fallbacks |

---

## 7. Nächste Schritte (Phase 2 & 3)

### Phase 2: Vereinfachung (geplant)
- [ ] Login-Background in 2 Settings aufteilen
- [ ] Dashboard-Migration nur einmalig ausführen
- [ ] Zod-Schema-Validierung für kritische Settings

### Phase 3: Konsolidierung (geplant)
- [ ] Alle Settings in `useSettingsBatch` integrieren
- [ ] Settings-Admin-UI erstellen
- [ ] NAV_ITEMS und ROUTES Registry vereinheitlichen

---

## 8. Anhang: Alle Setting-Keys (Übersicht)

```typescript
// Aktive Settings (Stand 2025-01-31)
const ACTIVE_SETTINGS = [
  'login_background',
  'header-message',
  'sticky_header_layout',
  'marina-menu-settings-template',
  'footer-settings-template-admin',
  'footer-settings-template-vorstand',
  'footer-settings-template-kranfuehrer',
  'footer-settings-template-mitglied',
  'footer-settings-template-gastmitglied',
  'dashboard-settings-template-admin',
  'dashboard-settings-template-vorstand',
  'dashboard-settings-template-kranfuehrer',
  'dashboard-settings-template-mitglied',
  'dashboard-settings-template-gastmitglied',
];

// Gelöschte Settings (Phase 1)
const DELETED_SETTINGS = [
  'footer-menu-template-*',
  'footerMenuSettings',
  'desktop_background',
];
```

---

**Ende der Dokumentation**