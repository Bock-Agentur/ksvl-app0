/**
 * Centralized role order configuration
 * This ensures consistent role badge ordering across the application
 */

export const ROLE_ORDER = [
  'admin',
  'vorstand',
  'kranfuehrer',
  'mitglied',
  'gastmitglied',
] as const;

export type AppRole = typeof ROLE_ORDER[number];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  vorstand: 'Vorstand',
  kranfuehrer: 'Kranführer',
  mitglied: 'Mitglied',
  gastmitglied: 'Gastmitglied',
};

/**
 * Sort roles according to the defined order
 */
export function sortRoles(roles: string[]): string[] {
  return roles.sort((a, b) => {
    const indexA = ROLE_ORDER.indexOf(a as AppRole);
    const indexB = ROLE_ORDER.indexOf(b as AppRole);
    
    // If role not found in order, put it at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}
