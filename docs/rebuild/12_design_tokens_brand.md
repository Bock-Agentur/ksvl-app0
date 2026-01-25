# KSVL Design Tokens & Brand Guide

> Vollständige Dokumentation des maritimen Design-Systems für den Klagenfurter Segelverein Loretto

---

## 1. Brand Identity

### 1.1 Vereinsinfo
- **Name:** Klagenfurter Segelverein Loretto (KSVL)
- **Typ:** Segelverein am Wörthersee, Kärnten
- **App-Name:** KSVL Slot Manager
- **Design-Philosophie:** Maritim, ruhig, professionell

### 1.2 Design-Prinzipien
- **Nautisch-maritime Optik:** Navy-Blau, Türkis, Meerestöne
- **Fokus auf Lesbarkeit:** Klare Typografie, ausreichend Kontrast
- **Mobile-First:** Optimiert für Smartphone-Nutzung
- **Ruhe & Stabilität:** Keine wilden Animationen, dezente Motion

---

## 2. Farbpalette

### 2.1 Trendy Maritime Colors (Referenz-Palette)

```css
--trendy-pink: 348 77% 67%;    /* #EE4266 - Akzent/Blocked */
--trendy-navy: 202 85% 23%;    /* #0B4F6C - Primär */
--trendy-cyan: 194 99% 47%;    /* #01BAEF - Highlight */
--trendy-light-green: 87 66% 84%;  /* #D0FCB3 - Soft Accent */
--trendy-green: 133 28% 68%;   /* #9BC59D - Available */
```

### 2.2 Navy Header Colors

```css
--navy-deep: 215 70% 20%;      /* Dunkleres Navy für Header-Start */
--navy-primary: 220 65% 30%;   /* Helleres Navy für Header-Ende */
```

---

## 3. Semantische Farb-Tokens

### 3.1 Basis-Farben (Light Mode)

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--background` | `210 25% 98%` | Seiten-Hintergrund |
| `--foreground` | `210 15% 20%` | Standard-Textfarbe |
| `--card` | `210 20% 99%` | Card-Hintergrund |
| `--card-foreground` | `210 15% 20%` | Card-Textfarbe |
| `--popover` | `210 20% 99%` | Popover-Hintergrund |
| `--popover-foreground` | `210 15% 20%` | Popover-Text |

### 3.2 Primary & Secondary

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--primary` | `210 60% 25%` | Primäre Aktionsfarbe (Deep Navy) |
| `--primary-foreground` | `210 25% 98%` | Text auf Primary |
| `--primary-hover` | `210 60% 20%` | Primary Hover-State |
| `--secondary` | `210 40% 88%` | Sekundäre Elemente (Ocean Blue) |
| `--secondary-foreground` | `210 60% 25%` | Text auf Secondary |

### 3.3 Muted & Accent

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--muted` | `210 30% 92%` | Gedämpfte Hintergründe |
| `--muted-foreground` | `210 20% 45%` | Gedämpfter Text |
| `--accent` | `195 50% 90%` | Akzent-Hintergrund (Sea Foam) |
| `--accent-foreground` | `210 60% 25%` | Akzent-Text |

### 3.4 Status-Farben

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--success` | `160 60% 35%` | Erfolg |
| `--success-foreground` | `160 60% 95%` | Text auf Erfolg |
| `--warning` | `45 85% 55%` | Warnung |
| `--warning-foreground` | `45 85% 10%` | Text auf Warnung |
| `--destructive` | `0 75% 55%` | Fehler/Löschen |
| `--destructive-foreground` | `0 75% 95%` | Text auf Destructive |

### 3.5 Borders & Inputs

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--border` | `210 25% 85%` | Standard-Border |
| `--input` | `210 25% 90%` | Input-Hintergrund |
| `--ring` | `210 60% 25%` | Focus-Ring |
| `--radius` | `0.375rem` | Standard Border-Radius |

---

## 4. Badge-Farben

### 4.1 Standard Badges

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--badge-default` | `202 85% 23%` | Standard Badge (Ocean Blue) |
| `--badge-default-foreground` | `0 0% 100%` | Weißer Text |
| `--badge-secondary` | `210 40% 75%` | Sekundäres Badge |
| `--badge-secondary-foreground` | `210 60% 25%` | Dunkler Text |
| `--badge-destructive` | `0 75% 55%` | Fehler-Badge |
| `--badge-destructive-foreground` | `0 0% 100%` | Weißer Text |

