# KSVL Slot Manager - Authentifizierung & Rollen

## 1. Übersicht

Das Auth-System basiert auf Supabase Auth mit folgenden Features:

- Email/Passwort-Authentifizierung
- Username-Login (konvertiert intern zu Email)
- Multi-Rollen-System (Benutzer können mehrere Rollen haben)
- JWT-basierte Session-Verwaltung
- Auto-Confirm für Email-Signups

## 2. AuthContext

**Datei:** `src/contexts/auth-context.tsx`

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 3. RoleProvider & useRole

**Datei:** `src/hooks/core/auth/use-role.tsx`

### 3.1 Rollen-Typen

```typescript
// src/types/user.ts
export type UserRole = 'admin' | 'vorstand' | 'kranfuehrer' | 'mitglied' | 'gastmitglied';

export interface RoleContextType {
  currentRole: UserRole;
  currentUser: User | null;
  setRole: (role: UserRole) => void;
  setCurrentUser: (user: User | null) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isLoading: boolean;
}
```

### 3.2 RoleProvider Implementation

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserData } from '@/hooks/core/data/use-users-data';
import { useAuth } from '@/contexts/auth-context';
import { UserRole, User, RoleContextType } from '@/types';

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  vorstand: 80,
  kranfuehrer: 60,
  mitglied: 40,
  gastmitglied: 20,
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { user: userData, isLoading: userLoading } = useUserData(authUser?.id);
  
  const [currentRole, setCurrentRole] = useState<UserRole>('mitglied');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (userData) {
      // Determine highest role
      const roles = userData.roles || ['mitglied'];
      const highestRole = roles.reduce((highest, role) => {
        return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[highest] ? role : highest;
      }, 'mitglied' as UserRole);
      
      setCurrentRole(highestRole);
      setCurrentUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: roles,
        // ... other fields
      });
    }
  }, [userData]);

  const hasPermission = (requiredRole: UserRole): boolean => {
    return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    const userRoles = currentUser?.roles || [currentRole];
    return roles.some(role => userRoles.includes(role));
  };

  return (
    <RoleContext.Provider value={{
      currentRole,
      currentUser,
      setRole: setCurrentRole,
      setCurrentUser,
      hasPermission,
      hasAnyRole,
      isLoading: authLoading || userLoading,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
```

## 4. usePermissions Hook

**Datei:** `src/hooks/core/auth/use-permissions.tsx`

```typescript
import { useRole } from './use-role';

export function usePermissions() {
  const { currentRole, currentUser } = useRole();

  // Multi-Role System - Admin, Vorstand und Kranführer können Slots verwalten
  const canManageSlots = 
    currentUser?.roles?.includes("kranfuehrer") || 
    currentUser?.roles?.includes("admin") || 
    currentUser?.roles?.includes("vorstand") ||
    currentRole === "kranfuehrer" || 
    currentRole === "admin" || 
    currentRole === "vorstand";

  const canBookSlots = 
    currentUser?.roles?.includes("mitglied") || 
    currentUser?.roles?.includes("kranfuehrer") || 
    currentUser?.roles?.includes("admin") || 
    currentUser?.roles?.includes("vorstand") ||
    currentRole === "mitglied" || 
    currentRole === "kranfuehrer" || 
    currentRole === "admin" || 
    currentRole === "vorstand";

  return {
    canManageSlots,
    canBookSlots,
    currentRole,
    currentUser
  };
}
```

## 5. ProtectedRoute Component

**Datei:** `src/components/common/protected-route.tsx`

```typescript
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useRole } from '@/hooks';
import { UserRole } from '@/types';
import { PageLoader } from './page-loader';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, isLoading: authLoading } = useAuth();
  const { currentRole, hasAnyRole, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
      return;
    }

    if (!roleLoading && allowedRoles && !hasAnyRole(allowedRoles)) {
      navigate('/');
    }
  }, [session, authLoading, roleLoading, allowedRoles, hasAnyRole, navigate]);

  if (authLoading || roleLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return null;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
```

## 6. Login-Seite (Auth.tsx)

**Datei:** `src/pages/Auth.tsx`

### 6.1 Login Flow

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    let loginEmail = email;
    
    // Check if input is username (no @)
    if (!email.includes('@')) {
      const { data: emailData } = await supabase.rpc('get_email_for_login', {
        username_input: email
      });
      
      if (emailData) {
        loginEmail = emailData;
      } else {
        throw new Error('Benutzername nicht gefunden');
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) throw error;
    
    navigate('/');
  } catch (error: any) {
    toast({
      title: "Login fehlgeschlagen",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

### 6.2 Passwort Reset Flow

```typescript
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) throw error;
    
    toast({
      title: "E-Mail gesendet",
      description: "Bitte prüfen Sie Ihr E-Mail-Postfach für den Reset-Link.",
    });
    setMode('login');
  } catch (error: any) {
    toast({
      title: "Fehler",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

### 6.3 Passwort Update (nach Reset)

```typescript
const handleUpdatePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    
    toast({
      title: "Passwort aktualisiert",
      description: "Ihr Passwort wurde erfolgreich geändert.",
    });
    navigate('/');
  } catch (error: any) {
    toast({
      title: "Fehler",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

## 7. Rollen-Hierarchie

| Rolle | Level | Beschreibung | Berechtigungen |
|-------|-------|--------------|----------------|
| `admin` | 100 | Technischer Admin | Vollzugriff, Benutzerverwaltung, alle Einstellungen |
| `vorstand` | 80 | Vereinsvorstand | Mitgliederverwaltung, Slot-Erstellung, Reports |
| `kranfuehrer` | 60 | Kranführer | Slot-Erstellung und -Verwaltung |
| `mitglied` | 40 | Normales Mitglied | Profil, Slot-Buchung, Dashboard |
| `gastmitglied` | 20 | Gastmitglied | Eingeschränkter Zugriff, nur eigenes Profil |

## 8. Routen-Zugriff

| Route | Erlaubte Rollen |
|-------|-----------------|
| `/auth` | Public |
| `/` | Alle authentifizierten |
| `/kalender` | Alle authentifizierten |
| `/profil` | Alle authentifizierten |
| `/mitglieder` | admin, vorstand |
| `/dateimanager` | admin, vorstand |
| `/einstellungen` | admin |
| `/berichte` | admin, vorstand |

## 9. Provider-Setup (App.tsx)

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { RoleProvider } from "@/hooks/core/auth/use-role";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/mitglieder" element={
                  <ProtectedRoute allowedRoles={['admin', 'vorstand']}>
                    <Users />
                  </ProtectedRoute>
                } />
                {/* ... weitere Routes */}
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

## 10. Supabase Auth Konfiguration

**Auto-Confirm aktivieren:**
```typescript
// Via Lovable Cloud / Supabase Dashboard
{
  "auth": {
    "autoConfirmEmail": true,
    "disableSignup": false
  }
}
```

## 11. Barrel Exports

**Datei:** `src/hooks/core/auth/index.ts`

```typescript
export { RoleProvider, useRole } from './use-role';
export { usePermissions } from './use-permissions';
```

**Datei:** `src/hooks/index.ts`

```typescript
export * from './core/auth';
export * from './core/data';
export * from './core/settings';
export * from './core/ui';
export * from './core/forms';
```

---

**Letzte Aktualisierung**: 2026-01-23
