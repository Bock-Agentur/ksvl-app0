import { useAppSettings } from "./use-app-settings";
import { AIAssistantSettings, Tonality } from "@/types/ai-assistant";
import { UserRole } from "@/types/user";

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

export function useAIAssistantSettings() {
  const { value: settings, setValue: setSettings, isLoading } = useAppSettings<AIAssistantSettings>(
    "aiAssistantSettings",
    DEFAULT_SETTINGS,
    true // Global setting
  );

  const updateTonality = (role: UserRole, tonality: Tonality) => {
    const newSettings = {
      ...settings,
      tonality: {
        ...settings.tonality,
        [role]: tonality
      }
    };
    setSettings(newSettings);
  };

  const updateResponseLength = (length: AIAssistantSettings['responseLength']) => {
    setSettings({
      ...settings,
      responseLength: length
    });
  };

  const updateSystemPrompt = (prompt: string) => {
    setSettings({
      ...settings,
      customSystemPrompt: prompt
    });
  };

  const updateAgentName = (name: string) => {
    setSettings({
      ...settings,
      agentName: name
    });
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
