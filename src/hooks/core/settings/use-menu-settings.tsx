import { useEffect } from "react";
import { useSettingsBatch } from "./use-settings-batch";
import { UserRole } from "@/types";
import { NAV_ITEMS } from "@/lib/registry/navigation";

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: string;
  roles: UserRole[];
  badge?: string;
  order: number;
}

// Alias for backwards compatibility
export type MenuItem = MenuItemConfig;

export interface MenuSettings {
  headerItems: MenuItemConfig[];
  defaultRole: UserRole;
}

// ✅ Generate DEFAULT_HEADER_ITEMS from central NAV_ITEMS registry (drawer position)
const DEFAULT_HEADER_ITEMS: MenuItemConfig[] = NAV_ITEMS
  .filter(item => item.position.includes('drawer') && !item.deprecated)
  .map((item, index) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    roles: item.allowedRoles === '*' 
      ? ['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'] 
      : item.allowedRoles,
    order: index,
  }));

const DEFAULT_SETTINGS: MenuSettings = {
  headerItems: DEFAULT_HEADER_ITEMS,
  defaultRole: "admin"
};

export function useMenuSettings(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  
  // ✅ Use batch settings loading
  const storageKey = "marina-menu-settings-template";
  const { getSetting, updateSetting } = useSettingsBatch({ enabled });
  
  const settings = getSetting<MenuSettings>(storageKey, DEFAULT_SETTINGS);

  // Auto-update: Nur neue Items hinzufügen, ohne Toast
  useEffect(() => {
    const currentIds = settings.headerItems.map(item => item.id);
    const newItems = DEFAULT_HEADER_ITEMS.filter(item => !currentIds.includes(item.id));
    
    if (newItems.length > 0) {
      const mergedItems = [...settings.headerItems, ...newItems].map((item, index) => ({
        ...item,
        order: index
      }));
      
      updateSetting(storageKey, {
        ...settings,
        headerItems: mergedItems
      }, true);
    }
  }, []);

  const saveSettings = async (newSettings: MenuSettings) => {
    await updateSetting(storageKey, newSettings, true);
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

  const resetToDefaults = async () => {
    // Force update with the latest defaults
    const updatedDefaults = {
      headerItems: DEFAULT_HEADER_ITEMS,
      defaultRole: "admin" as UserRole
    };
    await updateSetting(storageKey, updatedDefaults, true);
    window.dispatchEvent(new CustomEvent("menuSettingsChanged"));
  };

  const forceRefresh = async () => {
    // Force reload from defaults to pick up icon changes
    await updateSetting(storageKey, DEFAULT_SETTINGS, true);
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