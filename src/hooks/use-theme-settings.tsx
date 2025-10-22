import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ThemeSetting {
  id: string;
  name: string;
  category: string;
  hsl_value: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useThemeSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["theme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as ThemeSetting[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, hsl_value }: { id: string; hsl_value: string }) => {
      const { error } = await supabase
        .from("theme_settings")
        .update({ hsl_value, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
      toast.success("Design-Einstellung gespeichert");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const addSetting = useMutation({
    mutationFn: async (setting: Omit<ThemeSetting, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("theme_settings")
        .insert([setting]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
      toast.success("Neue Farbe hinzugefügt");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("theme_settings")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
      toast.success("Farbe gelöscht");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Helper to get a specific color by name
  const getColor = (name: string): string | undefined => {
    return settings?.find(s => s.name === name)?.hsl_value;
  };

  // Helper to get all colors in a category
  const getCategory = (category: string): ThemeSetting[] => {
    return settings?.filter(s => s.category === category) || [];
  };

  // Helper to apply theme to CSS variables
  const applyTheme = () => {
    if (!settings) return;

    const root = document.documentElement;
    settings.forEach(setting => {
      if (setting.category === 'gradient') {
        // Gradients are stored as full CSS values
        root.style.setProperty(`--${setting.name}`, setting.hsl_value);
      } else {
        // Colors are HSL values
        root.style.setProperty(`--${setting.name}`, setting.hsl_value);
      }
    });
  };

  return {
    settings,
    isLoading,
    updateSetting: updateSetting.mutate,
    addSetting: addSetting.mutate,
    deleteSetting: deleteSetting.mutate,
    getColor,
    getCategory,
    applyTheme,
  };
}
