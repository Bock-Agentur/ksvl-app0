/**
 * Navigation Registry
 * 
 * Central route definitions with role-based access control.
 * Provides single source of truth for all app routes.
 */

import { UserRole } from '@/types';

export interface RouteMetadata {
  path: string;
  label: string;
  allowedRoles: UserRole[] | '*'; // '*' = all authenticated users
  icon?: string;
  description?: string;
}

export interface RouteRegistry {
  public: Record<string, RouteMetadata>;
  protected: Record<string, RouteMetadata>;
}

/**
 * App Route Registry
 * 
 * Defines all routes in the application with metadata and access control.
 */
export const ROUTES: RouteRegistry = {
  // Public routes (no authentication required)
  public: {
    auth: {
      path: '/auth',
      label: 'Anmelden',
      allowedRoles: '*',
      description: 'Login und Registrierung'
    }
  },

  // Protected routes (authentication required)
  protected: {
    dashboard: {
      path: '/',
      label: 'Dashboard',
      allowedRoles: '*', // All authenticated users
      icon: 'LayoutDashboard',
      description: 'Startseite mit Übersicht'
    },
    
    users: {
      path: '/mitglieder',
      label: 'Mitgliederverwaltung',
      allowedRoles: ['admin', 'vorstand'],
      icon: 'Users',
      description: 'Benutzerverwaltung und Profile'
    },
    
    fileManager: {
      path: '/dateimanager',
      label: 'Dateimanager',
      allowedRoles: ['admin', 'vorstand'],
      icon: 'Folder',
      description: 'Dokumentenverwaltung'
    },
    
    settings: {
      path: '/settings',
      label: 'Einstellungen',
      allowedRoles: ['admin'],
      icon: 'Settings',
      description: 'App-Einstellungen und Konfiguration'
    },
    
    reports: {
      path: '/berichte',
      label: 'Berichte',
      allowedRoles: ['admin', 'vorstand'],
      icon: 'FileText',
      description: 'Berichte und Statistiken'
    },

    settingsManager: {
      path: '/einstellungen/settings-manager',
      label: 'Settings Manager',
      allowedRoles: ['admin'],
      icon: 'Database',
      description: 'Erweiterte Settings-Verwaltung'
    }
  }
};

/**
 * Helper: Get route by path
 */
export function getRouteByPath(path: string): RouteMetadata | null {
  // Check public routes
  const publicRoute = Object.values(ROUTES.public).find(r => r.path === path);
  if (publicRoute) return publicRoute;
  
  // Check protected routes
  const protectedRoute = Object.values(ROUTES.protected).find(r => r.path === path);
  if (protectedRoute) return protectedRoute;
  
  return null;
}

/**
 * Helper: Check if user has access to route
 * 
 * Uses ROUTES.allowedRoles for access control.
 */
export function hasRouteAccess(
  path: string, 
  userRoles: UserRole[]
): boolean {
  const route = getRouteByPath(path);
  if (!route) return false;
  
  // Public route or all authenticated users
  if (route.allowedRoles === '*') return true;
  
  // Check if user has any of the required roles
  return (route.allowedRoles as UserRole[]).some(role => userRoles.includes(role));
}

/**
 * Helper: Get all routes accessible by user roles
 */
export function getAccessibleRoutes(
  userRoles: UserRole[],
  includePublic: boolean = false
): RouteMetadata[] {
  const routes: RouteMetadata[] = [];
  
  if (includePublic) {
    routes.push(...Object.values(ROUTES.public));
  }
  
  Object.values(ROUTES.protected).forEach(route => {
    if (route.allowedRoles === '*' || 
        (Array.isArray(route.allowedRoles) && route.allowedRoles.some(role => userRoles.includes(role)))) {
      routes.push(route);
    }
  });
  
  return routes;
}

/**
 * Helper: Check if route is protected
 */
export function isProtectedRoute(path: string): boolean {
  return Object.values(ROUTES.protected).some(r => r.path === path);
}

/**
 * Helper: Check if route is public
 */
export function isPublicRoute(path: string): boolean {
  return Object.values(ROUTES.public).some(r => r.path === path);
}
