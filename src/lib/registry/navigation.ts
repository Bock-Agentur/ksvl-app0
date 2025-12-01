/**
 * Central Navigation Registry
 * 
 * Single source of truth for all navigation items across the app.
 * Used by: UnifiedFooter, FooterDrawerContent, Menu Settings
 */

import { UserRole } from '@/types';
import { ROUTES } from './routes';

export interface NavItem {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  routeId: keyof typeof ROUTES.protected | null;
  tabId?: string; // For dashboard tabs (on Index.tsx)
  allowedRoles: UserRole[] | '*';
  position: ('bottom' | 'drawer')[];
  order: number;
  badge?: string; // Optional badge for notifications
  deprecated?: boolean;
}

/**
 * Central Navigation Items Registry
 * 
 * This is the SINGLE SOURCE OF TRUTH for all navigation items.
 * All menus (footer, drawer) derive from this configuration.
 */
export const NAV_ITEMS: NavItem[] = [
  // === BOTTOM NAV - All Roles (Core Navigation) ===
  { 
    id: 'dashboard', 
    label: 'Home', 
    icon: 'Home', 
    routeId: 'dashboard', 
    tabId: 'dashboard',
    allowedRoles: '*', 
    position: ['bottom'], 
    order: 0 
  },
  { 
    id: 'calendar', 
    label: 'Kalender', 
    icon: 'Calendar', 
    routeId: 'dashboard', 
    tabId: 'calendar',
    allowedRoles: '*', 
    position: ['bottom'], 
    order: 1 
  },
  { 
    id: 'profile', 
    label: 'Profil', 
    icon: 'User', 
    routeId: 'dashboard', 
    tabId: 'profile',
    allowedRoles: '*', 
    position: ['bottom'], 
    order: 2 
  },
  
  // === BOTTOM NAV - Operator Roles ===
  { 
    id: 'slots', 
    label: 'Slots', 
    icon: 'Layers', 
    routeId: 'dashboard', 
    tabId: 'slots',
    allowedRoles: ['admin', 'kranfuehrer', 'vorstand'], 
    position: ['bottom', 'drawer'], 
    order: 3 
  },
  { 
    id: 'settings', 
    label: 'Einstellungen', 
    icon: 'Settings', 
    routeId: 'settings',
    allowedRoles: ['admin'], 
    position: ['bottom', 'drawer'], 
    order: 4 
  },
  
  // === DRAWER - Admin/Vorstand Only ===
  { 
    id: 'users', 
    label: 'Mitglieder', 
    icon: 'Users', 
    routeId: 'users',
    allowedRoles: ['admin', 'vorstand'], 
    position: ['drawer'], 
    order: 10 
  },
  { 
    id: 'file-manager', 
    label: 'Dateien', 
    icon: 'FolderOpen', 
    routeId: 'fileManager',
    allowedRoles: ['admin', 'vorstand'], 
    position: ['drawer'], 
    order: 11 
  },
  { 
    id: 'reports', 
    label: 'Berichte', 
    icon: 'BarChart3', 
    routeId: 'reports',
    allowedRoles: ['admin', 'vorstand'], 
    position: ['drawer'], 
    order: 12 
  },
  
  // === ADDITIONAL ITEMS (Available for Footer Settings) ===
  { 
    id: 'notifications', 
    label: 'Hinweise', 
    icon: 'Bell',
    routeId: null,
    allowedRoles: '*', 
    position: [], 
    order: 20,
    deprecated: true // Not used yet, but available for customization
  },
  { 
    id: 'help', 
    label: 'Hilfe', 
    icon: 'HelpCircle',
    routeId: null,
    allowedRoles: '*', 
    position: [], 
    order: 21,
    deprecated: true
  },
  { 
    id: 'weather', 
    label: 'Wetter', 
    icon: 'Cloud',
    routeId: null,
    allowedRoles: '*', 
    position: [], 
    order: 22,
    deprecated: true
  },
  { 
    id: 'harbor', 
    label: 'Hafenstatus', 
    icon: 'Anchor',
    routeId: null,
    allowedRoles: '*', 
    position: [], 
    order: 23,
    deprecated: true
  },
];

/**
 * Route Visibility Configuration
 * 
 * Defines where navigation components should be shown/hidden.
 */
export const ROUTE_VISIBILITY = {
  // Routes where footer is hidden
  hideFooter: ['/auth'],
  
  // Routes where drawer is available (admin/vorstand only)
  showDrawer: ['/', '/settings', '/dateimanager', '/berichte', '/mitglieder'],
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get navigation items filtered by role and position
 * 
 * @param role - Current user role
 * @param position - Navigation position ('bottom' | 'drawer')
 * @returns Filtered and sorted navigation items
 */
export function getNavItemsForRole(
  role: UserRole, 
  position: 'bottom' | 'drawer'
): NavItem[] {
  return NAV_ITEMS
    .filter(item => !item.deprecated)
    .filter(item => item.position.includes(position))
    .filter(item => item.allowedRoles === '*' || item.allowedRoles.includes(role))
    .sort((a, b) => a.order - b.order);
}

/**
 * Get the route path for a navigation item
 * 
 * @param item - Navigation item
 * @returns Route path string
 */
export function getNavItemPath(item: NavItem): string {
  if (!item.routeId) return '/';
  
  const route = ROUTES.protected[item.routeId];
  return route?.path ?? '/';
}

/**
 * Check if a navigation item is currently active
 * 
 * @param item - Navigation item
 * @param currentPath - Current route path
 * @param activeTab - Active dashboard tab (if on dashboard)
 * @returns True if item is active
 */
export function isNavItemActive(
  item: NavItem, 
  currentPath: string, 
  activeTab?: string
): boolean {
  // Route-based items (not dashboard)
  if (item.routeId && item.routeId !== 'dashboard') {
    const routePath = ROUTES.protected[item.routeId]?.path;
    return currentPath === routePath;
  }
  
  // Tab-based items (dashboard)
  if (currentPath === '/' && item.tabId) {
    return activeTab === item.tabId;
  }
  
  return false;
}

/**
 * Get all available nav items for a role (including deprecated for settings)
 * 
 * @param role - User role
 * @returns All nav items accessible by this role
 */
export function getAllNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS
    .filter(item => item.allowedRoles === '*' || item.allowedRoles.includes(role))
    .sort((a, b) => a.order - b.order);
}
