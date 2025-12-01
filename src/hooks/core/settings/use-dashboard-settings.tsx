/**
 * Dashboard Settings Hook
 * Manages dashboard configuration and widget visibility
 * ✅ Phase 2: Optimized migration (runs once, not on every render)
 */

import { useMemo, useEffect, useRef } from "react";
import { useSettingsBatch } from "./use-settings-batch";
import { DashboardSettings, DEFAULT_DASHBOARD_SETTINGS } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";

export function useDashboardSettings(userRole: UserRole, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const migrationDone = useRef(false);
  
  // ✅ Use batch settings loading
  const storageKey = `dashboard-settings-template-${userRole}`;
  const { getSetting, updateSetting, isLoading } = useSettingsBatch({ 
    enabled, 
    userRole 
  });
  
  const rawSettings = getSetting<DashboardSettings>(storageKey, DEFAULT_DASHBOARD_SETTINGS);

  // ✅ Phase 2: Ensure settings have all required fields with defaults
  const validatedSettings = useMemo(() => {
    // Merge with defaults to ensure all required fields exist
    return {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...rawSettings,
    } as DashboardSettings;
  }, [rawSettings]);

  // ✅ Phase 2: Migration runs ONCE per session (not on every render)
  const settings = useMemo(() => {
    const needsMigration = !validatedSettings.enabledSections?.includes('headerCard');
    
    if (needsMigration && !migrationDone.current) {
      return {
        ...validatedSettings,
        enabledSections: ['headerCard', ...(validatedSettings.enabledSections || [])]
      };
    }
    
    return validatedSettings;
  }, [validatedSettings]);

  // ✅ Save migration to DB (only once)
  useEffect(() => {
    if (!migrationDone.current && !settings.enabledSections?.includes('headerCard')) {
      const migratedSettings = {
        ...settings,
        enabledSections: ['headerCard', ...(settings.enabledSections || [])]
      };
      updateSetting(storageKey, migratedSettings, true);
      migrationDone.current = true;
    }
  }, [settings, storageKey, updateSetting]);

  // Save settings to database
  const saveSettings = async (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    await updateSetting(storageKey, updatedSettings, true);
  };

  const toggleWidget = (widgetId: string) => {
    const enabledWidgets = settings.enabledWidgets.includes(widgetId)
      ? settings.enabledWidgets.filter(id => id !== widgetId)
      : [...settings.enabledWidgets, widgetId];
    
    saveSettings({ enabledWidgets });
  };

  const updateWidgetSettings = (widgetId: string, widgetSettings: any) => {
    const newWidgetSettings = {
      ...settings.widgetSettings,
      [widgetId]: { ...settings.widgetSettings[widgetId], ...widgetSettings }
    };
    
    saveSettings({ widgetSettings: newWidgetSettings });
  };

  const resetToDefaults = async () => {
    await updateSetting(storageKey, DEFAULT_DASHBOARD_SETTINGS, true);
  };

  const toggleSection = (sectionKey: 'showWelcomeSection' | 'showStatsGrid' | 'showQuickActions' | 'showActivityFeed') => {
    saveSettings({ [sectionKey]: !settings[sectionKey] });
  };

  const toggleItem = (itemId: string) => {
    // Check if it's a section or widget
    const isSectionId = ['headerCard', 'welcomeSection', 'statsGrid', 'quickActions', 'activityFeed'].includes(itemId);
    
    if (isSectionId) {
      const enabledSections = settings.enabledSections?.includes(itemId)
        ? settings.enabledSections.filter(id => id !== itemId)
        : [...(settings.enabledSections || []), itemId];
      saveSettings({ enabledSections });
    } else {
      const enabledWidgets = settings.enabledWidgets.includes(itemId)
        ? settings.enabledWidgets.filter(id => id !== itemId)
        : [...settings.enabledWidgets, itemId];
      saveSettings({ enabledWidgets });
    }
  };

  const isItemEnabled = (itemId: string): boolean => {
    const isSectionId = ['headerCard', 'welcomeSection', 'statsGrid', 'quickActions', 'activityFeed'].includes(itemId);
    return isSectionId 
      ? (settings.enabledSections?.includes(itemId) ?? false)
      : settings.enabledWidgets.includes(itemId);
  };

  const isWidgetEnabled = (widgetId: string): boolean => {
    return settings.enabledWidgets.includes(widgetId);
  };

  return {
    settings,
    isLoading,
    saveSettings,
    toggleWidget,
    toggleSection,
    toggleItem,
    updateWidgetSettings,
    resetToDefaults,
    isWidgetEnabled,
    isItemEnabled
  };
}