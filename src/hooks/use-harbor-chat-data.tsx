import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHarborChatData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  const { data: agentName = 'Capitano', isLoading } = useQuery({
    queryKey: ['ai-assistant-settings'],
    queryFn: async () => {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'aiAssistantSettings')
        .eq('is_global', true)
        .maybeSingle();

      if (settings?.setting_value) {
        const aiSettings = settings.setting_value as any;
        return aiSettings.agentName || 'Capitano';
      }
      return 'Capitano';
    },
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    gcTime: 60 * 60 * 1000, // 60 minutes in cache
    enabled,
  });

  return { agentName, isLoading };
}
