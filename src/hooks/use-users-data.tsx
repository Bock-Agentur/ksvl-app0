/**
 * Central User Data Hook
 * 
 * Consolidates all user data fetching (profiles + user_roles) into a single
 * query with React Query caching to eliminate redundant database calls.
 * 
 * This hook is consumed by:
 * - useUsers (member management)
 * - useRole (current user context)
 * - useProfileData (user profile display)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseUser } from "./use-users";

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  member_number: string | null;
  boat_name: string | null;
  status: string | null;
  is_test_data: boolean | null;
  is_role_user: boolean | null;
  created_at: string | null;
  roles: string[];
  [key: string]: any; // Allow other profile fields
}

interface UseUsersDataOptions {
  enabled?: boolean;
  userId?: string; // Optional: fetch single user
}

/**
 * Fetches users data with their roles in a single optimized query
 * @param options Configuration options
 * @returns Query result with users data, loading state, and refetch function
 */
export function useUsersData(options: UseUsersDataOptions = {}) {
  const { enabled = true, userId } = options;

  const query = useQuery({
    queryKey: ['users-with-roles', userId],
    queryFn: async () => {
      // Build profiles query
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .order('name');

      // If specific user requested
      if (userId) {
        profilesQuery = profilesQuery.eq('id', userId);
      }

      // Fetch profiles
      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Fetch roles for all users (or specific user)
      let rolesQuery = supabase
        .from('user_roles')
        .select('user_id, role');

      if (userId) {
        rolesQuery = rolesQuery.eq('user_id', userId);
      }

      const { data: userRoles, error: rolesError } = await rolesQuery;
      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
        const roles = userRoles
          ?.filter(r => r.user_id === profile.id)
          .map(r => r.role) || [];

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
          phone: profile.phone,
          member_number: profile.member_number,
          boat_name: profile.boat_name,
          status: profile.status,
          is_test_data: profile.is_test_data,
          is_role_user: profile.is_role_user,
          created_at: profile.created_at,
          roles,
          // Spread all other profile fields
          ...profile
        };
      });

      return usersWithRoles;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
  });

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single user's data
 * @param userId User ID to fetch
 * @param options Configuration options
 */
export function useUserData(userId: string | undefined, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  
  const { users, isLoading, error, refetch } = useUsersData({
    enabled: enabled && !!userId,
    userId,
  });

  return {
    user: users[0] || null,
    isLoading,
    error,
    refetch,
  };
}
