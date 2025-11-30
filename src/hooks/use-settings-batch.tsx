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
}

/**
 * Generate all possible setting keys that might be needed
 */
function getSettingKeys(userRole?: UserRole): string[] {
  const keys = [
    'marina-menu-settings-template',
    'login_background',
    'desktop_background',
    'header-message',
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
 * @param options Configuration options
 * @returns Query result with settings map, loading state, and refetch function
 */
export function useSettingsBatch(options: UseSettingsBatchOptions = {}) {
  const { enabled = true, userRole, userId } = options;
  const queryClient = useQueryClient();

  const settingKeys = getSettingKeys(userRole);

  const query = useQuery({
    queryKey: ['app-settings-batch', userRole, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('setting_key', settingKeys);

      if (error) throw error;

      // Convert array to map for easy lookup
      const settingsMap = new Map<string, SettingEntry>();
      data?.forEach(setting => {
        settingsMap.set(setting.setting_key, setting);
      });

      return settingsMap;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - settings change less frequently
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
