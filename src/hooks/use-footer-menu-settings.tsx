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
  gastmitglied: { showLabels: false },
  mitglied: { showLabels: false },
  kranfuehrer: { showLabels: false },
  admin: { showLabels: false },
  vorstand: { showLabels: false }
};

// All available menu items (from navigation + header items)
export const AVAILABLE_MENU_ITEMS: FooterMenuItem[] = [
  // Core navigation items
  { id: "dashboard", label: "Dashboard", icon: "Home", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  { id: "profile", label: "Profil", icon: "User", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  
  // Admin/management items
  { id: "users", label: "Mitglieder", icon: "Users", roles: ["admin", "vorstand"] },
  { id: "slots", label: "Slot Manager", icon: "Layers", roles: ["admin", "kranfuehrer", "vorstand"] },
  { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin", "vorstand"] },
  
  // Additional useful items
  { id: "reports", label: "Berichte", icon: "BarChart3", roles: ["admin", "kranfuehrer", "vorstand"] },
  { id: "notifications", label: "Hinweise", icon: "Bell", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  { id: "help", label: "Hilfe", icon: "HelpCircle", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  { id: "weather", label: "Wetter", icon: "Cloud", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  { id: "harbor", label: "Hafenstatus", icon: "Anchor", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  { id: "file-manager", label: "Dateien", icon: "FolderOpen", roles: ["admin", "vorstand"] },
];

// Default footer menu configurations per role
const DEFAULT_FOOTER_SETTINGS: FooterMenuSettings = {
  gastmitglied: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "profile", label: "Profil", icon: "User", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  ],
  mitglied: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "profile", label: "Profil", icon: "User", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  ],
  kranfuehrer: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "slots", label: "Slots", icon: "Layers", roles: ["admin", "kranfuehrer", "vorstand"] },
    { id: "profile", label: "Profil", icon: "User", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
  ],
  admin: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "slots", label: "Slots", icon: "Layers", roles: ["admin", "kranfuehrer", "vorstand"] },
    { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin", "vorstand"] },
  ],
  vorstand: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"] },
    { id: "slots", label: "Slots", icon: "Layers", roles: ["admin", "kranfuehrer", "vorstand"] },
    { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin", "vorstand"] },
  ]
};

export function useFooterMenuSettings() {
  const { value: settings, setValue: setSettings, isLoading: settingsLoading } = useAppSettings<FooterMenuSettings>(
    "footerMenuSettings",
    DEFAULT_FOOTER_SETTINGS,
    true // Global
  );

  const { value: displaySettings, setValue: setDisplaySettings, isLoading: displayLoading } = useAppSettings<FooterDisplaySettings>(
    "footerDisplaySettings",
    DEFAULT_DISPLAY_SETTINGS,
    true // Global
  );

  const isLoading = settingsLoading || displayLoading;

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
      [role]: items.slice(0, 8) // Max 8 items
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
    isLoading,
    getMenuItemsForRole,
    updateRoleMenuItems,
    resetToDefaults,
    getAvailableItemsForRole,
    saveDisplaySettings,
    getDisplaySettingsForRole,
    availableItems: AVAILABLE_MENU_ITEMS
  };
}