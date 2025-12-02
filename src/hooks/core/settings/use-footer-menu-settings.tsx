import { useSettingsBatch } from "./use-settings-batch";
import { UserRole } from "@/types/user";
import { getNavItemsForRole } from "@/lib/registry/navigation";
import { NAV_ITEMS } from "@/lib/registry/navigation";

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

// ✅ Generate AVAILABLE_MENU_ITEMS from central NAV_ITEMS registry
export const AVAILABLE_MENU_ITEMS: FooterMenuItem[] = NAV_ITEMS.map(item => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  roles: item.allowedRoles === '*' 
    ? ['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'] 
    : item.allowedRoles,
}));

// ✅ Generate DEFAULT_FOOTER_SETTINGS from NAV_ITEMS
const generateDefaultFooterSettings = (): FooterMenuSettings => {
  const roles: UserRole[] = ['gastmitglied', 'mitglied', 'kranfuehrer', 'admin', 'vorstand'];
  const settings: FooterMenuSettings = {};
  
  roles.forEach(role => {
    settings[role] = getNavItemsForRole(role, 'bottom').map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      roles: item.allowedRoles === '*' 
        ? roles 
        : item.allowedRoles,
    }));
  });
  
  return settings;
};

const DEFAULT_FOOTER_SETTINGS = generateDefaultFooterSettings();

// ✅ Create combined default settings per role
const getCombinedDefaultSettings = (role: UserRole): CombinedFooterSettings => ({
  menu: DEFAULT_FOOTER_SETTINGS[role] || [],
  display: DEFAULT_DISPLAY_SETTINGS[role] || { showLabels: false }
});

export function useFooterMenuSettings(userRole: UserRole) {
  // ✅ Use batch settings loading
  const storageKey = `footer-settings-template-${userRole}`;
  const { getSetting, updateSetting, isLoading, refetch } = useSettingsBatch({ 
    enabled: true, 
    userRole 
  });
  
  const combinedSettings = getSetting<CombinedFooterSettings>(
    storageKey, 
    getCombinedDefaultSettings(userRole)
  );

  // ✅ Save both menu and display in one atomic operation
  const saveSettings = async (menu: FooterMenuItem[], display: { showLabels: boolean }) => {
    try {
      await updateSetting(storageKey, { menu, display }, true);
      window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
    } catch (error) {
      console.error('Failed to save footer settings:', error);
      throw error;
    }
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

  const resetToDefaults = async () => {
    const defaults = getCombinedDefaultSettings(userRole);
    await updateSetting(storageKey, defaults, true);
    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
  };

  const getAvailableItemsForRole = (role: UserRole): FooterMenuItem[] => {
    return AVAILABLE_MENU_ITEMS.filter(item => item.roles.includes(role));
  };

  return {
    settings: { [userRole]: combinedSettings.menu },
    displaySettings: { [userRole]: combinedSettings.display },
    isLoading,
    refetch,
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