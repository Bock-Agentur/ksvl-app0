import { useEffect } from "react";
import { useAppSettings } from "./use-app-settings";

export interface SlotDesignSettings {
  available: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
  booked: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
  blocked: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
}

export interface SlotDesignState {
  settings: SlotDesignSettings;
}

const DEFAULT_TRENDY_DESIGN: SlotDesignSettings = {
  available: {
    background: "hsl(133 28% 68%)", // trendy-green background
    border: "hsl(133 28% 68%)",
    text: "hsl(0 0% 100%)", // white text für trendy
    label: "hsla(210, 25%, 98%, 0.2)" // standard label background
  },
  booked: {
    background: "hsl(202 85% 23%)", // trendy-navy background
    border: "hsl(202 85% 23%)",
    text: "hsl(0 0% 100%)", // white text für trendy
    label: "hsla(210, 25%, 98%, 0.2)" // standard label background
  },
  blocked: {
    background: "hsl(348 77% 67%)", // trendy-pink background
    border: "hsl(348 77% 67%)",
    text: "hsl(0 0% 100%)", // white text für trendy
    label: "hsla(210, 25%, 98%, 0.2)" // standard label background
  }
};

const DEFAULT_SLOT_DESIGN_STATE: SlotDesignState = {
  settings: DEFAULT_TRENDY_DESIGN
};

export function useSlotDesign() {
  const { value: designState, setValue: setDesignState, isLoading } = useAppSettings<SlotDesignState>(
    "slot-design-settings",
    DEFAULT_SLOT_DESIGN_STATE,
    true // Global
  );

  // Get current active settings - always trendy now
  const settings = designState.settings;

  // Apply CSS custom properties when settings change
  useEffect(() => {
    if (!isLoading) {
      const root = document.documentElement;
      
      // Available slot colors
      root.style.setProperty('--slot-available-bg', settings.available.background);
      root.style.setProperty('--slot-available-border', settings.available.border);
      root.style.setProperty('--slot-available-text', settings.available.text);
      root.style.setProperty('--slot-available-label', settings.available.label);
      
      // Booked slot colors
      root.style.setProperty('--slot-booked-bg', settings.booked.background);
      root.style.setProperty('--slot-booked-border', settings.booked.border);
      root.style.setProperty('--slot-booked-text', settings.booked.text);
      root.style.setProperty('--slot-booked-label', settings.booked.label);
      
      // Blocked slot colors
      root.style.setProperty('--slot-blocked-bg', settings.blocked.background);
      root.style.setProperty('--slot-blocked-border', settings.blocked.border);
      root.style.setProperty('--slot-blocked-text', settings.blocked.text);
      root.style.setProperty('--slot-blocked-label', settings.blocked.label);
    }
  }, [settings, isLoading]);

  const saveSettings = (newSettings: Partial<SlotDesignSettings>) => {
    const updatedSettings = { 
      ...designState.settings, 
      ...newSettings 
    };
    setDesignState({
      ...designState,
      settings: updatedSettings
    });
  };

  const updateSlotType = (slotType: keyof SlotDesignSettings, colorType: keyof SlotDesignSettings['available'], color: string) => {
    const updatedSettings = {
      ...designState.settings,
      [slotType]: {
        ...designState.settings[slotType],
        [colorType]: color
      }
    };
    
    setDesignState({
      ...designState,
      settings: updatedSettings
    });
  };

  const resetToDefaults = () => {
    setDesignState(DEFAULT_SLOT_DESIGN_STATE);
  };

  const resetToOriginalDefaults = () => {
    const originalDefaults = {
      settings: DEFAULT_TRENDY_DESIGN
    };
    setDesignState(originalDefaults);
  };

  return {
    // Current active settings
    settings,
    // All design state
    designState,
    // Actions
    saveSettings,
    updateSlotType,
    resetToDefaults,
    resetToOriginalDefaults,
    isLoading
  };
}