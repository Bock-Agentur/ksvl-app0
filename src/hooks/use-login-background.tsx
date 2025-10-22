import { useAppSettings } from "./use-app-settings";

export interface LoginBackground {
  type: 'gradient' | 'image' | 'video';
  url: string | null;
  filename: string | null;
  videoOnMobile: boolean;
  cardOpacity: number;
  cardBorderBlur: number;
  cardBorderRadius: number;
  overlayColor: string;
  overlayOpacity: number;
  mediaBlur: number;
  inputBgColor: string;
  inputBgOpacity: number;
  verticalPosition: 'top' | 'center' | 'bottom';
  countdownEnabled: boolean;
  countdownEndDate: string | null;
  countdownText: string;
  countdownVerticalPositionDesktop: number;
  countdownVerticalPositionTablet: number;
  countdownVerticalPositionMobile: number;
}

const DEFAULT_BACKGROUND: LoginBackground = {
  type: 'gradient',
  url: null,
  filename: null,
  videoOnMobile: false,
  cardOpacity: 95,
  cardBorderBlur: 8,
  cardBorderRadius: 8,
  overlayColor: '#000000',
  overlayOpacity: 40,
  mediaBlur: 0,
  inputBgColor: '#FFFFFF',
  inputBgOpacity: 10,
  verticalPosition: 'center',
  countdownEnabled: false,
  countdownEndDate: null,
  countdownText: 'bis zur neuen Segelsaison',
  countdownVerticalPositionDesktop: 35,
  countdownVerticalPositionTablet: 35,
  countdownVerticalPositionMobile: 35
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
