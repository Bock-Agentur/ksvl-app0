import { useSettingsBatch } from "./use-settings-batch";
import { StickyHeaderLayoutSettingsSchema, validateSettings } from "@/lib/settings-validation";

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
  
  const rawValue = getSetting<StickyHeaderLayoutSettings>(
    'sticky_header_layout',
    DEFAULT_SETTINGS
  );

  // Validate settings with schema (includes migration logic)
  const settings = validateSettings(
    StickyHeaderLayoutSettingsSchema,
    rawValue as any,
    DEFAULT_SETTINGS as any,
    "sticky_header_layout"
  ) as StickyHeaderLayoutSettings; // Cast to ensure compatibility with existing type

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
    } as any, true);
  };

  const setSettings = async (newSettings: StickyHeaderLayoutSettings) => {
    await updateSetting('sticky_header_layout', newSettings as any, true);
  };

  return {
    settings,
    setSettings,
    isPageSticky,
    togglePage,
    isLoading
  };
}
