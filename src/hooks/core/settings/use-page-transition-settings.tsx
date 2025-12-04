import { useAppSettings } from './use-app-settings';

export interface PageTransitionSettings {
  enabled: boolean;
  duration: number; // ms
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  effect: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'fade-slide' | 'none';
  loaderFadeOutDuration: number; // ms
  translateDistance: number; // px
}

const DEFAULT_SETTINGS: PageTransitionSettings = {
  enabled: true,
  duration: 500,
  easing: 'ease-out',
  effect: 'fade-slide',
  loaderFadeOutDuration: 400,
  translateDistance: 12,
};

export function usePageTransitionSettings() {
  const { value, setValue, isLoading } = useAppSettings<PageTransitionSettings>(
    'page-transition-settings',
    DEFAULT_SETTINGS,
    true // isGlobal
  );

  const updateSettings = async (newSettings: Partial<PageTransitionSettings>) => {
    await setValue({ ...value, ...newSettings }, true);
  };

  return {
    settings: value,
    updateSettings,
    isLoading,
    DEFAULT_SETTINGS,
  };
}
