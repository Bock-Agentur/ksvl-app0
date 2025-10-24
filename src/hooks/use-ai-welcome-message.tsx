import { useAppSettings } from "./use-app-settings";
import { AIWelcomeMessageSettings } from "@/types/ai-assistant";

const DEFAULT_SETTINGS: AIWelcomeMessageSettings = {
  enabled: false,
  message: ""
};

export function useAIWelcomeMessage() {
  const { value, setValue, isLoading } = useAppSettings<AIWelcomeMessageSettings>(
    "aiWelcomeMessage",
    DEFAULT_SETTINGS,
    true // Global setting
  );

  return {
    enabled: value.enabled,
    message: value.message,
    updateSettings: setValue,
    isLoading
  };
}
