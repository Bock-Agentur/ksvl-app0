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

export interface UpdateProfileData {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  memberNumber?: string;
  boatName?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  oesvNumber?: string;
  address?: string;
  berthNumber?: string;
  berthType?: string;
  birthDate?: string;
  entryDate?: string;
  dinghyBerthNumber?: string;
  boatType?: string;
  boatLength?: number;
  boatWidth?: number;
  boatColor?: string;
  berthLength?: number;
  berthWidth?: number;
  buoyRadius?: number;
  hasDinghyBerth?: boolean;
  parkingPermitNumber?: string;
  parkingPermitIssueDate?: string;
  beverageChipNumber?: string;
  beverageChipIssueDate?: string;
  beverageChipStatus?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
  vorstandFunktion?: string;
  membershipType?: string;
  membershipStatus?: string;
  boardPositionStartDate?: string;
  boardPositionEndDate?: string;
  passwordChangeRequired?: boolean;
  twoFactorMethod?: string;
  dataPublicInKsvl?: boolean;
  contactPublicInKsvl?: boolean;
  newsletterOptin?: boolean;
  aiInfoEnabled?: boolean;
  documentBfa?: string;
  documentInsurance?: string;
  documentBerthContract?: string;
  documentMemberPhoto?: string;
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

  /**
   * Update own profile directly (without Edge Function)
   * For regular users updating their own profile without role changes
   * 
   * @param data Profile data to update
   */
  async updateProfile(data: UpdateProfileData) {
    const toNullIfEmpty = (value: any) => {
      if (value === '' || value === undefined) return null;
      return value;
    };

    const updateData: Record<string, any> = {
      name: data.name,
      first_name: toNullIfEmpty(data.firstName),
      last_name: toNullIfEmpty(data.lastName),
      phone: toNullIfEmpty(data.phone),
      member_number: toNullIfEmpty(data.memberNumber),
      boat_name: toNullIfEmpty(data.boatName),
      street_address: toNullIfEmpty(data.streetAddress),
      postal_code: toNullIfEmpty(data.postalCode),
      city: toNullIfEmpty(data.city),
      oesv_number: toNullIfEmpty(data.oesvNumber),
      address: toNullIfEmpty(data.address),
      berth_number: toNullIfEmpty(data.berthNumber),
      berth_type: toNullIfEmpty(data.berthType),
      birth_date: toNullIfEmpty(data.birthDate),
      entry_date: toNullIfEmpty(data.entryDate),
      dinghy_berth_number: toNullIfEmpty(data.dinghyBerthNumber),
      boat_type: toNullIfEmpty(data.boatType),
      boat_length: toNullIfEmpty(data.boatLength),
      boat_width: toNullIfEmpty(data.boatWidth),
      boat_color: toNullIfEmpty(data.boatColor),
      berth_length: toNullIfEmpty(data.berthLength),
      berth_width: toNullIfEmpty(data.berthWidth),
      buoy_radius: toNullIfEmpty(data.buoyRadius),
      has_dinghy_berth: data.hasDinghyBerth === true,
      parking_permit_number: toNullIfEmpty(data.parkingPermitNumber),
      parking_permit_issue_date: toNullIfEmpty(data.parkingPermitIssueDate),
      beverage_chip_number: toNullIfEmpty(data.beverageChipNumber),
      beverage_chip_issue_date: toNullIfEmpty(data.beverageChipIssueDate),
      beverage_chip_status: toNullIfEmpty(data.beverageChipStatus),
      emergency_contact: toNullIfEmpty(data.emergencyContact),
      emergency_contact_name: toNullIfEmpty(data.emergencyContactName),
      emergency_contact_phone: toNullIfEmpty(data.emergencyContactPhone),
      emergency_contact_relationship: toNullIfEmpty(data.emergencyContactRelationship),
      notes: toNullIfEmpty(data.notes),
      vorstand_funktion: toNullIfEmpty(data.vorstandFunktion),
      membership_type: toNullIfEmpty(data.membershipType),
      membership_status: toNullIfEmpty(data.membershipStatus),
      board_position_start_date: toNullIfEmpty(data.boardPositionStartDate),
      board_position_end_date: toNullIfEmpty(data.boardPositionEndDate),
      password_change_required: data.passwordChangeRequired === true,
      two_factor_method: toNullIfEmpty(data.twoFactorMethod),
      data_public_in_ksvl: data.dataPublicInKsvl === true,
      contact_public_in_ksvl: data.contactPublicInKsvl === true,
      newsletter_optin: data.newsletterOptin === true,
      ai_info_enabled: data.aiInfoEnabled === true,
      document_bfa: toNullIfEmpty(data.documentBfa),
      document_insurance: toNullIfEmpty(data.documentInsurance),
      document_berth_contract: toNullIfEmpty(data.documentBerthContract),
      document_member_photo: toNullIfEmpty(data.documentMemberPhoto)
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', data.id);

    if (error) throw error;
    return { success: true };
  }
}

// Export singleton instance
export const userService = new UserService();
