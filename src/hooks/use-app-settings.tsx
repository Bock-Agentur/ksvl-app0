/**
 * App Settings Hook
 * Manages all application settings in Supabase database
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AppSetting {
  id: string;
  user_id: string | null;
  setting_key: string;
  setting_value: any;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export function useAppSettings<T = any>(
  settingKey: string,
  defaultValue: T,
  isGlobal: boolean = false
) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load setting from database
  const loadSetting = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', settingKey);

      if (isGlobal) {
        query = query.eq('is_global', true);
      } else if (user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        setValue(data.setting_value as T);
      } else {
        // Try to migrate from localStorage
        const storedValue = localStorage.getItem(settingKey);
        if (storedValue) {
          try {
            const parsed = JSON.parse(storedValue);
            setValue(parsed);
            // Save to database
            await saveSetting(parsed, true);
            // Clean up localStorage
            localStorage.removeItem(settingKey);
          } catch (e) {
            setValue(defaultValue);
          }
        } else {
          setValue(defaultValue);
        }
      }
    } catch (error) {
      console.error(`Error loading setting ${settingKey}:`, error);
      // Fallback to localStorage
      const storedValue = localStorage.getItem(settingKey);
      if (storedValue) {
        try {
          setValue(JSON.parse(storedValue));
        } catch (e) {
          setValue(defaultValue);
        }
      } else {
        setValue(defaultValue);
      }
    } finally {
      setIsLoading(false);
    }
  }, [settingKey, defaultValue, isGlobal]);

  // Save setting to database
  const saveSetting = async (newValue: T, skipToast: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && !isGlobal) {
        throw new Error("User must be logged in to save settings");
      }

      const settingData = {
        setting_key: settingKey,
        setting_value: newValue as any, // Cast to any for Json compatibility
        is_global: isGlobal,
        user_id: isGlobal ? null : user?.id
      };

      // Check if setting already exists
      let query = supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', settingKey);

      if (isGlobal) {
        query = query.eq('is_global', true);
      } else if (user) {
        query = query.eq('user_id', user.id);
      }

      const { data: existingSettings } = await query.maybeSingle();

      let error;
      if (existingSettings) {
        // Update existing setting
        const updateResult = await supabase
          .from('app_settings')
          .update({ setting_value: newValue as any, updated_at: new Date().toISOString() })
          .eq('id', existingSettings.id);
        error = updateResult.error;
      } else {
        // Insert new setting
        const insertResult = await supabase
          .from('app_settings')
          .insert([settingData]);
        error = insertResult.error;
      }

      if (error) throw error;

      setValue(newValue);

      if (!skipToast) {
        toast({
          title: "Einstellungen gespeichert",
          description: "Ihre Änderungen wurden erfolgreich gespeichert.",
        });
      }
    } catch (error) {
      console.error(`Error saving setting ${settingKey}:`, error);
      // Fallback to localStorage
      localStorage.setItem(settingKey, JSON.stringify(newValue));
      setValue(newValue);
      
      if (!skipToast) {
        toast({
          title: "Warnung",
          description: "Einstellungen wurden lokal gespeichert.",
          variant: "default",
        });
      }
    }
  };

  // Delete setting
  const deleteSetting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('app_settings')
        .delete()
        .eq('setting_key', settingKey);

      if (isGlobal) {
        query = query.eq('is_global', true);
      } else if (user) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) throw error;

      setValue(defaultValue);
      localStorage.removeItem(settingKey);
    } catch (error) {
      console.error(`Error deleting setting ${settingKey}:`, error);
      localStorage.removeItem(settingKey);
      setValue(defaultValue);
    }
  };

  useEffect(() => {
    loadSetting();
  }, [loadSetting]);

  return {
    value,
    setValue: saveSetting,
    deleteSetting,
    isLoading,
    reload: loadSetting
  };
}
