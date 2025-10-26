import { useAppSettings } from "./use-app-settings";

export interface StickyHeaderLayoutSettings {
  enabled: boolean;
}

const DEFAULT_SETTINGS: StickyHeaderLayoutSettings = {
  enabled: true, // Standard: aktiviert
};

export function useStickyHeaderLayout() {
  const { value, setValue, isLoading } = useAppSettings<StickyHeaderLayoutSettings>(
    'sticky_header_layout',
    DEFAULT_SETTINGS,
    true // global setting
  );

  return {
    settings: value,
    setSettings: setValue,
    isLoading
  };
}
