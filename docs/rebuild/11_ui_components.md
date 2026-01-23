# KSVL Slot Manager - UI-Komponenten & Design

## 1. Maritime Design System

### CSS-Variablen (index.css)

```css
:root {
  --primary: 210 60% 25%;           /* Deep Navy */
  --secondary: 210 40% 88%;         /* Ocean Blue */
  --accent: 195 50% 90%;            /* Sea Foam */
  --trendy-pink: 348 77% 67%;       /* #EE4266 */
  --trendy-navy: 202 85% 23%;       /* #0B4F6C */
  --trendy-cyan: 194 99% 47%;       /* #01BAEF */
  --trendy-green: 133 28% 68%;      /* #9BC59D */
  --gradient-header: linear-gradient(to right, hsl(215, 70%, 20%), hsl(220, 65%, 30%));
}
```

## 2. shadcn/ui Komponenten

Vollständige Liste in `src/components/ui/`:
- Accordion, Alert, AlertDialog, Avatar, Badge, Button
- Calendar, Card, Carousel, Checkbox, Collapsible, Command
- Dialog, Drawer, Dropdown-Menu, Form, Input, Label
- Popover, Progress, Select, Separator, Sheet, Skeleton
- Slider, Switch, Table, Tabs, Textarea, Toast, Toggle, Tooltip

## 3. Common Components

| Komponente | Datei | Beschreibung |
|------------|-------|--------------|
| PageLayout | `page-layout.tsx` | Standard-Seiten-Wrapper |
| PageLoader | `page-loader.tsx` | Loading-Skeleton |
| ErrorBoundary | `error-boundary.tsx` | Fehlerbehandlung |
| ProtectedRoute | `protected-route.tsx` | Auth-Guard |
| UnifiedFooter | `unified-footer.tsx` | Bottom-Navigation |
| SlotForm | `slot-form.tsx` | Slot-Formular |

## 4. Icons (Lucide React)

```typescript
import { Home, Calendar, User, Users, Settings, FileText, ... } from 'lucide-react';
```

## 5. Utility: cn()

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

**Letzte Aktualisierung**: 2026-01-23
