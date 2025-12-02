import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks';
import { useUsersData } from './use-users-data';
import { useRealtimeSubscription } from '@/lib/realtime-manager';
import { logger } from '@/lib/logger';

export interface DatabaseUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  phone: string | null;
  member_number: string | null;
  memberNumber?: string | null;
  boat_name: string | null;
  boatName?: string | null;
  status: string | null;
  is_test_data: boolean | null;
  is_role_user: boolean | null;
  created_at?: string;
  roles: string[];
  role?: string;
  joinDate?: string;
  isActive?: boolean;
  
  // Existing profile fields
  oesv_number?: string | null;
  address?: string | null;
  berth_number?: string | null;
  berth_type?: string | null;
  birth_date?: string | null;
  entry_date?: string | null;
  
  // New fields from migration
  first_name?: string | null;
  last_name?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  password_change_required?: boolean | null;
  two_factor_method?: string | null;
  membership_type?: string | null;
  membership_status?: string | null;
  board_position_start_date?: string | null;
  board_position_end_date?: string | null;
  boat_type?: string | null;
  boat_length?: number | null;
  boat_width?: number | null;
  boat_color?: string | null;
  berth_length?: number | null;
  berth_width?: number | null;
  buoy_radius?: number | null;
  has_dinghy_berth?: boolean | null;
  dinghy_berth_number?: string | null;
  parking_permit_number?: string | null;
  parking_permit_issue_date?: string | null;
  beverage_chip_number?: string | null;
  beverage_chip_issue_date?: string | null;
  beverage_chip_status?: string | null;
  vorstand_funktion?: string | null;
  ai_info_enabled?: boolean | null;
  data_public_in_ksvl?: boolean | null;
  contact_public_in_ksvl?: boolean | null;
  statute_accepted?: boolean | null;
  privacy_accepted?: boolean | null;
  newsletter_optin?: boolean | null;
  emergency_contact?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  notes?: string | null;
  document_bfa?: string | null;
  document_insurance?: string | null;
  document_berth_contract?: string | null;
  document_member_photo?: string | null;
  membership_status_history?: any;
  board_position_history?: any;
  created_by?: string | null;
  modified_by?: string | null;
}

export function useUsers(options?: { enabled?: boolean }) {
  const { toast } = useToast();
  const enabled = options?.enabled ?? true;

  // ✅ Use centralized user data hook with caching
  const { users: rawUsers, isLoading, refetch } = useUsersData({ enabled });

  // Transform to DatabaseUser format with all fields
  const users: DatabaseUser[] = rawUsers.map(user => {
    const primaryRole = user.roles.find(r => r !== 'mitglied') || user.roles[0] || 'mitglied';
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      phone: user.phone,
      member_number: user.member_number,
      memberNumber: user.member_number,
      boat_name: user.boat_name,
      boatName: user.boat_name,
      status: user.status,
      is_test_data: user.is_test_data,
      is_role_user: user.is_role_user,
      created_at: user.created_at,
      roles: user.roles,
      role: primaryRole,
      isActive: user.status === 'active',
      joinDate: user.entry_date || user.created_at,
      // All other profile fields
      oesv_number: user.oesv_number,
      address: user.address,
      berth_number: user.berth_number,
      berth_type: user.berth_type,
      birth_date: user.birth_date,
      entry_date: user.entry_date,
      first_name: user.first_name,
      last_name: user.last_name,
      street_address: user.street_address,
      postal_code: user.postal_code,
      city: user.city,
      password_change_required: user.password_change_required,
      two_factor_method: user.two_factor_method,
      membership_type: user.membership_type,
      membership_status: user.membership_status,
      board_position_start_date: user.board_position_start_date,
      board_position_end_date: user.board_position_end_date,
      boat_type: user.boat_type,
      boat_length: user.boat_length,
      boat_width: user.boat_width,
      boat_color: user.boat_color,
      berth_length: user.berth_length,
      berth_width: user.berth_width,
      buoy_radius: user.buoy_radius,
      has_dinghy_berth: user.has_dinghy_berth,
      dinghy_berth_number: user.dinghy_berth_number,
      parking_permit_number: user.parking_permit_number,
      parking_permit_issue_date: user.parking_permit_issue_date,
      beverage_chip_number: user.beverage_chip_number,
      beverage_chip_issue_date: user.beverage_chip_issue_date,
      beverage_chip_status: user.beverage_chip_status,
      vorstand_funktion: user.vorstand_funktion,
      ai_info_enabled: user.ai_info_enabled,
      data_public_in_ksvl: user.data_public_in_ksvl,
      contact_public_in_ksvl: user.contact_public_in_ksvl,
      statute_accepted: user.statute_accepted,
      privacy_accepted: user.privacy_accepted,
      newsletter_optin: user.newsletter_optin,
      emergency_contact: user.emergency_contact,
      emergency_contact_name: user.emergency_contact_name,
      emergency_contact_phone: user.emergency_contact_phone,
      emergency_contact_relationship: user.emergency_contact_relationship,
      notes: user.notes,
      document_bfa: user.document_bfa,
      document_insurance: user.document_insurance,
      document_berth_contract: user.document_berth_contract,
      document_member_photo: user.document_member_photo,
      membership_status_history: user.membership_status_history,
      board_position_history: user.board_position_history,
      created_by: user.created_by,
      modified_by: user.modified_by
    };
  });

  // ✅ Use realtime manager for subscriptions (automatic deduplication)
  useRealtimeSubscription(
    { table: 'profiles', event: '*' },
    'use-users-profiles',
    () => refetch(),
    300, // 300ms debounce
    enabled
  );

  useRealtimeSubscription(
    { table: 'user_roles', event: '*' },
    'use-users-roles',
    () => refetch(),
    300, // 300ms debounce
    enabled
  );

  const deleteUser = async (userId: string) => {
    try {
      // Delete user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Benutzer gelöscht",
        description: "Der Benutzer wurde erfolgreich entfernt."
      });

      refetch();
    } catch (error) {
      logger.error('USER', 'Error deleting user', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  return {
    users,
    loading: isLoading,
    refreshUsers: refetch,
    deleteUser
  };
}