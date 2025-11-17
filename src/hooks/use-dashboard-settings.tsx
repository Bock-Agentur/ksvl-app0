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
  const storageKey = isAdmin 
    ? `dashboard-settings-template-${userRole}` 
    : `dashboard-settings-${userRole}`;
  
  const templateKey = `dashboard-settings-template-${userRole}`;
  
  // Always call both hooks to maintain consistent hook count
  const { value: rawSettings, setValue, isLoading } = useAppSettings<DashboardSettings>(
    storageKey,
    DEFAULT_DASHBOARD_SETTINGS,
    false,
    { enabled }
  );
  
  // Load template settings as fallback (always call hook, but only enable for non-admins)
  const { value: templateSettings } = useAppSettings<DashboardSettings>(
    templateKey,
    DEFAULT_DASHBOARD_SETTINGS,
    false,
    { enabled: enabled && !isAdmin }
  );
  
  // For non-admins: Use template settings if user has no custom settings
  const hasCustomSettings = rawSettings.enabledWidgets?.length !== DEFAULT_DASHBOARD_SETTINGS.enabledWidgets?.length ||
                            rawSettings.enabledSections?.length !== DEFAULT_DASHBOARD_SETTINGS.enabledSections?.length;
  
  const mergedSettings = !isAdmin && !hasCustomSettings && templateSettings 
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