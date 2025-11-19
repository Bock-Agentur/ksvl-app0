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
  
  // For non-admins: Start with template settings, but allow user overrides
  // If user has made any customizations, those take priority
  let settings: DashboardSettings;

  if (isAdmin) {
    // Admins edit templates directly
    settings = rawSettings;
  } else {
    // Non-admins: Check if they have custom settings
    const hasCustomSettings = rawSettings && (
      (rawSettings.enabledWidgets && rawSettings.enabledWidgets.length > 0) || 
      (rawSettings.enabledSections && rawSettings.enabledSections.length > 0)
    );
    
    if (hasCustomSettings) {
      // User has made customizations - use their settings
      settings = rawSettings;
    } else if (templateSettings) {
      // No customizations yet - use admin template
      settings = templateSettings;
    } else {
      // No template exists - use defaults
      settings = DEFAULT_DASHBOARD_SETTINGS;
    }
  }

  // Migration: Ensure headerCard is in enabledSections
  const finalSettings = {
    ...settings,
    enabledSections: settings.enabledSections?.includes('headerCard') 
      ? settings.enabledSections 
      : ['headerCard', ...(settings.enabledSections || [])]
  };

  // Save settings to database
  const saveSettings = (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...finalSettings, ...newSettings };
    setValue(updatedSettings);
  };

  const toggleWidget = (widgetId: string) => {
    const enabledWidgets = finalSettings.enabledWidgets.includes(widgetId)
      ? finalSettings.enabledWidgets.filter(id => id !== widgetId)
      : [...finalSettings.enabledWidgets, widgetId];
    
    saveSettings({ enabledWidgets });
  };

  const updateWidgetSettings = (widgetId: string, widgetSettings: any) => {
    const newWidgetSettings = {
      ...finalSettings.widgetSettings,
      [widgetId]: { ...finalSettings.widgetSettings[widgetId], ...widgetSettings }
    };
    
    saveSettings({ widgetSettings: newWidgetSettings });
  };

  const resetToDefaults = () => {
    setValue(DEFAULT_DASHBOARD_SETTINGS);
  };

  const toggleSection = (sectionKey: 'showWelcomeSection' | 'showStatsGrid' | 'showQuickActions' | 'showActivityFeed') => {
    saveSettings({ [sectionKey]: !finalSettings[sectionKey] });
  };

  const toggleItem = (itemId: string) => {
    // Check if it's a section or widget
    const isSectionId = ['headerCard', 'welcomeSection', 'statsGrid', 'quickActions', 'activityFeed'].includes(itemId);
    
    if (isSectionId) {
      const enabledSections = finalSettings.enabledSections?.includes(itemId)
        ? finalSettings.enabledSections.filter(id => id !== itemId)
        : [...(finalSettings.enabledSections || []), itemId];
      saveSettings({ enabledSections });
    } else {
      const enabledWidgets = finalSettings.enabledWidgets.includes(itemId)
        ? finalSettings.enabledWidgets.filter(id => id !== itemId)
        : [...finalSettings.enabledWidgets, itemId];
      saveSettings({ enabledWidgets });
    }
  };

  const isItemEnabled = (itemId: string): boolean => {
    const isSectionId = ['headerCard', 'welcomeSection', 'statsGrid', 'quickActions', 'activityFeed'].includes(itemId);
    return isSectionId 
      ? (finalSettings.enabledSections?.includes(itemId) ?? false)
      : finalSettings.enabledWidgets.includes(itemId);
  };

  const isWidgetEnabled = (widgetId: string): boolean => {
    return finalSettings.enabledWidgets.includes(widgetId);
  };

  return {
    settings: finalSettings,
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
