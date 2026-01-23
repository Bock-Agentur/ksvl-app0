# KSVL Slot Manager - Navigation & Routing

## 1. Routes Registry (`src/lib/registry/routes.ts`)

```typescript
export const ROUTES = {
  public: { auth: { path: '/auth', label: 'Login' } },
  protected: {
    dashboard: { path: '/', label: 'Dashboard', allowedRoles: ['admin', 'vorstand', 'kranfuehrer', 'mitglied', 'gastmitglied'] },
    calendar: { path: '/kalender', label: 'Kalender', allowedRoles: [...] },
    profile: { path: '/profil', label: 'Profil', allowedRoles: [...] },
    users: { path: '/mitglieder', label: 'Mitglieder', allowedRoles: ['admin', 'vorstand'] },
    fileManager: { path: '/dateimanager', label: 'Dateimanager', allowedRoles: ['admin', 'vorstand'] },
    settings: { path: '/einstellungen', label: 'Einstellungen', allowedRoles: ['admin'] },
    reports: { path: '/berichte', label: 'Berichte', allowedRoles: ['admin', 'vorstand'] },
  }
};
```

## 2. Navigation Registry (`src/lib/registry/navigation.ts`)

```typescript
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', route: 'dashboard', roles: [...], position: 'bottom' },
  { id: 'calendar', label: 'Kalender', icon: 'Calendar', route: 'calendar', roles: [...], position: 'bottom' },
  { id: 'profile', label: 'Profil', icon: 'User', route: 'profile', roles: [...], position: 'bottom' },
  { id: 'users', label: 'Mitglieder', icon: 'Users', route: 'users', roles: ['admin', 'vorstand'], position: 'drawer' },
  // ...
];
```

## 3. UnifiedFooter

Bottom-Navigation mit rollenbasierter Sichtbarkeit + Drawer für zusätzliche Items.

---

**Letzte Aktualisierung**: 2026-01-23
