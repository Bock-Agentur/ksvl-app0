import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "./use-role";

export function useProfileData() {
  const { currentUser } = useRole();
  
  const { data: firstName = '', isLoading } = useQuery({
    queryKey: ['profile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return '';
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name, name')
        .eq('id', currentUser.id)
        .single();
      
      return data?.first_name || 
             data?.name?.split(' ')[0] || 
             currentUser?.email?.split('@')[0] || 
             'User';
    },
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    gcTime: 60 * 60 * 1000, // 60 minutes in cache
    enabled: !!currentUser?.id
  });

  return { firstName, isLoading };
}
