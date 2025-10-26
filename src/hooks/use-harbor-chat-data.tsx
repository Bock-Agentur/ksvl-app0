import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useHarborChatData() {
  const [agentName, setAgentName] = useState<string>('Capitano');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgentName = async () => {
      try {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'aiAssistantSettings')
          .eq('is_global', true)
          .maybeSingle();

        if (settings?.setting_value) {
          const aiSettings = settings.setting_value as any;
          const name = aiSettings.agentName || 'Capitano';
          setAgentName(name);
        }
      } catch (error) {
        console.error('Error loading agent name:', error);
        setAgentName('Capitano'); // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgentName();
  }, []);

  return { agentName, isLoading };
}
