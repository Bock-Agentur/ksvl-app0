/**
 * Dashboard Settings Hook
 * Manages dashboard configuration and widget visibility
 */

import { useState, useEffect } from "react";
import { DashboardSettings, DEFAULT_DASHBOARD_SETTINGS } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";

const STORAGE_KEY = "dashboard-settings";

export function useDashboardSettings(userRole: UserRole, isAdmin: boolean = false) {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // For admins configuring other roles, use a different storage key pattern
  const getStorageKey = (role: UserRole) => {
    if (isAdmin && role !== userRole) {
      return `${STORAGE_KEY}-template-${role}`; // Admin templates for other roles
    }
    return `${STORAGE_KEY}-${role}`; // Regular user settings
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = getStorageKey(userRole);
      let stored = localStorage.getItem(storageKey);
      
      // If no user settings exist and not admin, try to load admin template
      if (!stored && !isAdmin) {
        const templateKey = `${STORAGE_KEY}-template-${userRole}`;
        const template = localStorage.getItem(templateKey);
        if (template) {
          stored = template;
          console.log(`Loading admin template for ${userRole} role`);
        }
      }
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure we have the complete structure
        setSettings(prevSettings => ({ 
          ...DEFAULT_DASHBOARD_SETTINGS, 
          ...parsed,
          // Merge widget settings properly
          widgetSettings: {
            ...DEFAULT_DASHBOARD_SETTINGS.widgetSettings,
            ...parsed.widgetSettings
          }
        }));
      } else {
        // Set defaults if no stored settings
        setSettings(DEFAULT_DASHBOARD_SETTINGS);
      }
    } catch (error) {
      console.warn("Failed to load dashboard settings:", error);
      setSettings(DEFAULT_DASHBOARD_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [userRole, isAdmin]);

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      const storageKey = getStorageKey(userRole);
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
      
      // If admin is configuring templates for other users, also notify
      if (isAdmin && userRole !== 'admin') {
        console.log(`Admin template saved for ${userRole} role`);
      }
    } catch (error) {
      console.error("Failed to save dashboard settings:", error);
    }
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
    setSettings(DEFAULT_DASHBOARD_SETTINGS);
    try {
      const storageKey = getStorageKey(userRole);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to reset dashboard settings:", error);
    }
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