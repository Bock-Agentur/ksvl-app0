import { useAppSettings } from "./use-app-settings";

export interface LoginBackground {
  type: 'gradient' | 'image' | 'video';
  url: string | null;
  filename: string | null;
  videoOnMobile: boolean;
  cardOpacity: number;
}

const DEFAULT_BACKGROUND: LoginBackground = {
  type: 'gradient',
  url: null,
  filename: null,
  videoOnMobile: false,
  cardOpacity: 95
};

export function useLoginBackground() {
  const { value, setValue, isLoading } = useAppSettings<LoginBackground>(
    'login_background',
    DEFAULT_BACKGROUND,
    true // global setting
  );

  return {
    background: value,
    setBackground: setValue,
    isLoading
  };
}
