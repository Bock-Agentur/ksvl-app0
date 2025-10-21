import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CreateAdminHelper() {
  const { toast } = useToast();

  useEffect(() => {
    const createAdmin = async () => {
      try {
        console.log('Creating admin user...');
        
        const { data, error } = await supabase.functions.invoke('create-admin', {
          body: {
            email: 'h@jorgson.com',
            password: '123456',
            name: 'Administrator'
          }
        });

        if (error) {
          console.error('Error creating admin:', error);
          toast({
            title: "Fehler",
            description: "Admin-Benutzer konnte nicht erstellt werden: " + error.message,
            variant: "destructive"
          });
          return;
        }

        console.log('Admin created:', data);
        toast({
          title: "Admin erstellt",
          description: "Admin-Benutzer wurde erfolgreich erstellt. Sie können sich jetzt mit h@jorgson.com anmelden.",
        });

      } catch (error) {
        console.error('Exception:', error);
      }
    };

    // Run once on mount
    const timer = setTimeout(createAdmin, 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  return null;
}
