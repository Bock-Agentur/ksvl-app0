import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole, RoleContextType, User } from "@/types";
import { useMenuSettings } from "@/hooks/use-menu-settings";
import { supabase } from "@/integrations/supabase/client";

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { settings } = useMenuSettings();
  const [currentRole, setCurrentRole] = useState<UserRole>("mitglied");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load current user from Supabase
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setCurrentUser(null);
        return;
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        console.error('Error loading profile:', profileError);
        return;
      }

      // Fetch roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
      }

      const roles = (userRoles && userRoles.length > 0 
        ? userRoles.map(r => r.role as UserRole) 
        : ['mitglied']) as UserRole[];
      
      console.log('Loaded roles for user:', roles);
      
      const primaryRole = roles.find(r => r === 'vorstand') 
        || roles.find(r => r === 'admin') 
        || roles.find(r => r === 'kranfuehrer') 
        || roles.find(r => r === 'mitglied') 
        || 'gastmitglied';

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

      console.log('Setting current user:', user);
      setCurrentUser(user);
      setCurrentRole(settings.defaultRole || primaryRole);
    };

    loadUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth event in useRole:', event);
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentRole('mitglied');
      } else if (event === 'SIGNED_IN') {
        loadUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [settings.defaultRole]);

  // Set default role on mount
  useEffect(() => {
    if (currentUser && settings.defaultRole) {
      setCurrentRole(settings.defaultRole);
    }
  }, [settings.defaultRole, currentUser]);
  
  const setRole = (role: UserRole) => {
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
      hasAnyRole
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