### 4.2 Outline Badges

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--badge-outline` | `210 25% 85%` | Outline Border |
| `--badge-outline-foreground` | `210 60% 25%` | Outline Text |
| `--badge-outline-hover` | `195 50% 90%` | Outline Hover |
| `--badge-outline-hover-foreground` | `210 60% 25%` | Outline Hover Text |

### 4.3 Status Badges

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--badge-success` | `160 60% 35%` | Erfolg-Badge |
| `--badge-success-foreground` | `0 0% 100%` | Weißer Text |
| `--badge-warning` | `45 85% 55%` | Warnung-Badge |
| `--badge-warning-foreground` | `45 85% 10%` | Dunkler Text |
| `--badge-available` | `133 28% 68%` | Verfügbar (trendy-green) |
| `--badge-available-foreground` | `0 0% 100%` | Weißer Text |
| `--badge-booked` | `202 85% 23%` | Gebucht (Ocean Blue) |
| `--badge-booked-foreground` | `0 0% 100%` | Weißer Text |
| `--badge-blocked` | `348 77% 67%` | Blockiert (trendy-pink) |
| `--badge-blocked-foreground` | `0 0% 100%` | Weißer Text |

---

## 5. Action-Farben (Activity Feed)

| Token | HSL-Wert | Verwendung |
|-------|----------|------------|
| `--action-created` | `120 60% 40%` | Erstellt (Grün) |
| `--action-created-foreground` | `120 60% 95%` | Text |
| `--action-created-bg` | `120 60% 90%` | Hintergrund |
| `--action-updated` | `210 80% 35%` | Aktualisiert (Blau) |
| `--action-updated-foreground` | `210 80% 95%` | Text |
| `--action-updated-bg` | `210 80% 90%` | Hintergrund |
| `--action-deleted` | `0 70% 50%` | Gelöscht (Rot) |
| `--action-deleted-foreground` | `0 70% 95%` | Text |
| `--action-deleted-bg` | `0 70% 90%` | Hintergrund |
| `--action-booked` | `270 60% 40%` | Gebucht (Lila) |
| `--action-booked-foreground` | `270 60% 95%` | Text |
| `--action-booked-bg` | `270 60% 90%` | Hintergrund |
| `--action-cancelled` | `30 80% 45%` | Storniert (Orange) |
| `--action-cancelled-foreground` | `30 80% 95%` | Text |
| `--action-cancelled-bg` | `30 80% 90%` | Hintergrund |

---

## 6. Gradienten

### 6.1 Maritime Gradienten

```css
/* Header Gradient */
--gradient-header: linear-gradient(to right, hsl(215, 70%, 20%), hsl(220, 65%, 30%));

/* Ocean Gradient */
--gradient-ocean: linear-gradient(135deg, hsl(210, 60%, 45%) 0%, hsl(195, 55%, 60%) 100%);

/* Wave Gradient */
--gradient-wave: linear-gradient(180deg, hsl(210, 30%, 95%) 0%, hsl(210, 25%, 90%) 100%);

/* Deep Gradient */
--gradient-deep: linear-gradient(135deg, hsl(210, 60%, 25%) 0%, hsl(210, 50%, 35%) 100%);
```

### 6.2 Named Trendy Gradienten

```css
/* Maritime Sunset (Pink → Cyan) */
--gradient-maritime-sunset: linear-gradient(135deg, hsl(348, 77%, 67%) 0%, hsl(194, 99%, 47%) 100%);

/* Ocean Breeze (Navy → Green) */
--gradient-ocean-breeze: linear-gradient(135deg, hsl(202, 85%, 23%) 0%, hsl(133, 28%, 68%) 100%);

/* Harbor Mist (Light Cyan → Light Green) */
--gradient-harbor-mist: linear-gradient(180deg, hsl(194, 99%, 87%) 0%, hsl(87, 66%, 84%) 100%);
```

### 6.3 Tailwind Gradient Classes

