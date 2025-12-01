import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";

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
    queryKey: QUERY_KEYS.themeSettings,
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.themeSettings });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.themeSettings });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.themeSettings });
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
    
    // Create a mapping from DB names to CSS variable names
    const badgeMapping: Record<string, string> = {
      'Badge Standard': 'badge-default',
      'Badge Standard Vordergrund': 'badge-default-foreground',
      'Badge Sekundär': 'badge-secondary',
      'Badge Sekundär Vordergrund': 'badge-secondary-foreground',
      'Badge Destruktiv': 'badge-destructive',
      'Badge Destruktiv Vordergrund': 'badge-destructive-foreground',
      'Badge Outline': 'badge-outline',
      'Badge Outline Vordergrund': 'badge-outline-foreground',
      'Badge Outline Hover': 'badge-outline-hover',
      'Badge Outline Hover Vordergrund': 'badge-outline-hover-foreground',
      'Badge Erfolg': 'badge-success',
      'Badge Erfolg Vordergrund': 'badge-success-foreground',
      'Badge Warnung': 'badge-warning',
      'Badge Warnung Vordergrund': 'badge-warning-foreground',
      'Badge Verfügbar': 'badge-available',
      'Badge Verfügbar Vordergrund': 'badge-available-foreground',
      'Badge Gebucht': 'badge-booked',
      'Badge Gebucht Vordergrund': 'badge-booked-foreground',
      'Badge Blockiert': 'badge-blocked',
      'Badge Blockiert Vordergrund': 'badge-blocked-foreground',
    };
    
    settings.forEach(setting => {
      let cssVarName = setting.name;
      
      // Check if it's a badge setting and map to correct CSS variable
      if (setting.category === 'badge' && badgeMapping[setting.name]) {
        cssVarName = badgeMapping[setting.name];
      }
      
      if (setting.category === 'gradient') {
        // Gradients are stored as full CSS values
        root.style.setProperty(`--${cssVarName}`, setting.hsl_value);
      } else {
        // Colors are HSL values
        root.style.setProperty(`--${cssVarName}`, setting.hsl_value);
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
