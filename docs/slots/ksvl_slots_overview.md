# KSVL Slot-System - Technische Dokumentation

## Übersicht

Das Slot-System ist das zentrale Buchungssystem für Krantermine im Klagenfurter Segelverein Loretto. Diese Dokumentation beschreibt die einheitliche Architektur für Slot-Darstellung und -Logik.

## Architektur

### Single Source of Truth Prinzip

```
┌─────────────────────────────────────────────────────────────┐
│                    SlotViewModel                            │
│  (src/lib/slots/slot-view-model.ts)                        │
│                                                             │
│  - STATUS_LABELS: Record<SlotStatus, string>               │
│  - formatDuration(minutes): string                          │
│  - formatTime(time): string                                 │
│  - formatDateShort/Long(date): string                       │
│  - mapSlotToViewModel(slot, options): SlotViewModel         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 useSlotViewModel Hook                       │
│  (src/hooks/core/data/use-slot-view-model.tsx)             │
│                                                             │
│  Kombiniert:                                                │
│  - useSlotDesign() → Farben                                │
│  - useConsecutiveSlots() → Status-Logik                    │
│  - mapSlot() / mapSlots() → ViewModel Mapping              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SlotCard Component                       │
│  (src/components/slots/slot-card.tsx)                      │
│                                                             │
│  Varianten:                                                │
│  - compact: Kalender-Grid (wenige Infos)                   │
│  - list: Listenansicht (Header + Expand)                   │
│  - detail: Vollansicht (Dialog)                            │
└─────────────────────────────────────────────────────────────┘
```

## SlotViewModel Interface

```typescript
interface SlotViewModel {
  // Original Slot ID
  id: string;
  
  // Basis-Daten
  date: string;        // ISO Format YYYY-MM-DD
  time: string;        // HH:mm Format
  duration: number;    // Minuten (15, 30, 45, 60)
  
  // Status
  status: SlotStatus;  // 'available' | 'booked' | 'blocked'
  statusLabel: string; // "Verfügbar" | "Gebucht" | "Gesperrt"
  
  // Kranführer
  craneOperator: {
    id: string;
    name: string;
    email?: string;
  };
  
  // Gebuchtes Mitglied (optional)
  bookedMember?: {
    id: string;
    name: string;
    email?: string;
    memberNumber?: string;
  };
  
  // Meta
  notes?: string;
  blockId?: string;
  isPartOfBlock: boolean;
  isMiniSlot: boolean;
  isBooked: boolean;
  
  // Formatierte Werte (für direkte Anzeige)
  formattedDate: string;      // "Mo, 03.12.2025"
  formattedDateLong: string;  // "Montag, 03. Dezember 2025"
  formattedTime: string;      // "08:00 Uhr"
  formattedDuration: string;  // "30 Min."
  
  // Design (aus useSlotDesign)
  colors: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
  
  // Original Slot Referenz
  originalSlot: Slot;
}
```

## Status-Labels (Zentral)

**Wichtig:** Alle Status-Texte MÜSSEN aus `STATUS_LABELS` kommen:

```typescript
// src/lib/slots/slot-view-model.ts
export const STATUS_LABELS: Record<SlotStatus, string> = {
  available: 'Verfügbar',
  booked: 'Gebucht',
  blocked: 'Gesperrt',  // NICHT "Blockiert"!
};
```

## Status-Logik

Die Status-Berechnung erfolgt in `useConsecutiveSlots()`:

| Status | Bedingung |
|--------|-----------|
| `booked` | `slot.isBooked === true` |
| `blocked` | Slot ist Teil eines Blocks, aber vorheriger Slot nicht gebucht |
| `available` | Weder gebucht noch blockiert |

### Consecutive Slots Regel

Wenn `consecutiveSlotsEnabled = true`:
- Slots des gleichen Kranführers am selben Tag müssen sequentiell gebucht werden
- Spätere Slots werden "blocked" bis alle vorherigen gebucht sind

## Formatierungs-Funktionen

```typescript
// Alle aus src/lib/slots/slot-view-model.ts

formatDuration(30)     // → "30 Min."
formatTime("08:00")    // → "08:00 Uhr"
formatDateShort("2025-12-03")  // → "Mo, 03.12.2025"
formatDateLong("2025-12-03")   // → "Montag, 03. Dezember 2025"
```

## SlotCard Varianten

### Compact (Kalender-Grid)

```tsx
<SlotCard 
  slot={slotViewModel}
  variant="compact"
  isClickable
  onAction={(action, slot) => handleAction(action, slot)}
/>
```

Zeigt:
- Kranführer-Name
- Member-Name (wenn gebucht)
- Dauer (formatiert)
- Status-Indikator (farbiger Punkt)

### List (Listenansicht)

```tsx
<SlotCard 
  slot={slotViewModel}
  variant="list"
  showActions
  onAction={(action, slot) => handleAction(action, slot)}
/>
```

Zeigt (Header):
- Status-Badge
- Datum (kurz)
- Zeit-Badge
- Dauer-Badge
- Kranführer

Zeigt (Expanded):
- Volles Datum
- Zeit + Dauer
- Kranführer + E-Mail
- Buchungs-Info
- Notizen
- Aktions-Buttons

### Detail (Dialog)

```tsx
<SlotCard 
  slot={slotViewModel}
  variant="detail"
/>
```