```typescript
// tailwind.config.ts
backgroundImage: {
  'gradient-ocean': 'var(--gradient-ocean)',
  'gradient-wave': 'var(--gradient-wave)',
  'gradient-deep': 'var(--gradient-deep)',
  'gradient-maritime-sunset': 'var(--gradient-maritime-sunset)',
  'gradient-ocean-breeze': 'var(--gradient-ocean-breeze)',
  'gradient-harbor-mist': 'var(--gradient-harbor-mist)'
}
```

---

## 7. Schatten (Shadows)

### 7.1 Maritime Shadows

```css
/* Card Shadow */
--shadow-card: 0 4px 20px -8px hsl(210 60% 25% / 0.15);

/* Button Shadow */
--shadow-button: 0 2px 8px -2px hsl(210 60% 25% / 0.2);

/* Elevated Shadow */
--shadow-elevated: 0 8px 32px -12px hsl(210 60% 25% / 0.25);
```

### 7.2 Tailwind Shadow Classes

```typescript
// tailwind.config.ts
boxShadow: {
  'card-maritime': 'var(--shadow-card)',
  'button-maritime': 'var(--shadow-button)',
  'elevated-maritime': 'var(--shadow-elevated)'
}
```

### 7.3 Utility Shadow Classes

```css
/* Standard weicher Schatten */
.card-shadow-soft {
  box-shadow: 
    0 4px 12px -2px rgba(15, 23, 42, 0.08),
    0 8px 24px -4px rgba(15, 23, 42, 0.12);
}

/* Größerer Schatten für große Cards */
.card-shadow-soft-lg {
  box-shadow: 
    0 8px 16px -4px rgba(15, 23, 42, 0.10),
    0 16px 40px -8px rgba(15, 23, 42, 0.15);
}
```

---

## 8. Typography

### 8.1 Font Stack

```css
body {
  @apply font-sans;
  /* System Font Stack */
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

### 8.2 Typografie-Klassen

| Klasse | Verwendung |
|--------|------------|
| `text-foreground` | Standard-Text |
| `text-muted-foreground` | Sekundärer Text |
| `text-primary` | Primär-farbiger Text |
| `text-destructive` | Fehler-Text |

---

## 9. Spacing & Layout

### 9.1 Safe Area Spacing

```typescript
// tailwind.config.ts
spacing: {
  'safe': 'env(safe-area-inset-top)',
  'safe-bottom': 'env(safe-area-inset-bottom)',
}
```

### 9.2 Container

```typescript
container: {
  center: true,
  padding: '2rem',
  screens: {
    '2xl': '1400px'
  }
}
```

### 9.3 Border Radius

```css
--radius: 0.375rem;

/* Tailwind Classes */
border-radius: {
  lg: 'var(--radius)',           /* 0.375rem */
  md: 'calc(var(--radius) - 2px)', /* 0.25rem */
  sm: 'calc(var(--radius) - 4px)'  /* 0.125rem */
}
```

---

## 10. Animationen

### 10.1 Keyframes

```typescript
// tailwind.config.ts
keyframes: {
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' }
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' }
  },
  'fade-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' }
  },
  'scale-in': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' }
  }
}
```

### 10.2 Animation Classes

```typescript
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
  'fade-in': 'fade-in 0.2s ease-out',
  'scale-in': 'scale-in 0.2s ease-out'
}
```

### 10.3 Transition

```css
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Easing Function */
transitionTimingFunction: {
  'wave': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}
```

---

## 11. Interaktive Utility Classes

```css
/* Hover Effects */
.hover-lift:hover { 
  transform: translateY(-2px); 
  transition: transform 0.2s ease; 
}

.hover-grow:hover { 
  transform: scale(1.05); 
  transition: transform 0.2s ease; 
}

/* Clickable Elements */
.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable:active {
  transform: scale(0.98);
}
```

---

## 12. Card Styles

### 12.1 Maritime Hero Card

```css
.card-maritime-hero {
  @apply bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0;
}
```

---

## 13. Dark Mode

### 13.1 Aktivierung

```typescript
// tailwind.config.ts
darkMode: ["class"]

// HTML
<html class="dark">
```

### 13.2 Dark Mode Farben

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--background` | `210 25% 98%` | `210 50% 8%` |
| `--foreground` | `210 15% 20%` | `210 25% 95%` |
| `--primary` | `210 60% 25%` | `195 70% 60%` |
| `--card` | `210 20% 99%` | `210 50% 10%` |
| `--muted` | `210 30% 92%` | `210 40% 12%` |
| `--border` | `210 25% 85%` | `210 40% 18%` |

