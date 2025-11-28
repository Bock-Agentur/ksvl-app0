/**
 * User Service
 * 
 * Centralized service for all user-related CRUD operations.
 * Abstracts Supabase and Edge Function calls for better testability
 * and maintainability.
 */

import { supabase } from "@/integrations/supabase/client";
import { UserRole, generateRolesFromPrimary } from "@/types";

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  memberNumber?: string;
  boatName?: string;
  status?: 'active' | 'inactive';
  roles?: UserRole[];
  role?: UserRole;
  
  // Additional profile fields
  oesvNumber?: string;
  address?: string;
  berthNumber?: string;
  berthType?: string;
  birthDate?: string;
  entryDate?: string;
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  membershipType?: string;
  membershipStatus?: string;
  vorstandFunktion?: string;
  boatType?: string;
  boatLength?: number;
  boatWidth?: number;
  boatColor?: string;
  berthLength?: number;
  berthWidth?: number;
  buoyRadius?: number;
  hasDinghyBerth?: boolean;
  beverageChipStatus?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

export interface UpdatePasswordData {
  userId: string;
  password: string;
}

/**
 * User Service Class
 */
class UserService {
  /**
   * Get current auth session
   */
  private async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Nicht angemeldet. Bitte melden Sie sich an.');
    }
    return session;
  }

  /**
   * Get Edge Function URL
   */
  private getEdgeFunctionUrl(functionName: string): string {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
  }

  /**
   * Create a new user
   * 
   * @param data User data including password
   * @returns Created user data
   */
  async createUser(data: CreateUserData) {
    const session = await this.getSession();

    const response = await fetch(this.getEdgeFunctionUrl('manage-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: 'create',
        userData: {
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          memberNumber: data.memberNumber,
          boatName: data.boatName,
          status: data.status || 'active',
          roles: data.roles || generateRolesFromPrimary(data.role || 'mitglied'),
          oesvNumber: data.oesvNumber,
          address: data.address,
          berthNumber: data.berthNumber,
          berthType: data.berthType,
          birthDate: data.birthDate,
          entryDate: data.entryDate,
          firstName: data.firstName,
          lastName: data.lastName,
          streetAddress: data.streetAddress,
          postalCode: data.postalCode,
          city: data.city,
          membershipType: data.membershipType,
          membershipStatus: data.membershipStatus,
          vorstandFunktion: data.vorstandFunktion,
          boatType: data.boatType,
          boatLength: data.boatLength,
          boatWidth: data.boatWidth,
          boatColor: data.boatColor,
          berthLength: data.berthLength,
          berthWidth: data.berthWidth,
          buoyRadius: data.buoyRadius,
          hasDinghyBerth: data.hasDinghyBerth,
          beverageChipStatus: data.beverageChipStatus,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone
        }
      })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Benutzer konnte nicht erstellt werden');
    }

    return result;
  }

  /**
   * Update an existing user
   * 
   * @param data User data to update (must include id)
   * @returns Updated user data
   */
  async updateUser(data: UpdateUserData) {
    const session = await this.getSession();

    const response = await fetch(this.getEdgeFunctionUrl('manage-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: 'update',
        userId: data.id,
        userData: {
          name: data.name,
          phone: data.phone,
          memberNumber: data.memberNumber,
          boatName: data.boatName,
          status: data.status,
          roles: data.roles,
          oesvNumber: data.oesvNumber,
          address: data.address,
          berthNumber: data.berthNumber,
          berthType: data.berthType,
          birthDate: data.birthDate,
          entryDate: data.entryDate,
          firstName: data.firstName,
          lastName: data.lastName,
          streetAddress: data.streetAddress,
          postalCode: data.postalCode,
          city: data.city,
          membershipType: data.membershipType,
          membershipStatus: data.membershipStatus,
          vorstandFunktion: data.vorstandFunktion,
          boatType: data.boatType,
          boatLength: data.boatLength,
          boatWidth: data.boatWidth,
          boatColor: data.boatColor,
          berthLength: data.berthLength,
          berthWidth: data.berthWidth,
          buoyRadius: data.buoyRadius,
          hasDinghyBerth: data.hasDinghyBerth,
          beverageChipStatus: data.beverageChipStatus,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone
        }
      })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Benutzer konnte nicht aktualisiert werden');
    }

    return result;
  }

  /**
   * Delete a user
   * 
   * @param userId User ID to delete
   */
  async deleteUser(userId: string) {
    const session = await this.getSession();

    const response = await fetch(this.getEdgeFunctionUrl('manage-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: 'delete',
        userId
      })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Benutzer konnte nicht gelöscht werden');
    }

    return result;
  }

  /**
   * Update user password
   * 
   * @param data Password update data
   */
  async updatePassword(data: UpdatePasswordData) {
    const session = await this.getSession();

    const response = await fetch(this.getEdgeFunctionUrl('manage-user-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: 'update',
        userId: data.userId,
        password: data.password
      })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Passwort konnte nicht aktualisiert werden');
    }

    return result;
  }

  /**
   * Reset user password (admin only)
   * 
   * @param userId User ID
   * @param newPassword New password
   */
  async resetPassword(userId: string, newPassword: string) {
    return this.updatePassword({ userId, password: newPassword });
  }
}

// Export singleton instance
export const userService = new UserService();
