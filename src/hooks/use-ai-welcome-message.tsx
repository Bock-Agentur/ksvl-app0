import { useSettingsBatch } from "./use-settings-batch";
import { AIWelcomeMessageSettings } from "@/types/ai-assistant";
import { AIWelcomeMessageSettingsSchema, validateSettings } from "@/lib/settings-validation";

const DEFAULT_SETTINGS: AIWelcomeMessageSettings = {
  enabled: false,
  message: ""
};

export function useAIWelcomeMessage(options?: { enabled?: boolean }) {
  const hookEnabled = options?.enabled ?? true;
  
  const { getSetting, updateSetting, isLoading } = useSettingsBatch({ enabled: hookEnabled });
  
  const rawValue = getSetting<AIWelcomeMessageSettings>(
    "aiWelcomeMessage",
    DEFAULT_SETTINGS
  );
  
  // Validate settings with schema
  const value = validateSettings(
    AIWelcomeMessageSettingsSchema,
    rawValue,
    DEFAULT_SETTINGS,
    "aiWelcomeMessage"
  );

  const updateSettings = async (newValue: AIWelcomeMessageSettings) => {
    await updateSetting("aiWelcomeMessage", newValue, true);
  };

  return {
    enabled: value.enabled,
    message: value.message,
    updateSettings,
    isLoading
  };
}
