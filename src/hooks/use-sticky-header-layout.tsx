import { useSettingsBatch } from "./use-settings-batch";

export interface StickyHeaderLayoutSettings {
  enabled: boolean; // Master-Schalter
  pages: {
    calendar: boolean;
    slotManagement: boolean;
    userManagement: boolean;
    profile: boolean;
    settings: boolean;
  };
}

const DEFAULT_SETTINGS: StickyHeaderLayoutSettings = {
  enabled: true,
  pages: {
    calendar: true,
    slotManagement: true,
    userManagement: true,
    profile: true,
    settings: true,
  }
};

export function useStickyHeaderLayout(options?: { enabled?: boolean }) {
  const hookEnabled = options?.enabled ?? true;
  
  const { getSetting, updateSetting, isLoading } = useSettingsBatch({ enabled: hookEnabled });
  
  const value = getSetting<StickyHeaderLayoutSettings>(
    'sticky_header_layout',
    DEFAULT_SETTINGS
  );

  // Migration: Ensure pages object exists (for backward compatibility)
  const settings: StickyHeaderLayoutSettings = {
    enabled: value.enabled,
    pages: value.pages || {
      calendar: value.enabled,
      slotManagement: value.enabled,
      userManagement: value.enabled,
      profile: value.enabled,
      settings: value.enabled,
    }
  };

  // Helper: Prüfen ob Seite sticky sein soll
  const isPageSticky = (page: keyof StickyHeaderLayoutSettings['pages']) => {
    return settings.enabled && settings.pages[page];
  };

  // Helper: Einzelne Seite togglen
  const togglePage = async (page: keyof StickyHeaderLayoutSettings['pages'], enabled: boolean) => {
    await updateSetting('sticky_header_layout', {
      ...settings,
      pages: {
        ...settings.pages,
        [page]: enabled,
      }
    }, true);
  };

  const setSettings = async (newSettings: StickyHeaderLayoutSettings) => {
    await updateSetting('sticky_header_layout', newSettings, true);
  };

  return {
    settings,
    setSettings,
    isPageSticky,
    togglePage,
    isLoading
  };
}
