import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RoleBadgeSettings {
  bgColor: string;
  textColor: string;
}

export function useRoleBadgeSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["role-badge-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_badge_settings")
        .select("*");
      
      if (error) throw error;
      
      // Convert to map for easy lookup
      const settingsMap: Record<string, RoleBadgeSettings> = {};
      data.forEach((s) => {
        settingsMap[s.role] = {
          bgColor: s.bg_color,
          textColor: s.text_color,
        };
      });
      return settingsMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getRoleBadgeStyle = (role: string): string => {
    if (!settings || !settings[role]) {
      return "bg-[hsl(202_85%_23%)] text-white"; // Fallback
    }
    const { bgColor, textColor } = settings[role];
    // Convert HSL format to Tailwind-compatible format
    const bgTailwind = bgColor.replace(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/, "hsl($1_$2%_$3%)");
    const textTailwind = textColor.replace(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/, "hsl($1_$2%_$3%)");
    return `bg-[${bgTailwind}] text-[${textTailwind}]`;
  };

  return { settings, isLoading, getRoleBadgeStyle };
}
