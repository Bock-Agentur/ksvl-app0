import { useSettingsBatch } from "./use-settings-batch";
import { AIAssistantSettings, Tonality } from "@/types/ai-assistant";
import { UserRole } from "@/types/user";
import { AIAssistantSettingsSchema, validateSettings } from "@/lib/settings-validation";

const DEFAULT_SETTINGS: AIAssistantSettings = {
  tonality: {
    admin: 'formal',
    vorstand: 'formal',
    kranfuehrer: 'funny',
    mitglied: 'witty',
    gastmitglied: 'witty'
  },
  responseLength: 'medium',
  customSystemPrompt: '',
  agentName: 'Capitano'
};

export function useAIAssistantSettings(options?: { enabled?: boolean }) {
  const hookEnabled = options?.enabled ?? true;
  
  const { getSetting, updateSetting, isLoading } = useSettingsBatch({ enabled: hookEnabled });
  
  const rawSettings = getSetting<AIAssistantSettings>(
    "aiAssistantSettings",
    DEFAULT_SETTINGS
  );
  
  // Validate settings with schema
  const settings = validateSettings(
    AIAssistantSettingsSchema,
    rawSettings,
    DEFAULT_SETTINGS,
    "aiAssistantSettings"
  );

  const updateTonality = async (role: UserRole, tonality: Tonality) => {
    const newSettings = {
      ...settings,
      tonality: {
        ...settings.tonality,
        [role]: tonality
      }
    };
    await updateSetting("aiAssistantSettings", newSettings, true);
  };

  const updateResponseLength = async (length: AIAssistantSettings['responseLength']) => {
    await updateSetting("aiAssistantSettings", {
      ...settings,
      responseLength: length
    }, true);
  };

  const updateSystemPrompt = async (prompt: string) => {
    await updateSetting("aiAssistantSettings", {
      ...settings,
      customSystemPrompt: prompt
    }, true);
  };

  const updateAgentName = async (name: string) => {
    await updateSetting("aiAssistantSettings", {
      ...settings,
      agentName: name
    }, true);
  };

  const setSettings = async (newSettings: AIAssistantSettings) => {
    await updateSetting("aiAssistantSettings", newSettings, true);
  };

  return {
    settings,
    updateTonality,
    updateResponseLength,
    updateSystemPrompt,
    updateAgentName,
    setSettings,
    isLoading
  };
}
