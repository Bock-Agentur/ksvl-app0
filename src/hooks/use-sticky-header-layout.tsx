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

  // Helper: Prüfen ob Seite sticky sein soll
  const isPageSticky = (page: keyof StickyHeaderLayoutSettings['pages']) => {
    return value.enabled && value.pages[page];
  };

  // Helper: Einzelne Seite togglen
  const togglePage = (page: keyof StickyHeaderLayoutSettings['pages'], enabled: boolean) => {
    setValue({
      ...value,
      pages: {
        ...value.pages,
        [page]: enabled,
      }
    });
  };

  return {
    settings: value,
    setSettings: setValue,
    isPageSticky,
    togglePage,
    isLoading
  };
}