Vollständige Anzeige aller Informationen.

## SlotStatusBadge

```tsx
<SlotStatusBadge 
  status={slot.status}
  colors={slot.colors}
  size="sm" // sm | md | lg
/>
```

Nutzt automatisch `STATUS_LABELS[status]` für Text.

## Design-System Integration

### Farben aus useSlotDesign()

Alle Slot-Farben werden dynamisch über `useSlotDesign()` bereitgestellt:

```typescript
const { settings } = useSlotDesign();

// settings.available.background
// settings.available.border
// settings.available.text
// settings.available.label

// settings.booked.*
// settings.blocked.*
```

### CSS-Variablen

Die Farben werden zur Laufzeit als CSS-Variablen gesetzt:
- `--slot-available-bg`, `--slot-available-border`, etc.
- `--slot-booked-bg`, `--slot-booked-border`, etc.
- `--slot-blocked-bg`, `--slot-blocked-border`, etc.

**Wichtig:** Die alten `--status-*` CSS-Variablen sind DEPRECATED und wurden entfernt!

## Verwendung in Komponenten

### WeekCalendar

```tsx
// Nutzt getSlotColors() für inline styles
const { settings } = useSlotDesign();
const getSlotColors = (status) => settings[status];

<Card style={{
  backgroundColor: getSlotColors(status).background,
  borderColor: getSlotColors(status).border
}}>
```

### MonthCalendar

```tsx
const { settings: slotDesignSettings } = useSlotDesign();

<div style={{
  backgroundColor: slotDesignSettings.available.background,
  color: slotDesignSettings.available.text
}}>
```

### SlotListItem

```tsx
import { STATUS_LABELS, formatDuration, formatDateShort } from "@/lib/slots/slot-view-model";
import { SlotStatusBadge } from "@/components/slots/slot-status-badge";

<SlotStatusBadge status={status} colors={colors} size="sm" />
<span>{formatDateShort(slot.date)}</span>
<Badge>{formatDuration(slot.duration)}</Badge>
```

## Datei-Struktur

```
src/
├── lib/
│   └── slots/
│       └── slot-view-model.ts    # SlotViewModel, STATUS_LABELS, Formatierung
├── hooks/
│   └── core/
│       └── data/
│           └── use-slot-view-model.tsx  # Hook für ViewModel-Mapping
├── components/
│   ├── slots/
│   │   ├── index.ts              # Barrel exports
│   │   ├── slot-card.tsx         # SlotCard (compact/list/detail)
│   │   └── slot-status-badge.tsx # Status-Badge
│   ├── week-calendar.tsx         # Wochen-/Tagesansicht
│   ├── month-calendar.tsx        # Monatsansicht
│   └── slot-management/
│       └── slot-list-item.tsx    # Listen-Item
└── types/
    └── slot.ts                   # Slot Type Definitions
```

## Migration Guide

### Von alten Status-Texten

```tsx
// VORHER (inkonsistent)
{status === "blocked" ? "Blockiert" : status === "booked" ? "Gebucht" : "Verfügbar"}

// NACHHER (einheitlich)
import { STATUS_LABELS } from "@/lib/slots/slot-view-model";
{STATUS_LABELS[status]}
```

### Von --status-* CSS-Variablen

```tsx
// VORHER
<div className="bg-[hsl(var(--status-available))]">

// NACHHER
const { settings } = useSlotDesign();
<div style={{ backgroundColor: settings.available.background }}>
```

### Von manueller Dauer-Formatierung

```tsx
// VORHER (inkonsistent: "30min", "30 Min", "30 Minuten")
<span>{slot.duration}min</span>
<span>{slot.duration} Min</span>

// NACHHER (einheitlich)
import { formatDuration } from "@/lib/slots/slot-view-model";
<span>{formatDuration(slot.duration)}</span>  // → "30 Min."
```

## Zusammenfassung der Änderungen

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| Status "Gesperrt" | "Blockiert" (teilweise) | "Gesperrt" (überall) |
| Dauer-Format | "30min", "30 Min" | "30 Min." |
| MonthCalendar Farben | `--status-*` CSS vars | `useSlotDesign()` |
| Status-Labels | Inline strings | `STATUS_LABELS[status]` |
| Slot-Rendering | Duplizierter Code | `SlotCard` Varianten |

## Implementierte Änderungen

### Phase 1-3: Quick Wins (Dezember 2025)

- ✅ `STATUS_LABELS` als Single Source of Truth eingeführt
- ✅ `formatDuration()` für einheitliche Dauer-Formatierung
- ✅ `SlotStatusBadge` Komponente erstellt
- ✅ `MonthCalendar`: CSS-Variablen durch `useSlotDesign()` ersetzt
- ✅ `SlotListItem`: Status-Text und Formatierung vereinheitlicht
- ✅ `WeekCalendar`: Hardcoded Status-Texte durch `STATUS_LABELS` ersetzt

### Phase 4: SlotViewModel & SlotCard (Dezember 2025)

- ✅ `SlotViewModel` Interface und Mapping-Funktion erstellt
- ✅ `useSlotViewModel` Hook implementiert
- ✅ `SlotCard` Komponente mit 3 Varianten (compact/list/detail)
- ✅ Zentrale Exports in `src/components/slots/index.ts`

---

*Letzte Aktualisierung: Dezember 2025*
