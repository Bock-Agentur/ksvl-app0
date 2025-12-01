import { useAIAssistantSettings } from "@/hooks";

/**
 * Bridge-Hook for Harbor Chat data
 * 
 * Uses centralized useAIAssistantSettings instead of separate React Query
 * to avoid duplicate queries for the same AI settings data.
 */
export function useHarborChatData(options?: { enabled?: boolean }) {
  const { settings, isLoading } = useAIAssistantSettings(options);
  
  return { 
    agentName: settings.agentName || 'Capitano', 
    isLoading 
  };
}
