# Login Background Settings - Technische Dokumentation

> Stand: 2025-12-02 | KSVL Slot Manager App

## 1. Überblick

### Was kann ein Admin konfigurieren?

Die Login-Hintergrund-Einstellungen ermöglichen Admins, das visuelle Erscheinungsbild der Login-Seite anzupassen:

- **Hintergrund-Typ**: Gradient, Bild oder Video
- **Media-Upload**: Direkt hochladen oder aus File Manager wählen
- **Overlay**: Farbe und Transparenz über dem Hintergrund
- **Input-Felder**: Hintergrundfarbe und Transparenz der Formularfelder
- **Login-Block Position**: Vertikale Position und Breite (Desktop/Tablet/Mobile)
- **Countdown**: Optional, Timer bis zu einem Datum mit Text

### Zentrale Dateien

| Datei | Zweck |
|-------|-------|
| `src/components/settings/login-background/login-background-settings.tsx` | Orchestrator-Komponente |
| `src/hooks/core/settings/use-login-background.tsx` | Settings Hook (liest/schreibt `login_background`) |
| `src/pages/Auth.tsx` | Consumer - rendert Login-Seite mit Hintergrund |

---

## 2. Relevante Dateien & Module

| Typ | Dateipfad | Zweck |
|-----|-----------|-------|
| **Orchestrator** | `src/components/settings/login-background/login-background-settings.tsx` | Haupt-UI für Login-Hintergrund-Einstellungen |
| **Hook** | `src/components/settings/login-background/hooks/use-login-background-form.ts` | Form-State und Handler (~30 Funktionen) |
| **Settings Hook** | `src/hooks/core/settings/use-login-background.tsx` | DB-Zugriff auf `login_background` Setting |
| **Subcomponent** | `components/background-mode-selector.tsx` | Toggle für Gradient/Bild/Video |
| **Subcomponent** | `components/gradient-editor.tsx` | CSS-Gradient Editor |
| **Subcomponent** | `components/media-upload-card.tsx` | Upload & File Manager Auswahl |
| **Subcomponent** | `components/overlay-settings-card.tsx` | Overlay & Input-Styling |
| **Subcomponent** | `components/login-block-position-card.tsx` | Position & Breite (6 Slider) |
| **Subcomponent** | `components/countdown-settings-card.tsx` | Countdown-Konfiguration |
| **Subcomponent** | `components/action-buttons.tsx` | Speichern/Zurücksetzen |
| **Barrel Export** | `components/index.ts` | Zentrale Exports |
| **Consumer** | `src/pages/Auth.tsx` | Rendert Login-Seite mit Settings |

---

## 3. Datenmodell & Settings-Struktur

### 3.1 Settings-Key

- **Tabelle**: `app_settings`
- **Key**: `setting_key = 'login_background'`
- **Scope**: `is_global = true`

### 3.2 JSON-Struktur (30 Felder)

```typescript
interface LoginBackground {
  // Hintergrund-Typ
  type: 'gradient' | 'image' | 'video';
  
  // Media-Speicherung
  bucket: 'documents' | 'login-media' | null;
  storagePath: string | null;
  url: string | null; // @deprecated - nur für Preview
  filename: string | null;
  videoOnMobile: boolean;
  
  // Overlay
  overlayColor: string;      // Default: '#000000'
  overlayOpacity: number;    // Default: 40 (0-100)
  mediaBlur: number;         // Default: 0 (0-20)
  
  // Input-Felder
  inputBgColor: string;      // Default: '#FFFFFF'
  inputBgOpacity: number;    // Default: 10 (0-100)
  
  // Login-Block Position (je Device)
  loginBlockVerticalPositionDesktop: number;  // Default: 50
  loginBlockVerticalPositionTablet: number;   // Default: 50
  loginBlockVerticalPositionMobile: number;   // Default: 50
  
  // Login-Block Breite (je Device)
  loginBlockWidthDesktop: number;   // Default: 400
  loginBlockWidthTablet: number;    // Default: 380
  loginBlockWidthMobile: number;    // Default: 340
  
  // Card-Styling (NICHT in Auth.tsx verwendet!)
  cardOpacity: number;        // Default: 95
  cardBorderBlur: number;     // Default: 8
  cardBorderRadius: number;   // Default: 8
  
  // Countdown
  countdownEnabled: boolean;          // Default: false
  countdownEndDate: string | null;
  countdownText: string;              // Default: 'bis zur neuen Segelsaison'
  countdownShowDays: boolean;         // Default: true
  countdownFontSize: number;          // Default: 48
  countdownFontWeight: number;        // Default: 100
  countdownVerticalPositionDesktop: number;  // Default: 35
  countdownVerticalPositionTablet: number;   // Default: 35
  countdownVerticalPositionMobile: number;   // Default: 35
}
```

