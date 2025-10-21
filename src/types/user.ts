/**
 * User-related Type Definitions
 * Extracted from main types file for better organization
 */

// ===== USER TYPES =====
export type UserRole = "mitglied" | "kranfuehrer" | "admin" | "gastmitglied" | "vorstand";

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  boatName?: string;
  memberNumber: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
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
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  boatName?: string;
  memberNumber: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  roles: UserRole[]; // Mehrere Rollen möglich
  role: UserRole; // Primary role for backward compatibility
  status?: "active" | "inactive";
}

export interface UpdateUserRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  boatName?: string;
  memberNumber?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
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
    case "vorstand":
      return ["vorstand", "admin", "kranfuehrer", "mitglied", "gastmitglied"]; // Vorstand hat alle Rollen
    case "admin":
      return ["admin", "kranfuehrer", "mitglied", "gastmitglied"]; // Admins haben alle Rollen
    case "kranfuehrer":
      return ["kranfuehrer", "mitglied", "gastmitglied"]; // Kranführer sind auch Mitglieder
    case "mitglied":
      return ["mitglied"]; // Mitglieder haben nur ihre eigene Rolle
    case "gastmitglied":
      return ["gastmitglied"]; // Gastmitglieder haben nur ihre eigene Rolle
    default:
      return ["mitglied"];
  }
};