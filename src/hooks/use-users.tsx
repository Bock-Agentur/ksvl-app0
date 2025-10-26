import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useUsers() {
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) throw profilesError;

      if (!profiles) {
        setUsers([]);
        return;
      }

      // Fetch roles for all users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: DatabaseUser[] = profiles.map(profile => {
        const roles = userRoles
          ?.filter(r => r.user_id === profile.id)
          .map(r => r.role) || [];

        // Primary role is first non-mitglied role, or first role
        const primaryRole = roles.find(r => r !== 'mitglied') || roles[0] || 'mitglied';

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          phone: profile.phone,
          member_number: profile.member_number,
          memberNumber: profile.member_number, // Alias
          boat_name: profile.boat_name,
          boatName: profile.boat_name, // Alias
          status: profile.status,
          is_test_data: profile.is_test_data,
          is_role_user: profile.is_role_user,
          created_at: profile.created_at,
          roles,
          role: primaryRole,
          isActive: profile.status === 'active',
          joinDate: profile.entry_date || profile.created_at,
          
          // Existing fields
          oesv_number: profile.oesv_number,
          address: profile.address,
          berth_number: profile.berth_number,
          berth_type: profile.berth_type,
          birth_date: profile.birth_date,
          entry_date: profile.entry_date,
          
          // New fields from migration
          first_name: profile.first_name,
          last_name: profile.last_name,
          street_address: profile.street_address,
          postal_code: profile.postal_code,
          city: profile.city,
          password_change_required: profile.password_change_required,
          two_factor_method: profile.two_factor_method,
          membership_type: profile.membership_type,
          membership_status: profile.membership_status,
          board_position_start_date: profile.board_position_start_date,
          board_position_end_date: profile.board_position_end_date,
          boat_type: profile.boat_type,
          boat_length: profile.boat_length,
          boat_width: profile.boat_width,
          boat_color: profile.boat_color,
          berth_length: profile.berth_length,
          berth_width: profile.berth_width,
          buoy_radius: profile.buoy_radius,
          has_dinghy_berth: profile.has_dinghy_berth,
          dinghy_berth_number: profile.dinghy_berth_number,
          parking_permit_number: profile.parking_permit_number,
          parking_permit_issue_date: profile.parking_permit_issue_date,
          beverage_chip_number: profile.beverage_chip_number,
          beverage_chip_issue_date: profile.beverage_chip_issue_date,
          beverage_chip_status: profile.beverage_chip_status,
          vorstand_funktion: profile.vorstand_funktion,
          ai_info_enabled: profile.ai_info_enabled,
          data_public_in_ksvl: profile.data_public_in_ksvl,
          contact_public_in_ksvl: profile.contact_public_in_ksvl,
          statute_accepted: profile.statute_accepted,
          privacy_accepted: profile.privacy_accepted,
          newsletter_optin: profile.newsletter_optin,
          emergency_contact: profile.emergency_contact,
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_phone: profile.emergency_contact_phone,
          emergency_contact_relationship: profile.emergency_contact_relationship,
          notes: profile.notes,
          document_bfa: profile.document_bfa,
          document_insurance: profile.document_insurance,
          document_berth_contract: profile.document_berth_contract,
          document_member_photo: profile.document_member_photo,
          membership_status_history: profile.membership_status_history,
          board_position_history: profile.board_position_history,
          created_by: profile.created_by,
          modified_by: profile.modified_by
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Subscribe to changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => fetchUsers()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      profilesChannel.unsubscribe();
    };
  }, []);

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

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  return {
    users,
    loading,
    refreshUsers: fetchUsers,
    deleteUser
  };
}