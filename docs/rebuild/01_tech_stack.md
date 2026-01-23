# KSVL Slot Manager - Technologie-Stack

## 1. Frontend Framework

### 1.1 React 18

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

**Features verwendet:**
- Functional Components mit Hooks
- Suspense (für Lazy Loading)
- Concurrent Features
- Automatic Batching

### 1.2 TypeScript 5.8

```json
{
  "typescript": "^5.8.3"
}
```

**Konfiguration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 1.3 Vite 5.4

```json
{
  "vite": "^5.4.19",
  "@vitejs/plugin-react-swc": "^3.11.0"
}
```

**Konfiguration (vite.config.ts):**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
}));
```

## 2. Styling

### 2.1 Tailwind CSS 3.4

```json
{
  "tailwindcss": "^3.4.17",
  "tailwindcss-animate": "^1.0.7",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6"
}
```

**Maritime Theme Konfiguration (tailwind.config.ts):**
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      spacing: {
        'safe': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      colors: {
        // Semantic Colors (from CSS variables)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Status Colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        // Trendy Maritime Colors
        "trendy-pink": "hsl(var(--trendy-pink))",
        "trendy-navy": "hsl(var(--trendy-navy))",
        "trendy-cyan": "hsl(var(--trendy-cyan))",
        "trendy-green": "hsl(var(--trendy-green))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 2.2 CSS Variables (index.css)

**Maritime Farbpalette:**
```css
:root {
  /* Navy Colors */
  --navy-deep: 215 70% 20%;
  --navy-primary: 220 65% 30%;
  
  /* Background & Foreground */
  --background: 210 25% 98%;
  --foreground: 210 15% 20%;
  
  /* Primary - Deep Navy */
  --primary: 210 60% 25%;
  --primary-foreground: 210 25% 98%;
  
  /* Secondary - Ocean Blue */
  --secondary: 210 40% 88%;
  --secondary-foreground: 210 60% 25%;
  
  /* Muted - Light Sea */
  --muted: 210 30% 92%;
  --muted-foreground: 210 20% 45%;
  
  /* Accent - Sea Foam */
  --accent: 195 50% 90%;
  --accent-foreground: 210 60% 25%;
  
  /* Status Colors */
  --success: 160 60% 35%;
  --warning: 45 85% 55%;
  --destructive: 0 75% 55%;
  
  /* Trendy Colors */
  --trendy-pink: 348 77% 67%;    /* #EE4266 */
  --trendy-navy: 202 85% 23%;    /* #0B4F6C */
  --trendy-cyan: 194 99% 47%;    /* #01BAEF */
  --trendy-light-green: 87 66% 84%; /* #D0FCB3 */
  --trendy-green: 133 28% 68%;   /* #9BC59D */
  
  /* Gradients */
  --gradient-header: linear-gradient(to right, hsl(215, 70%, 20%), hsl(220, 65%, 30%));
  --gradient-ocean: linear-gradient(135deg, hsl(210, 60%, 45%) 0%, hsl(195, 55%, 60%) 100%);
  
  /* Shadows */
  --shadow-card: 0 4px 20px -8px hsl(210 60% 25% / 0.15);
  --shadow-button: 0 2px 8px -2px hsl(210 60% 25% / 0.2);
  
  --radius: 0.375rem;
}
```

## 3. UI Component Library

### 3.1 shadcn/ui (Radix UI Primitives)

```json
{
  "@radix-ui/react-accordion": "^1.2.11",
  "@radix-ui/react-alert-dialog": "^1.1.14",
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-collapsible": "^1.1.11",
  "@radix-ui/react-context-menu": "^2.2.15",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-hover-card": "^1.1.14",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-menubar": "^1.1.15",
  "@radix-ui/react-navigation-menu": "^1.2.13",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-radio-group": "^1.3.7",
  "@radix-ui/react-scroll-area": "^1.2.9",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-toast": "^1.2.14",
  "@radix-ui/react-toggle": "^1.1.9",
  "@radix-ui/react-toggle-group": "^1.1.10",
  "@radix-ui/react-tooltip": "^1.2.7"
}
```

**Verwendete shadcn/ui Komponenten:**
- Accordion, Alert, AlertDialog
- Avatar, Badge, Button
- Calendar, Card, Carousel
- Checkbox, Collapsible, Command
- Context Menu, Dialog, Drawer (vaul)
- Dropdown Menu, Form, Hover Card
- Input, Label, Menubar
- Navigation Menu, Pagination
- Popover, Progress, Radio Group
- Scroll Area, Select, Separator
- Sheet, Skeleton, Slider
- Sonner (Toast), Switch, Table
- Tabs, Textarea, Toggle
- Tooltip

### 3.2 Zusätzliche UI Libraries

```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "lucide-react": "^0.542.0",
  "sonner": "^1.7.4",
  "vaul": "^0.9.9",
  "cmdk": "^1.1.1",
  "react-colorful": "^5.6.1",
  "embla-carousel-react": "^8.6.0",
  "react-resizable-panels": "^2.1.9",
  "recharts": "^2.15.4"
}
```

## 4. State Management

### 4.1 TanStack React Query 5

```json
{
  "@tanstack/react-query": "^5.83.0"
}
```

**Query Client Konfiguration:**
```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Query Keys Pattern:**
```typescript
// src/lib/query-keys.ts
export const QUERY_KEYS = {
  slots: ['slots'] as const,
  users: ['users'] as const,
  user: (id: string) => ['user', id] as const,
  profile: ['profile'] as const,
  settings: ['settings'] as const,
  settingsBatch: ['settings-batch'] as const,
  files: ['files'] as const,
  themeSettings: ['theme-settings'] as const,
  roleBadgeSettings: ['role-badge-settings'] as const,
  dashboardSettings: (role: string) => ['dashboard-settings', role] as const,
  footerSettings: (role: string) => ['footer-settings', role] as const,
};
```

