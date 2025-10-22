import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function RoleUsersInitializer() {
  const { toast } = useToast();
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (hasRun) return;

    const createRoleUsers = async () => {
      try {
        console.log('Creating role users...');
        
        const { data, error } = await supabase.functions.invoke('create-role-users');

        if (error) {
          console.error('Error creating role users:', error);
          return;
        }

        console.log('Role users created:', data);
        toast({
          title: "Rollen-Benutzer erstellt",
          description: "Testbenutzer für alle Rollen wurden erfolgreich erstellt.",
        });

        setHasRun(true);
      } catch (error) {
        console.error('Exception:', error);
      }
    };

    // Run once on mount after a short delay
    const timer = setTimeout(createRoleUsers, 2000);
    return () => clearTimeout(timer);
  }, [toast, hasRun]);

  return null;
}