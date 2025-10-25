import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole, RoleContextType, User } from "@/types";
import { useMenuSettings } from "@/hooks/use-menu-settings";
import { supabase } from "@/integrations/supabase/client";

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { settings } = useMenuSettings();
  const [currentRole, setCurrentRole] = useState<UserRole>("mitglied");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load current user from Supabase only on initial load
  useEffect(() => {
    if (!isInitialLoad) return;

    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profile) return;

      // Fetch roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      let roles = (userRoles?.map(r => r.role as UserRole) || ['mitglied']) as UserRole[];
      
      // Ensure admin and kranfuehrer also have mitglied role for role switching
      if ((roles.includes('admin') || roles.includes('kranfuehrer')) && !roles.includes('mitglied')) {
        roles = [...roles, 'mitglied'];
      }
      
      const primaryRole = roles.find(r => r === 'vorstand') || roles.find(r => r === 'admin') || roles.find(r => r === 'kranfuehrer') || roles.find(r => r === 'mitglied') || 'gastmitglied';

      const user: User = {
        id: profile.id,
        name: profile.name || '',
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        email: profile.email,
        phone: profile.phone || undefined,
        boatName: profile.boat_name || undefined,
        memberNumber: profile.member_number || '',
        streetAddress: profile.street_address || undefined,
        postalCode: profile.postal_code || undefined,
        city: profile.city || undefined,
        roles,
        role: primaryRole,
        status: profile.status === 'active' ? 'active' : 'inactive',
        joinDate: profile.entry_date || '',
        isActive: profile.status === 'active'
      };

      setOriginalUser(user);
      setCurrentUser(user);
      
      // Only use defaultRole if it's one of the user's roles
      const roleToUse = (settings.defaultRole && roles.includes(settings.defaultRole)) 
        ? settings.defaultRole 
        : primaryRole;
      setCurrentRole(roleToUse);
      setIsInitialLoad(false);
    };

    loadUser();
  }, [isInitialLoad, settings.defaultRole]);
  
  const setRole = async (role: UserRole) => {
    // Check if role switching is enabled
    const { data: roleSwitchingSetting } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'role_switching_enabled')
      .eq('is_global', true)
      .single();
    
    const settingValue = roleSwitchingSetting?.setting_value as { enabled?: boolean } | null;
    const isRoleSwitchingEnabled = settingValue?.enabled !== false;
    
    setCurrentRole(role);
    
    // If role switching is disabled, just change the role but keep the current user
    if (!isRoleSwitchingEnabled) {
      return;
    }
    
    // If switching back to a role the original user has, restore the original user
    if (originalUser && originalUser.roles.includes(role)) {
      setCurrentUser(originalUser);
      return;
    }
    
    // Try to fetch the role user
    const roleUserEmail = `${role}-rolle@ksvl.test`;
    const { data: roleProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', roleUserEmail)
      .eq('is_role_user', true)
      .single();
    
    if (roleProfile) {
      // Fetch roles separately
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', roleProfile.id);
      
      const roles = userRoles?.map(r => r.role as UserRole) || [role];
      const roleUser: User = {
        id: roleProfile.id,
        name: roleProfile.name || '',
        firstName: roleProfile.first_name || undefined,
        lastName: roleProfile.last_name || undefined,
        email: roleProfile.email,
        phone: roleProfile.phone || undefined,
        boatName: roleProfile.boat_name || undefined,
        memberNumber: roleProfile.member_number || '',
        streetAddress: roleProfile.street_address || undefined,
        postalCode: roleProfile.postal_code || undefined,
        city: roleProfile.city || undefined,
        roles,
        role: role,
        status: roleProfile.status === 'active' ? 'active' : 'inactive',
        joinDate: roleProfile.entry_date || '',
        isActive: roleProfile.status === 'active'
      };
      setCurrentUser(roleUser);
    } else {
      // If no role user exists, keep current user but change role
      console.warn(`No role user found for ${role}`);
    }
  };
  
  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setCurrentRole(user.role);
    }
  };
  
  const hasPermission = (requiredRoles: UserRole[]) => {
    if (!currentUser) return false;
    return requiredRoles.some(role => currentUser.roles.includes(role));
  };
  
  const hasAnyRole = (roles: UserRole[]) => {
    if (!currentUser) return false;
    return roles.some(role => currentUser.roles.includes(role));
  };
  
  return (
    <RoleContext.Provider value={{ 
      currentRole, 
      currentRoles: currentUser?.roles || [],
      currentUser, 
      setRole, 
      setCurrentUser: handleSetCurrentUser, 
      hasPermission,
      hasAnyRole,
      isLoading: isInitialLoad
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}