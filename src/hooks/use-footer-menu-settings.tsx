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

// ✅ Combined settings type for single DB query
export interface CombinedFooterSettings {
  menu: FooterMenuItem[];
  display: { showLabels: boolean };
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

// ✅ Create combined default settings per role
const getCombinedDefaultSettings = (role: UserRole): CombinedFooterSettings => ({
  menu: DEFAULT_FOOTER_SETTINGS[role] || [],
  display: DEFAULT_DISPLAY_SETTINGS[role] || { showLabels: false }
});

export function useFooterMenuSettings(userRole: UserRole) {
  // ✅ Single storage key for combined settings
  const storageKey = `footer-settings-template-${userRole}`;
  
  const { value: combinedSettings, setValue: setCombinedSettings, isLoading } = useAppSettings<CombinedFooterSettings>(
    storageKey,
    getCombinedDefaultSettings(userRole),
    true // Global template storage
  );

  // ✅ Save both menu and display in one atomic operation
  const saveSettings = (menu: FooterMenuItem[], display: { showLabels: boolean }) => {
    setCombinedSettings({ menu, display });
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const saveDisplaySettings = (role: UserRole, display: { showLabels: boolean }) => {
    // Update only display settings, keep menu unchanged
    saveSettings(combinedSettings.menu, display);
  };

  const getMenuItemsForRole = (role: UserRole): FooterMenuItem[] => {
    return combinedSettings.menu || DEFAULT_FOOTER_SETTINGS[role] || [];
  };

  const getDisplaySettingsForRole = (role: UserRole) => {
    return combinedSettings.display || DEFAULT_DISPLAY_SETTINGS[role] || { showLabels: false };
  };

  const updateRoleMenuItems = (role: UserRole, items: FooterMenuItem[]) => {
    // Update only menu, keep display unchanged
    saveSettings(items, combinedSettings.display);
  };

  const resetToDefaults = () => {
    const defaults = getCombinedDefaultSettings(userRole);
    setCombinedSettings(defaults);
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const getAvailableItemsForRole = (role: UserRole): FooterMenuItem[] => {
    return AVAILABLE_MENU_ITEMS.filter(item => item.roles.includes(role));
  };

  return {
    settings: { [userRole]: combinedSettings.menu },
    displaySettings: { [userRole]: combinedSettings.display },
    isLoading,
    saveSettings: (newSettings: FooterMenuSettings) => {
      // Legacy compatibility: extract this role's menu
      const menu = newSettings[userRole] || combinedSettings.menu;
      saveSettings(menu, combinedSettings.display);
    },
    saveDisplaySettings,
    getMenuItemsForRole,
    getDisplaySettingsForRole,
    updateRoleMenuItems,
    resetToDefaults,
    getAvailableItemsForRole
  };
}