### 13.3 Dark Gradienten

```css
.dark {
  --gradient-header: linear-gradient(to right, hsl(215, 70%, 12%), hsl(220, 65%, 18%));
  --gradient-ocean: linear-gradient(135deg, hsl(210, 60%, 15%) 0%, hsl(195, 55%, 25%) 100%);
  --gradient-maritime-sunset: linear-gradient(135deg, hsl(348, 77%, 47%) 0%, hsl(194, 99%, 37%) 100%);
}
```

---

## 14. Sidebar Theme

```css
:root {
  --sidebar-background: 210 25% 98%;
  --sidebar-foreground: 210 15% 20%;
  --sidebar-primary: 210 60% 25%;
  --sidebar-primary-foreground: 210 25% 98%;
  --sidebar-accent: 210 40% 88%;
  --sidebar-accent-foreground: 210 60% 25%;
  --sidebar-border: 210 25% 85%;
  --sidebar-ring: 210 60% 25%;
}

.dark {
  --sidebar-background: 210 50% 8%;
  --sidebar-foreground: 210 25% 95%;
  --sidebar-primary: 195 70% 60%;
  --sidebar-primary-foreground: 210 50% 8%;
  --sidebar-accent: 210 40% 15%;
  --sidebar-accent-foreground: 210 25% 95%;
  --sidebar-border: 210 40% 18%;
  --sidebar-ring: 195 70% 60%;
}
```

---

## 15. Slot Design (Dynamisch)

Slot-Farben werden dynamisch über `app_settings` verwaltet und zur Laufzeit gesetzt:

```typescript
// Geladen via useSlotDesign() Hook
interface SlotDesignSettings {
  available: { bg: string; border: string; text: string; label: string; };
  booked: { bg: string; border: string; text: string; label: string; };
  blocked: { bg: string; border: string; text: string; label: string; };
}

// CSS-Variablen werden dynamisch gesetzt:
--slot-available-bg
--slot-available-border
--slot-available-text
--slot-available-label
--slot-booked-bg
// etc.
```

---

## 16. Role Badge Colors (Datenbank)

Gespeichert in `role_badge_settings` Tabelle:

| Rolle | Background | Text |
|-------|------------|------|
| admin | Navy | Weiß |
| vorstand | Blau | Weiß |
| kranfuehrer | Cyan | Navy |
| mitglied | Grün | Weiß |
| gastmitglied | Grau | Dunkel |

---

## 17. Verwendung in Komponenten

### 17.1 Korrekte Token-Nutzung

```tsx
// ✅ RICHTIG - Semantische Tokens
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">
<Card className="bg-card border-border shadow-card-maritime">
<Badge className="bg-badge-success text-badge-success-foreground">

// ❌ FALSCH - Direkte Farben
<div className="bg-white text-black">
<Button className="bg-blue-600 text-white">
```

### 17.2 Gradient-Nutzung

```tsx
// Header mit Gradient
<header className="bg-gradient-ocean">

// Hero Section
<div className="bg-gradient-maritime-sunset">
```

### 17.3 Shadow-Nutzung

```tsx
// Maritime Card
<Card className="shadow-card-maritime">

// Elevated Element
<div className="shadow-elevated-maritime">

// Soft Shadow
<div className="card-shadow-soft">
```

---

## 18. Favicon & Branding

- **Favicon:** `public/favicon.png` (512x512px)
- **Design:** "KSVL" Buchstaben im maritimen Stil mit Wellen-Elementen
- **Farben:** Navy-Blau auf transparentem Hintergrund

---

## 19. Checkliste für neue Komponenten

1. ✅ Nur HSL-Farben in CSS-Variablen
2. ✅ Semantische Tokens verwenden (`bg-primary`, nicht `bg-blue-600`)
3. ✅ Maritime Schatten nutzen (`shadow-card-maritime`)
4. ✅ Radius aus Design-System (`rounded-lg`)
5. ✅ Dark Mode Unterstützung prüfen
6. ✅ Mobile-First responsive Design
7. ✅ Animationen dezent und performant

---

*Dokumentation erstellt für KSVL Slot Manager v1.0*
*Letzte Aktualisierung: Januar 2026*
