/**
 * User-related Type Definitions
 * Extracted from main types file for better organization
 */

// ===== USER TYPES =====
export type UserRole = "mitglied" | "kranfuehrer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  boatName?: string;
  memberNumber: string;
  roles: UserRole[]; // Mehrere Rollen möglich
  role: UserRole; // Backward compatibility - primary role
  status: "active" | "inactive";
  joinDate: string;
  joinedAt?: string; // For backward compatibility
  isActive: boolean;
}

// ===== API TYPES =====
export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  boatName?: string;
  memberNumber: string;
  roles: UserRole[]; // Mehrere Rollen möglich
  role: UserRole; // Primary role for backward compatibility
  status?: "active" | "inactive";
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  boatName?: string;
  memberNumber?: string;
  roles?: UserRole[]; // Mehrere Rollen möglich
  role?: UserRole; // Primary role for backward compatibility
  status?: "active" | "inactive";
  isActive?: boolean;
}

// ===== CONTEXT TYPES =====
export interface RoleContextType {
  currentRole: UserRole;
  currentRoles: UserRole[]; // Alle Rollen des aktuellen Nutzers
  currentUser: User | null;
  setRole: (role: UserRole) => void;
  setCurrentUser: (user: User | null) => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

// Helper function to generate roles based on primary role
export const generateRolesFromPrimary = (primaryRole: UserRole): UserRole[] => {
  switch (primaryRole) {
    case "admin":
      return ["admin", "kranfuehrer", "mitglied"]; // Admins haben alle Rollen
    case "kranfuehrer":
      return ["kranfuehrer", "mitglied"]; // Kranführer sind auch Mitglieder
    case "mitglied":
      return ["mitglied"]; // Mitglieder haben nur ihre eigene Rolle
    default:
      return ["mitglied"];
  }
};