import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserRole, RoleContextType, User } from "@/types";
import { useMenuSettings } from "../settings/use-menu-settings";
import { useAuth } from "@/contexts/auth-context";
import { useUserData } from "../data/use-users-data";
import { logger } from "@/lib/logger";

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
    logger.warn('AUTH', 'AuthContext not available in RoleProvider', error);
  }
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { settings } = useMenuSettings({ enabled: !authLoading && !!authUser });
  const [currentRole, setCurrentRole] = useState<UserRole>("mitglied");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // ✅ Use centralized user data hook instead of direct queries
  const { user: profileData, isLoading: profileLoading } = useUserData(authUser?.id, { 
    enabled: !authLoading && !!authUser && isInitialLoad 
  });

  // ✅ Reset state when auth user changes (login/logout)
  useEffect(() => {
    // Reset state when user ID changes
    setIsInitialLoad(true);
    setCurrentUser(null);
    setCurrentRole("mitglied");
    
    // Invalidate user-specific caches
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return key === 'profile' || key === 'users-with-roles' || 
               key === 'app-settings-batch' || key === 'slots';
      }
    });
  }, [authUser?.id, queryClient]);

  // Load current user from Auth Context
  useEffect(() => {
    if (authLoading || !authUser || !isInitialLoad || profileLoading) return;
    
    // ✅ FIX: Beende Loading auch wenn kein Profil gefunden wurde
    if (!profileData) {
      logger.warn('AUTH', 'No profile data found for user');
      setIsInitialLoad(false);
      return;
    }

    const loadUser = async () => {
      // ✅ Use cached profile data from useUserData
      let roles = profileData.roles as UserRole[];
      
      // Ensure admin and kranfuehrer also have mitglied role
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
  
  // ✅ Simplified setRole - just changes the displayed role without switching users
  const setRole = async (role: UserRole) => {
    setCurrentRole(role);
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
