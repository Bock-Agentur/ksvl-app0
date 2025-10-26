import { useAppSettings } from "./use-app-settings";

export interface StickyHeaderLayoutSettings {
  enabled: boolean; // Master-Schalter
  pages: {
    calendar: boolean;
    slotManagement: boolean;
    userManagement: boolean;
  };
}

const DEFAULT_SETTINGS: StickyHeaderLayoutSettings = {
  enabled: true,
  pages: {
    calendar: true,
    slotManagement: true,
    userManagement: true,
  }
};

export function useStickyHeaderLayout() {
  const { value, setValue, isLoading } = useAppSettings<StickyHeaderLayoutSettings>(
    'sticky_header_layout',
    DEFAULT_SETTINGS,
    true // global setting
  );

  // Migration: Ensure pages object exists (for backward compatibility)
  const settings: StickyHeaderLayoutSettings = {
    enabled: value.enabled,
    pages: value.pages || {
      calendar: value.enabled,
      slotManagement: value.enabled,
      userManagement: value.enabled,
    }
  };

  // Helper: Prüfen ob Seite sticky sein soll
  const isPageSticky = (page: keyof StickyHeaderLayoutSettings['pages']) => {
    return settings.enabled && settings.pages[page];
  };

  // Helper: Einzelne Seite togglen
  const togglePage = (page: keyof StickyHeaderLayoutSettings['pages'], enabled: boolean) => {
    setValue({
      ...settings,
      pages: {
        ...settings.pages,
        [page]: enabled,
      }
    });
  };

  return {
    settings,
    setSettings: setValue,
    isPageSticky,
    togglePage,
    isLoading
  };
}
