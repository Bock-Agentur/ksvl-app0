import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole, RoleContextType, User, generateRolesFromPrimary } from "@/types";
import { useMenuSettings } from "@/hooks/use-menu-settings";

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { settings } = useMenuSettings();
  const [currentRole, setCurrentRole] = useState<UserRole>("kranfuehrer");
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "admin-harald", // Muss mit Test-Daten übereinstimmen
    name: "Harald",
    email: "harald@hafen.com",
    phone: "+43 664 100 0001",
    memberNumber: "ADMIN001",
    role: "admin",
    roles: generateRolesFromPrimary("admin"), // Admin hat alle Rollen: admin, kranfuehrer, mitglied
    status: "active", 
    joinDate: "2020-01-01",
    isActive: true
  });

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