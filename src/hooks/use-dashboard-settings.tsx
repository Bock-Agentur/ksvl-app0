/**
 * Dashboard Settings Hook
 * Manages dashboard configuration and widget visibility
 */

import { useAppSettings } from "./use-app-settings";
import { DashboardSettings, DEFAULT_DASHBOARD_SETTINGS } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";

export function useDashboardSettings(userRole: UserRole, isAdmin: boolean = false, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  // Determine storage key based on context
  const getStorageKey = (role: UserRole) => {
    if (isAdmin) {
      // Admins always work with templates
      return `dashboard-settings-template-${role}`;
    }
    return `dashboard-settings-${role}`; // Regular user settings
  };

  const storageKey = getStorageKey(userRole);
  const templateKey = `dashboard-settings-template-${userRole}`;
  
  // Load user settings
  const { value: rawSettings, setValue, isLoading } = useAppSettings<DashboardSettings>(
    storageKey,
    DEFAULT_DASHBOARD_SETTINGS,
    false,
    { enabled }
  );
  
  // Load template settings as fallback (only for non-admins)
  const { value: templateSettings } = useAppSettings<DashboardSettings>(
    templateKey,
    DEFAULT_DASHBOARD_SETTINGS,
    false,
    { enabled: enabled && !isAdmin }
  );
  
  // Merge: Use user settings if they exist, otherwise use template settings
  const mergedSettings = !isAdmin && templateSettings && Object.keys(rawSettings).length === Object.keys(DEFAULT_DASHBOARD_SETTINGS).length
    ? templateSettings
    : rawSettings;

  // Migration: Ensure headerCard is in enabledSections
  const settings = {
    ...mergedSettings,
    enabledSections: mergedSettings.enabledSections?.includes('headerCard') 
      ? mergedSettings.enabledSections 
      : ['headerCard', ...(mergedSettings.enabledSections || [])]
  };

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