### 4.2 React Context

**Verwendete Contexts:**
1. `AuthContext` - Supabase Auth State
2. `RoleContext` - Benutzer-Rollen und Berechtigungen
3. `SlotsContext` - Slot-Daten mit Realtime
4. `ConsecutiveSlotsContext` - Consecutive Slots Feature

## 5. Forms & Validation

### 5.1 React Hook Form

```json
{
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0"
}
```

### 5.2 Zod Validation

```json
{
  "zod": "^3.25.76"
}
```

**Beispiel Schema:**
```typescript
import { z } from "zod";

export const LoginBackgroundSchema = z.object({
  type: z.enum(['color', 'gradient', 'image', 'video']),
  colorValue: z.string().optional(),
  gradientStart: z.string().optional(),
  gradientEnd: z.string().optional(),
  imagePath: z.string().nullable().optional(),
  videoPath: z.string().nullable().optional(),
  overlayEnabled: z.boolean().optional(),
  overlayOpacity: z.number().min(0).max(100).optional(),
});
```

## 6. Date Handling

```json
{
  "date-fns": "^4.1.0",
  "date-fns-tz": "^3.2.0",
  "react-day-picker": "^8.10.1"
}
```

**Locale Setup:**
```typescript
import { de } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

// Formatierung
format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de });
// → "Donnerstag, 23. Januar 2026"

format(new Date(), 'EEE, dd.MM.yyyy', { locale: de });
// → "Do, 23.01.2026"
```

## 7. Routing

### 7.1 React Router DOM 6

```json
{
  "react-router-dom": "^6.30.1"
}
```

**Router Setup:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/kalender" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/mitglieder" element={
          <ProtectedRoute allowedRoles={['admin', 'vorstand']}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 8. Backend (Supabase)

### 8.1 Supabase Client

```json
{
  "@supabase/supabase-js": "^2.58.0"
}
```

**Client Setup:**
```typescript
// src/integrations/supabase/client.ts (auto-generated)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

### 8.2 Edge Functions (Deno)

**Runtime:** Deno (TypeScript)
**Deployment:** Automatisch via Lovable Cloud

**Standard Template:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Implementation
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## 9. Drag & Drop

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0"
}
```

## 10. Testing

```json
{
  "vitest": "^4.0.15",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1"
}
```

## 11. Development Tools

```json
{
  "eslint": "^9.32.0",
  "@eslint/js": "^9.32.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.20",
  "typescript-eslint": "^8.38.0",
  "lovable-tagger": "^1.1.9"
}
```

## 12. Vollständige package.json

```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.58.0",
    "@tanstack/react-query": "^5.83.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.542.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-colorful": "^5.6.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "vitest": "^4.0.15",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "lovable-tagger": "^1.1.9",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "vite": "^5.4.19"
  }
}
```

---

**Letzte Aktualisierung**: 2026-01-23
