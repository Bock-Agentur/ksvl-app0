import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DatabaseUser {
  id: string;
  email: string;
  name: string | null; // Maps to 'user' field for display
  phone: string | null;
  member_number: string | null;
  memberNumber?: string | null; // Alias for compatibility
  boat_name: string | null;
  boatName?: string | null; // Alias for compatibility
  status: string | null;
  is_test_data: boolean | null;
  created_at?: string; // Add created_at field
  roles: string[];
  role?: string; // Primary role for compatibility
  joinDate?: string;
  isActive?: boolean;
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
        .order('user');

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
          name: profile.user,
          phone: profile.phone,
          member_number: profile.member_number,
          memberNumber: profile.member_number, // Alias
          boat_name: profile.boat_name,
          boatName: profile.boat_name, // Alias
          status: profile.status,
          is_test_data: profile.is_test_data,
          created_at: profile.created_at,
          roles,
          role: primaryRole,
          isActive: profile.status === 'active',
          joinDate: profile.entry_date || profile.created_at,
          oesv_number: profile.oesv_number,
          address: profile.address,
          berth_number: profile.berth_number,
          berth_type: profile.berth_type,
          birth_date: profile.birth_date,
          entry_date: profile.entry_date
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