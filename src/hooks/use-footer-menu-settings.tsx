import { useState, useEffect } from "react";
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
  { id: "bookings", label: "Buchungen", icon: "UserCheck", roles: ["mitglied", "kranfuehrer", "admin"] },
  { id: "profile", label: "Profil", icon: "User", roles: ["mitglied", "kranfuehrer", "admin"] },
  
  // Admin/management items
  { id: "admin", label: "Test Center", icon: "TestTube", roles: ["admin"] },
  { id: "messages", label: "Nachrichten", icon: "MessageSquare", roles: ["mitglied", "kranfuehrer", "admin"], badge: "2" },
  { id: "users", label: "Mitglieder", icon: "Users", roles: ["admin"] },
  { id: "slots", label: "Slot Manager", icon: "Layers", roles: ["admin", "kranfuehrer"] },
  { id: "audit-logs", label: "Aktivitäten", icon: "FileText", roles: ["admin"] },
  { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"] },
  { id: "style-center", label: "Style Center", icon: "Palette", roles: ["admin"] },
  
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
    { id: "slots", label: "Slot", icon: "Layers", roles: ["admin", "kranfuehrer"] },
    { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"] },
    { id: "style-center", label: "Style Center", icon: "Palette", roles: ["admin"] },
    { id: "admin", label: "Test Center", icon: "TestTube", roles: ["admin"] },
  ],
  kranfuehrer: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "slots", label: "Slot", icon: "Layers", roles: ["admin", "kranfuehrer"] },
    { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"] },
    { id: "style-center", label: "Style Center", icon: "Palette", roles: ["admin"] },
    { id: "admin", label: "Test Center", icon: "TestTube", roles: ["admin"] },
  ],
  admin: [
    { id: "dashboard", label: "Home", icon: "Home", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "calendar", label: "Kalender", icon: "Calendar", roles: ["mitglied", "kranfuehrer", "admin"] },
    { id: "slots", label: "Slot", icon: "Layers", roles: ["admin", "kranfuehrer"] },
    { id: "settings", label: "Einstellungen", icon: "Settings", roles: ["admin"] },
    { id: "style-center", label: "Style Center", icon: "Palette", roles: ["admin"] },
    { id: "admin", label: "Test Center", icon: "TestTube", roles: ["admin"] },
  ]
};

export function useFooterMenuSettings() {
  const [settings, setSettings] = useState<FooterMenuSettings>(DEFAULT_FOOTER_SETTINGS);
  const [displaySettings, setDisplaySettings] = useState<FooterDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

  // Funktion zum Laden der Einstellungen aus localStorage
  const loadSettingsFromStorage = () => {
    const savedSettings = localStorage.getItem("footerMenuSettings");
    const savedDisplaySettings = localStorage.getItem("footerDisplaySettings");
    
    // Load menu settings
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const mergedSettings = { ...DEFAULT_FOOTER_SETTINGS };
        Object.keys(parsed).forEach(role => {
          const roleItems = parsed[role] || [];
          // Always save the parsed items, even if empty array
          mergedSettings[role] = roleItems.slice(0, 6);
        });
        setSettings(mergedSettings);
      } catch (error) {
        console.error("Error loading footer menu settings:", error);
        setSettings(DEFAULT_FOOTER_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_FOOTER_SETTINGS);
    }
    
    // Load display settings
    if (savedDisplaySettings) {
      try {
        const parsed = JSON.parse(savedDisplaySettings);
        const mergedDisplaySettings = { ...DEFAULT_DISPLAY_SETTINGS, ...parsed };
        setDisplaySettings(mergedDisplaySettings);
      } catch (error) {
        console.error("Error loading footer display settings:", error);
        setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
      }
    } else {
      setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    }
  };

  useEffect(() => {
    // Initial load
    loadSettingsFromStorage();
    
    // Listen for footer settings changes
    const handleFooterSettingsChanged = () => {
      loadSettingsFromStorage();
    };
    
    window.addEventListener('footerSettingsChanged', handleFooterSettingsChanged);
    
    return () => {
      window.removeEventListener('footerSettingsChanged', handleFooterSettingsChanged);
    };
  }, []);

  const saveSettings = (newSettings: FooterMenuSettings) => {
    setSettings(newSettings);
    localStorage.setItem("footerMenuSettings", JSON.stringify(newSettings));
    
    // Notify other components immediately
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const saveDisplaySettings = (role: UserRole, showLabels: boolean) => {
    const updatedSettings = {
      ...displaySettings,
      [role]: { showLabels }
    };
    
    setDisplaySettings(updatedSettings);
    localStorage.setItem("footerDisplaySettings", JSON.stringify(updatedSettings));
    
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
    localStorage.removeItem("footerMenuSettings");
    localStorage.removeItem("footerDisplaySettings");
    
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