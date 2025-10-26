import { useAppSettings } from "./use-app-settings";
import { AIWelcomeMessageSettings } from "@/types/ai-assistant";

const DEFAULT_SETTINGS: AIWelcomeMessageSettings = {
  enabled: false,
  message: ""
};

export function useAIWelcomeMessage(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  const { value, setValue, isLoading } = useAppSettings<AIWelcomeMessageSettings>(
    "aiWelcomeMessage",
    DEFAULT_SETTINGS,
    true, // Global setting
    { enabled }
  );

  return {
    enabled: value.enabled,
    message: value.message,
    updateSettings: setValue,
    isLoading
  };
}
