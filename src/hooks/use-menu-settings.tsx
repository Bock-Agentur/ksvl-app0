import { useEffect } from "react";
import { useAppSettings } from "./use-app-settings";
import { UserRole } from "@/types";

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  roles: UserRole[];
  badge?: string;
  order: number;
}

export interface MenuSettings {
  headerItems: MenuItemConfig[];
  defaultRole: UserRole;
}

const DEFAULT_HEADER_ITEMS: MenuItemConfig[] = [
  { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"], order: 0 },
  { id: "users", label: "Mitglieder", icon: "Users", roles: ["admin"], order: 1 },
  { id: "slots", label: "Slot Manager", icon: "Layers", roles: ["admin"], order: 2 },
  { id: "file-manager", label: "Dateimanager", icon: "FolderOpen", roles: ["admin"], order: 3 },
];

const DEFAULT_SETTINGS: MenuSettings = {
  headerItems: DEFAULT_HEADER_ITEMS,
  defaultRole: "admin"
};

export function useMenuSettings(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  const { value: settings, setValue } = useAppSettings<MenuSettings>(
    "marina-menu-settings-template",
    DEFAULT_SETTINGS,
    true, // ✅ Global template storage
    { enabled }
  );

  // Auto-update: Nur neue Items hinzufügen, ohne Toast
  useEffect(() => {
    const currentIds = settings.headerItems.map(item => item.id);
    const defaultIds = DEFAULT_HEADER_ITEMS.map(item => item.id);
    const newItems = DEFAULT_HEADER_ITEMS.filter(item => !currentIds.includes(item.id));
    
    if (newItems.length > 0) {
      const mergedItems = [...settings.headerItems, ...newItems].map((item, index) => ({
        ...item,
        order: index
      }));
      
      // Direktes setValue ohne Toast-Trigger
      setValue({
        ...settings,
        headerItems: mergedItems
      });
    }
  }, []);

  const saveSettings = (newSettings: MenuSettings) => {
    setValue(newSettings);
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent("menuSettingsChanged"));
  };

  const updateHeaderItemsOrder = (newOrder: MenuItemConfig[]) => {
    const updatedSettings = {
      ...settings,
      headerItems: newOrder.map((item, index) => ({ ...item, order: index }))
    };
    saveSettings(updatedSettings);
  };

  const updateDefaultRole = (role: UserRole) => {
    const updatedSettings = {
      ...settings,
      defaultRole: role
    };
    saveSettings(updatedSettings);
  };

  const resetToDefaults = () => {
    // Force update with the latest defaults
    const updatedDefaults = {
      headerItems: DEFAULT_HEADER_ITEMS,
      defaultRole: "admin" as UserRole
    };
    setValue(updatedDefaults);
    window.dispatchEvent(new CustomEvent("menuSettingsChanged"));
  };

  const forceRefresh = () => {
    // Force reload from defaults to pick up icon changes
    setValue(DEFAULT_SETTINGS);
    window.dispatchEvent(new CustomEvent("menuSettingsChanged"));
  };

  const getOrderedHeaderItems = (): MenuItemConfig[] => {
    return [...settings.headerItems].sort((a, b) => a.order - b.order);
  };

  return {
    settings,
    updateHeaderItemsOrder,
    updateDefaultRole,
    resetToDefaults,
    forceRefresh,
    getOrderedHeaderItems
  };
}