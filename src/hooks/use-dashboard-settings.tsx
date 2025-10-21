/**
 * Dashboard Settings Hook
 * Manages dashboard configuration and widget visibility
 */

import { useAppSettings } from "./use-app-settings";
import { DashboardSettings, DEFAULT_DASHBOARD_SETTINGS } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";

export function useDashboardSettings(userRole: UserRole, isAdmin: boolean = false) {
  // For admins configuring other roles, use a different storage key pattern
  const getStorageKey = (role: UserRole) => {
    if (isAdmin && role !== userRole) {
      return `dashboard-settings-template-${role}`; // Admin templates for other roles
    }
    return `dashboard-settings-${role}`; // Regular user settings
  };

  const storageKey = getStorageKey(userRole);
  const { value: settings, setValue, isLoading } = useAppSettings<DashboardSettings>(
    storageKey,
    DEFAULT_DASHBOARD_SETTINGS,
    false
  );

  // Save settings to database
  const saveSettings = (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setValue(updatedSettings);
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

  const resetToDefaults = () => {
    setValue(DEFAULT_DASHBOARD_SETTINGS);
  };

  const toggleSection = (sectionKey: 'showWelcomeSection' | 'showStatsGrid' | 'showQuickActions' | 'showActivityFeed') => {
    saveSettings({ [sectionKey]: !settings[sectionKey] });
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
    updateWidgetSettings,
    resetToDefaults,
    isWidgetEnabled
  };
}