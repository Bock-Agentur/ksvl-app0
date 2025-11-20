/**
 * Dashboard Settings Hook
 * Manages dashboard configuration and widget visibility
 */

import { useMemo } from "react";
import { useAppSettings } from "./use-app-settings";
import { DashboardSettings, DEFAULT_DASHBOARD_SETTINGS } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";

export function useDashboardSettings(userRole: UserRole, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  // Alle Benutzer laden Templates - nur Admins können diese bearbeiten (via Route Protection)
  const storageKey = `dashboard-settings-template-${userRole}`;
  
  const { value: rawSettings, setValue, isLoading } = useAppSettings<DashboardSettings>(
    storageKey,
    DEFAULT_DASHBOARD_SETTINGS,
    true, // Globale Template-Speicherung
    { enabled }
  );

  // ✅ Migration: Ensure headerCard is in enabledSections (memoized)
  const settings = useMemo(() => ({
    ...rawSettings,
    enabledSections: rawSettings.enabledSections?.includes('headerCard') 
      ? rawSettings.enabledSections 
      : ['headerCard', ...(rawSettings.enabledSections || [])]
  }), [rawSettings]);

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