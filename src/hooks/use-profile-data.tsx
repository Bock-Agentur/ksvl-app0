import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "./use-role";

export function useProfileData(options?: { enabled?: boolean }) {
  const { currentUser } = useRole();
  const enabled = options?.enabled ?? true;
  
  const { data, isLoading } = useQuery({
    queryKey: ['profile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, name, email, monday_item_id')
        .eq('id', currentUser.id)
        .single();
      
      if (!data) return null;
      
      return {
        firstName: data.first_name || data.name?.split(' ')[0] || 'User',
        lastName: data.last_name || data.name?.split(' ')[1] || '',
        fullName: data.first_name && data.last_name
          ? `${data.first_name} ${data.last_name}`
          : data.name || 'User',
        email: data.email,
        mondayItemId: data.monday_item_id,
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes cache - profiles don't change often
    gcTime: 60 * 60 * 1000, // 60 minutes in cache
    enabled: enabled && !!currentUser?.id,
  });

  return { 
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    fullName: data?.fullName || '',
    email: data?.email || '',
    mondayItemId: data?.mondayItemId,
    isLoading 
  };
}
