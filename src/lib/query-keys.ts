/**
 * Centralized Query Keys Registry
 * 
 * All React Query cache keys should be defined here to:
 * - Prevent typos and inconsistencies
 * - Enable easy refactoring
 * - Provide single source of truth for cache invalidation
 */

export const QUERY_KEYS = {
  // User Data
  users: ['users-with-roles'] as const,
  userById: (userId: string) => ['users-with-roles', userId] as const,
  
  // Slots
  slots: ['slots'] as const,
  
  // Settings
  settingsBatch: (role?: string, userId?: string | null) => ['app-settings-batch', role, userId] as const,
  settingsAll: ['app-settings-all'] as const,
  
  // Theme
  themeSettings: ['theme-settings'] as const,
  
  // Role Badges
  roleBadgeSettings: ['role-badge-settings'] as const,
  
  // Custom Fields
  customFields: ['custom-fields'] as const,
  customFieldValues: (userId: string) => ['custom-field-values', userId] as const,
  
  // Files
  fileMetadata: (filters?: FileQueryFilters) => ['file-metadata', filters] as const,
  fileMetadataBase: ['file-metadata'] as const,
  filePermissions: (fileId: string) => ['file-permissions', fileId] as const,
} as const;

// File query filters for cache key
export interface FileQueryFilters {
  category?: string;
  file_type?: string;
  tags?: string[];
  linked_user_id?: string;
  date_from?: string;
  date_to?: string;
  owner_id?: string;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
}

// Type helper for query key inference
export type QueryKeys = typeof QUERY_KEYS;
