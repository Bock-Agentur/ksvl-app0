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

export function useMenuSettings() {
  const { value: settings, setValue } = useAppSettings<MenuSettings>(
    "marina-menu-settings",
    DEFAULT_SETTINGS,
    true // Global setting for all users
  );

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
    setValue(DEFAULT_SETTINGS);
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