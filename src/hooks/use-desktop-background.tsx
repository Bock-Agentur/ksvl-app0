import { useAppSettings } from "./use-app-settings";

export interface DesktopBackgroundSettings {
  enabled: boolean;
}

const DEFAULT_SETTINGS: DesktopBackgroundSettings = {
  enabled: true
};

export function useDesktopBackground() {
  const { value, setValue, isLoading } = useAppSettings<DesktopBackgroundSettings>(
    'desktop_background',
    DEFAULT_SETTINGS,
    true // global setting
  );

  return {
    settings: value,
    setSettings: setValue,
    isLoading
  };
}
