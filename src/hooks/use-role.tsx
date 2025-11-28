import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserRole, RoleContextType, User } from "@/types";
import { useMenuSettings } from "@/hooks/use-menu-settings";
import { useAuth } from "@/contexts/auth-context";
import { useUserData, useUsersData } from "@/hooks/use-users-data";
import { useSettingsBatch } from "@/hooks/use-settings-batch";

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Safe hook call - AuthContext might not be ready during error recovery
  let authUser = null;
  let authLoading = true;
  try {
    const auth = useAuth();
    authUser = auth.user;
    authLoading = auth.isLoading;
  } catch (error) {
    // Fallback when AuthContext is not available
    console.warn("AuthContext not available in RoleProvider:", error);
  }
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { settings } = useMenuSettings({ enabled: !authLoading && !!authUser });
  const { getSetting } = useSettingsBatch({ enabled: !authLoading && !!authUser });
  const [currentRole, setCurrentRole] = useState<UserRole>("mitglied");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  
  // ✅ Use centralized user data hook instead of direct queries
  const { user: profileData, isLoading: profileLoading } = useUserData(authUser?.id, { 
    enabled: !authLoading && !!authUser && isInitialLoad 
  });

  // ✅ Load all users for role-switching (cached via useUsersData)
  const { users: allUsers } = useUsersData({ enabled: !authLoading && !!authUser });

  // Load current user from Auth Context
  useEffect(() => {
    if (authLoading || !authUser || !isInitialLoad || profileLoading) return;
    if (!profileData) return;

    const loadUser = async () => {
      // ✅ Use cached profile data from useUserData
      let roles = profileData.roles as UserRole[];
      
      // Ensure admin and kranfuehrer also have mitglied role for role switching
      if ((roles.includes('admin') || roles.includes('kranfuehrer')) && !roles.includes('mitglied')) {
        roles = [...roles, 'mitglied'];
      }
      
      const primaryRole = roles.find(r => r === 'vorstand') || roles.find(r => r === 'admin') || roles.find(r => r === 'kranfuehrer') || roles.find(r => r === 'mitglied') || 'gastmitglied';

      const user: User = {
        id: profileData.id,
        name: profileData.name || '',
        firstName: profileData.first_name || undefined,
        lastName: profileData.last_name || undefined,
        email: profileData.email,
        phone: profileData.phone || undefined,
        boatName: profileData.boat_name || undefined,
        memberNumber: profileData.member_number || '',
        streetAddress: profileData.street_address || undefined,
        postalCode: profileData.postal_code || undefined,
        city: profileData.city || undefined,
        roles,
        role: primaryRole,
        status: profileData.status === 'active' ? 'active' : 'inactive',
        joinDate: profileData.entry_date || '',
        isActive: profileData.status === 'active'
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
  }, [authUser, authLoading, isInitialLoad, profileData, profileLoading, settings.defaultRole]);
  
  const setRole = async (role: UserRole) => {
    // ✅ Use cached settings instead of DB query
    const roleSwitchingSetting = getSetting<{ enabled?: boolean }>('role_switching_enabled', { enabled: true });
    const isRoleSwitchingEnabled = roleSwitchingSetting?.enabled !== false;
    
    setCurrentRole(role);
    
    // If role switching is disabled, just change the role but keep the current user
    if (!isRoleSwitchingEnabled) {
      return;
    }
    
    // If switching back to a role the original user has, restore the original user
    if (originalUser && originalUser.roles.includes(role)) {
      setCurrentUser(originalUser);
      // Invalidate queries to refresh data for the restored user
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'profile' || key === 'slots' || key === 'users';
        }
      });
      return;
    }
    
    // ✅ Try to find the role user from cached users data
    const roleUserEmail = `${role}-rolle@ksvl.test`;
    const roleProfile = allUsers.find(u => 
      u.email === roleUserEmail && u.is_role_user === true
    );
    
    if (roleProfile) {
      const roles = roleProfile.roles as UserRole[] || [role];
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
      // Invalidate queries to refresh data for the role user
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'profile' || key === 'slots' || key === 'users';
        }
      });
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
      isLoading: authLoading || isInitialLoad
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