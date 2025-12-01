import { useSettingsBatch } from "./use-settings-batch";
import { AIWelcomeMessageSettings } from "@/types/ai-assistant";

const DEFAULT_SETTINGS: AIWelcomeMessageSettings = {
  enabled: false,
  message: ""
};

export function useAIWelcomeMessage(options?: { enabled?: boolean }) {
  const hookEnabled = options?.enabled ?? true;
  
  const { getSetting, updateSetting, isLoading } = useSettingsBatch({ enabled: hookEnabled });
  
  const value = getSetting<AIWelcomeMessageSettings>(
    "aiWelcomeMessage",
    DEFAULT_SETTINGS
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
