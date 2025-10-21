import { useAppSettings } from "./use-app-settings";
import { UserRole } from "@/types/user";

export interface FooterMenuItem {
  id: string;
  label: string;
  icon: string; // Icon name from lucide-react
  roles: UserRole[];
  badge?: string;
}

export interface FooterMenuSettings {
  [key: string]: FooterMenuItem[]; // role -> menu items
}

export interface FooterDisplaySettings {
  [key: string]: { showLabels: boolean }; // role -> display settings
}

// Default display settings per role
const DEFAULT_DISPLAY_SETTINGS: FooterDisplaySettings = {
  mitglied: { showLabels: false },
  kranfuehrer: { showLabels: false },
  admin: { showLabels: false }
};

// All available menu items (from navigation + header items)
export const AVAILABLE_MENU_ITEMS: FooterMenuItem[] = [
  // Core navigation items
  { id: "dashboard", label: "Dashboard", icon: "Home", roles: ["mitglied", "kranfuehrer", "admin"] },
  { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["mitglied", "kranfuehrer", "admin"] },
  { id: "profile", label: "Profil", icon: "User", roles: ["mitglied", "kranfuehrer", "admin"] },
  
  // Admin/management items
  { id: "users", label: "Mitglieder", icon: "Users", roles: ["admin"] },
  { id: "slots", label: "Slot Manager", icon: "Layers", roles: ["admin", "kranfuehrer"] },
  { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"] },
  
  // Additional useful items
  { id: "reports", label: "Berichte", icon: "BarChart3", roles: ["admin", "kranfuehrer"] },
  { id: "notifications", label: "Hinweise", icon: "Bell", roles: ["mitglied", "kranfuehrer", "admin"] },
  { id: "help", label: "Hilfe", icon: "HelpCircle", roles: ["mitglied", "kranfuehrer", "admin"] },
  { id: "weather", label: "Wetter", icon: "Cloud", roles: ["mitglied", "kranfuehrer", "admin"] },
  { id: "harbor", label: "Hafenstatus", icon: "Anchor", roles: ["mitglied", "kranfuehrer", "admin"] },
];

// Default footer menu configurations per role
const DEFAULT_FOOTER_SETTINGS: FooterMenuSettings = {
  mitglied: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "profile", label: "Profil", icon: "User", roles: ["mitglied", "kranfuehrer", "admin"] },
  ],
  kranfuehrer: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "slots", label: "Slots", icon: "Layers", roles: ["admin", "kranfuehrer"] },
    { id: "profile", label: "Profil", icon: "User", roles: ["mitglied", "kranfuehrer", "admin"] },
  ],
  admin: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "slots", label: "Slots", icon: "Layers", roles: ["admin", "kranfuehrer"] },
    { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"] },
  ]
};

export function useFooterMenuSettings() {
  const { value: settings, setValue: setSettings } = useAppSettings<FooterMenuSettings>(
    "footerMenuSettings",
    DEFAULT_FOOTER_SETTINGS,
    true // Global
  );

  const { value: displaySettings, setValue: setDisplaySettings } = useAppSettings<FooterDisplaySettings>(
    "footerDisplaySettings",
    DEFAULT_DISPLAY_SETTINGS,
    true // Global
  );

  const saveSettings = (newSettings: FooterMenuSettings) => {
    setSettings(newSettings);
    // Notify other components immediately
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const saveDisplaySettings = (role: UserRole, showLabels: boolean) => {
    const updatedSettings = {
      ...displaySettings,
      [role]: { showLabels }
    };
    
    setDisplaySettings(updatedSettings);
    // Notify other components immediately
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const getDisplaySettingsForRole = (role: UserRole) => {
    return displaySettings[role] || DEFAULT_DISPLAY_SETTINGS[role] || { showLabels: false };
  };

  const getMenuItemsForRole = (role: UserRole): FooterMenuItem[] => {
    return settings[role] || DEFAULT_FOOTER_SETTINGS[role] || [];
  };

  const updateRoleMenuItems = (role: UserRole, items: FooterMenuItem[]) => {
    const newSettings = {
      ...settings,
      [role]: items.slice(0, 6) // Max 6 items
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_FOOTER_SETTINGS);
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    // Notify about reset immediately
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const getAvailableItemsForRole = (role: UserRole): FooterMenuItem[] => {
    return AVAILABLE_MENU_ITEMS.filter(item => item.roles.includes(role));
  };

  return {
    settings,
    displaySettings,
    getMenuItemsForRole,
    updateRoleMenuItems,
    resetToDefaults,
    getAvailableItemsForRole,
    saveDisplaySettings,
    getDisplaySettingsForRole,
    availableItems: AVAILABLE_MENU_ITEMS
  };
}