import { useAppSettings } from "./use-app-settings";

export interface DesktopBackgroundSettings {
  enabled: boolean;
}

const DEFAULT_SETTINGS: DesktopBackgroundSettings = {
  enabled: false
};

export function useDesktopBackground(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  const { value, setValue, isLoading } = useAppSettings<DesktopBackgroundSettings>(
    'desktop_background',
    DEFAULT_SETTINGS,
    true, // global setting
    { enabled }
  );

  return {
    settings: value,
    setSettings: setValue,
    isLoading
  };
}
