import { useEffect } from "react";
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
  loginBlockVerticalPositionDesktop: number;
  loginBlockVerticalPositionTablet: number;
  loginBlockVerticalPositionMobile: number;
  loginBlockWidthDesktop: number;
  loginBlockWidthTablet: number;
  loginBlockWidthMobile: number;
  countdownEnabled: boolean;
  countdownEndDate: string | null;
  countdownText: string;
  countdownShowDays: boolean;
  countdownFontSize: number;
  countdownFontWeight: number;
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
  loginBlockVerticalPositionDesktop: 50,
  loginBlockVerticalPositionTablet: 50,
  loginBlockVerticalPositionMobile: 50,
  loginBlockWidthDesktop: 400,
  loginBlockWidthTablet: 380,
  loginBlockWidthMobile: 340,
  countdownEnabled: false,
  countdownEndDate: null,
  countdownText: 'bis zur neuen Segelsaison',
  countdownShowDays: true,
  countdownFontSize: 48,
  countdownFontWeight: 100,
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

  // Migration: Convert old verticalPosition to new slider values
  useEffect(() => {
    if (value && 'verticalPosition' in value && !value.loginBlockVerticalPositionDesktop) {
      const migrationMap: Record<string, number> = {
        'top': 10,
        'center': 50,
        'bottom': 85
      };
      
      const oldPosition = (value as any).verticalPosition;
      const migratedValue = {
        ...value,
        loginBlockVerticalPositionDesktop: migrationMap[oldPosition] || 50,
        loginBlockVerticalPositionTablet: migrationMap[oldPosition] || 50,
        loginBlockVerticalPositionMobile: migrationMap[oldPosition] || 50
      };
      
      // Remove old property
      delete (migratedValue as any).verticalPosition;
      
      setValue(migratedValue);
    }
  }, [value, setValue]);

  return {
    background: value,
    setBackground: setValue,
    isLoading
  };
}
