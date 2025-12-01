/**
 * Settings Batch Loading Hook
 * 
 * Consolidates all app_settings queries into a single batch query
 * to eliminate redundant database calls.
 * 
 * Instead of 8-10 separate queries for different setting keys,
 * this hook fetches all required settings in one query.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/types/user";

interface SettingEntry {
  id: string;
  setting_key: string;
  setting_value: any;
  is_global: boolean;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseSettingsBatchOptions {
  enabled?: boolean;
  userRole?: UserRole;
  userId?: string | null;
  loadAll?: boolean; // Phase 3: Load ALL settings (for Admin UI)
}

/**
 * Generate all possible setting keys that might be needed
 * Phase 3: Extended to optionally load ALL settings
 */
function getSettingKeys(userRole?: UserRole, loadAll?: boolean): string[] {
  // Phase 3: If loadAll=true, return empty array to fetch all settings
  if (loadAll) {
    return []; // Will be handled in query with no .in() filter
  }

  const keys = [
    'marina-menu-settings-template',
    'login_background',
    'header-message',
    'sticky_header_layout',
    'slot-design-settings',
  ];

  // Add role-specific dashboard settings
  if (userRole) {
    keys.push(`dashboard-settings-template-${userRole}`);
    keys.push(`footer-settings-template-${userRole}`);
  } else {
    // If no role specified, include all role templates
    const roles: UserRole[] = ['admin', 'kranfuehrer', 'mitglied', 'gastmitglied', 'vorstand'];
    roles.forEach(role => {
      keys.push(`dashboard-settings-template-${role}`);
      keys.push(`footer-settings-template-${role}`);
    });
  }

  return keys;
}

/**
 * Fetches all app_settings in a single batch query
 * Phase 3: Extended to optionally load ALL settings
 * @param options Configuration options
 * @returns Query result with settings map, loading state, and refetch function
 */
export function useSettingsBatch(options: UseSettingsBatchOptions = {}) {
  const { enabled = true, userRole, userId, loadAll = false } = options;
  const queryClient = useQueryClient();

  const settingKeys = getSettingKeys(userRole, loadAll);

  const query = useQuery({
    queryKey: loadAll ? ['app-settings-all'] : ['app-settings-batch', userRole, userId],
    queryFn: async () => {
      let query = supabase.from('app_settings').select('*');

      // Phase 3: If loadAll=false, filter by specific keys
      if (!loadAll && settingKeys.length > 0) {
        query = query.in('setting_key', settingKeys);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Convert array to map for easy lookup
      const settingsMap = new Map<string, SettingEntry>();
      data?.forEach(setting => {
        settingsMap.set(setting.setting_key, setting);
      });

      return settingsMap;
    },
    enabled,
    staleTime: loadAll ? 30 * 1000 : 2 * 60 * 1000, // 30s for all, 2min for batch
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
  });

  /**
   * Get a specific setting value by key
   */
  const getSetting = <T = any>(key: string, defaultValue: T): T => {
    const setting = query.data?.get(key);
    return setting ? (setting.setting_value as T) : defaultValue;
  };

  /**
   * Update a specific setting (optimistic update + invalidation)
   */
  const updateSetting = async (key: string, value: any, isGlobal: boolean = true) => {
    // Check if setting exists
    const existingSetting = query.data?.get(key);

    if (existingSetting) {
      // Update existing
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('id', existingSetting.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('app_settings')
        .insert({
          setting_key: key,
          setting_value: value,
          is_global: isGlobal,
          user_id: userId || null,
        });

      if (error) throw error;
    }

    // Invalidate cache to refetch
    await queryClient.invalidateQueries({ queryKey: ['app-settings-batch'] });
  };

  return {
    settingsMap: query.data || new Map(),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    getSetting,
    updateSetting,
  };
}
