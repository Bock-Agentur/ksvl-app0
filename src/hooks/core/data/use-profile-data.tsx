import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "../auth/use-role";
import { useUserData } from "./use-users-data";

export function useProfileData(options?: { enabled?: boolean }) {
  const { currentUser } = useRole();
  const enabled = options?.enabled ?? true;
  
  // ✅ Use centralized user data hook
  const { user, isLoading } = useUserData(currentUser?.id, { enabled });

  // Transform to expected format
  const data = user ? {
    firstName: user.first_name || user.name?.split(' ')[0] || 'User',
    lastName: user.last_name || user.name?.split(' ')[1] || '',
    fullName: user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.name || 'User',
    email: user.email,
  } : null;

  return { 
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    fullName: data?.fullName || '',
    email: data?.email || '',
    isLoading 
  };
}