### 3.3 Default-Werte

```typescript
const DEFAULT_BACKGROUND: LoginBackground = {
  type: 'gradient',
  bucket: null,
  storagePath: null,
  url: null,
  filename: null,
  videoOnMobile: false,
  cardOpacity: 95,
  cardBorderBlur: 8,
  cardBorderRadius: 8,
  overlayColor: '#000000',
  overlayOpacity: 40,
  mediaBlur: 0,
  inputBgColor: '#FFFFFF',
  inputBgOpacity: 10,
  loginBlockVerticalPositionDesktop: 50,
  loginBlockVerticalPositionTablet: 50,
  loginBlockVerticalPositionMobile: 50,
  loginBlockWidthDesktop: 400,
  loginBlockWidthTablet: 380,
  loginBlockWidthMobile: 340,
  countdownEnabled: false,
  countdownEndDate: null,
  countdownText: 'bis zur neuen Segelsaison',
  countdownShowDays: true,
  countdownFontSize: 48,
  countdownFontWeight: 100,
  countdownVerticalPositionDesktop: 35,
  countdownVerticalPositionTablet: 35,
  countdownVerticalPositionMobile: 35
};
```

---

## 4. Datenfluss

```
┌─────────────────────────────────────────────────────────────┐
│                    Settings Page                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         LoginBackgroundSettings (Orchestrator)       │    │
│  │                        │                             │    │
│  │    useLoginBackgroundForm()                          │    │
│  │         │                                            │    │
│  │    localSettings ←→ useLoginBackground()             │    │
│  │                        │                             │    │
│  │                useSettingsBatch()                    │    │
│  │                        │                             │    │
│  │              app_settings (DB)                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ login_background JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Auth.tsx                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         useLoginBackground({ enabled: true })        │    │
│  │                        │                             │    │
│  │    background.type → Gradient / Image / Video        │    │
│  │    background.overlay* → Overlay Layer               │    │
│  │    background.loginBlock* → Form Position            │    │
│  │    background.countdown* → Countdown Timer           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Komplexitätsanalyse

### 5.1 Kritische Punkte

| Problem | Details | Auswirkung |
|---------|---------|------------|
| **30 Felder** | Sehr granulare Konfiguration | Überwältigend für Admins |
| **6 Device-spezifische Positions-Felder** | Desktop/Tablet/Mobile je für Position und Breite | Redundant, könnte auto-responsiv sein |
| **3 Countdown-Positions-Felder** | Ebenfalls je Device | Redundant |
| **Card-Styling (3 Felder)** | cardOpacity, cardBorderBlur, cardBorderRadius | **NICHT in Auth.tsx verwendet** |

### 5.2 Ungenutzte Felder

Die folgenden Felder werden in `Auth.tsx` **NICHT** verwendet:
- `cardOpacity`
- `cardBorderBlur`  
- `cardBorderRadius`

Diese wurden in den Settings UI konfigurierbar, aber nie im Consumer implementiert.

---

## 6. Vereinfachungen (umgesetzt 2025-12-02)

### Entfernte Komponenten

1. **Preview-Komponenten** (~380 LOC)
   - `login-preview-card.tsx` - entfernt
   - `countdown-preview.tsx` - entfernt

2. **Card-Styling Section** (~150 LOC)
   - `card-style-card.tsx` - entfernt
   - Handler entfernt: `handleBorderRadiusChange`, `handleOpacityChange`, `handleBorderBlurChange`

3. **Legacy Media Selector** (~60 LOC)
   - `LegacyMediaSelectorDialog` - entfernt
   - Handler entfernt: `handleSelectFromLegacyMedia`

### Beibehaltene Funktionen

- ✅ Hintergrund-Typ: Gradient / Bild / Video
- ✅ Media-Upload & File Manager Auswahl
- ✅ Overlay-Einstellungen
- ✅ Input-Feld Styling
- ✅ Login-Block Positionierung (Desktop/Tablet/Mobile)
- ✅ Countdown-Funktion

### Ergebnis

- **Vorher**: ~2,300 LOC, 33 Felder
- **Nachher**: ~1,700 LOC, 30 Felder
- **Reduktion**: ~600 LOC (26%)
