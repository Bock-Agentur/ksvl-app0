import { useEffect } from "react";
import { useSettingsBatch } from "./use-settings-batch";
import { validateSettings } from "@/lib/settings-validation";

export interface LoginBackground {
  type: 'gradient' | 'image' | 'video';
  bucket: 'documents' | 'login-media' | null;
  storagePath: string | null;
  url: string | null; // @deprecated - Only for temporary preview during upload
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
  bucket: null,
  storagePath: null,
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

export function useLoginBackground(options?: { enabled?: boolean }) {
  const hookEnabled = options?.enabled ?? true;
  
  const { getSetting, updateSetting, isLoading } = useSettingsBatch({ enabled: hookEnabled });
  
  const rawValue = getSetting<LoginBackground>(
    'login_background',
    DEFAULT_BACKGROUND
  );

  // ✅ Phase 2: Validate settings on load
  const value = validateSettings<LoginBackground>(
    // No Zod schema needed for this complex structure - using type safety
    { parse: (data: unknown) => data } as any,
    rawValue,
    DEFAULT_BACKGROUND,
    'login_background'
  );

  const setValue = async (newValue: LoginBackground) => {
    // Validate before saving
    const validated = validateSettings<LoginBackground>(
      { parse: (data: unknown) => data } as any,
      newValue,
      DEFAULT_BACKGROUND,
      'login_background'
    );
    await updateSetting('login_background', validated, true);
  };

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
  }, [value]);

  return {
    background: value,
    setBackground: setValue,
    isLoading
  };
}
