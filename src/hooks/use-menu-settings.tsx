import { useState, useEffect } from "react";
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
  { id: "style-center", label: "Style Center", icon: "Palette", roles: ["admin"], order: 0 },
  { id: "admin", label: "Test Center", icon: "TestTube", roles: ["admin"], order: 1 },
  { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"], order: 2 },
  { id: "messages", label: "Nachrichten", icon: "MessageSquare", roles: ["mitglied", "kranfuehrer", "admin"], badge: "2", order: 3 },
  { id: "users", label: "Mitgliederverwaltung", icon: "Users", roles: ["admin"], order: 4 },
  { id: "slots", label: "Slot Manager", icon: "Layers", roles: ["admin"], order: 5 },
  { id: "audit-logs", label: "Aktivitätsprotokoll", icon: "FileText", roles: ["admin"], order: 6 },
];

const DEFAULT_SETTINGS: MenuSettings = {
  headerItems: DEFAULT_HEADER_ITEMS,
  defaultRole: "admin"
};

const STORAGE_KEY = "marina-menu-settings";

export function useMenuSettings() {
  const [settings, setSettings] = useState<MenuSettings>(DEFAULT_SETTINGS);

  const loadSettingsFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          headerItems: parsedSettings.headerItems || DEFAULT_HEADER_ITEMS
        });
      }
    } catch (error) {
      console.error("Error loading menu settings:", error);
    }
  };

  useEffect(() => {
    loadSettingsFromStorage();
    
    const handleStorageChange = () => {
      loadSettingsFromStorage();
    };
    
    window.addEventListener("menuSettingsChanged", handleStorageChange);
    return () => window.removeEventListener("menuSettingsChanged", handleStorageChange);
  }, []);

  const saveSettings = (newSettings: MenuSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("menuSettingsChanged"));
    } catch (error) {
      console.error("Error saving menu settings:", error);
    }
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
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    window.dispatchEvent(new CustomEvent("menuSettingsChanged"));
  };

  const forceRefresh = () => {
    // Force reload from defaults to pick up icon changes
    setSettings(DEFAULT_SETTINGS);
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