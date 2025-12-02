/**
 * useFileManagerActions Hook
 * 
 * Encapsulates bulk file operations (permissions, delete, migrate)
 * for the file manager. Replaces direct supabase calls in the component.
 */

import { useState } from "react";
import { toast } from "sonner";
import { fileService } from "@/lib/services/file-service";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/query-keys";

interface UseFileManagerActionsOptions {
  onSuccess?: () => void;
}

export function useFileManagerActions(options?: UseFileManagerActionsOptions) {
  const [isMigrating, setIsMigrating] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Bulk update permissions for multiple files
   */
  const handleBulkPermissions = async (
    selectedFiles: string[],
    roles: string[]
  ): Promise<boolean> => {
    try {
      const result = await fileService.updateMultiplePermissions(selectedFiles, roles);

      if (result.failed > 0) {
        toast.error(`Fehler beim Aktualisieren von ${result.failed} Datei(en)`);
        return false;
      }

      toast.success(`Berechtigungen für ${result.success} Datei(en) aktualisiert`);
      
      // Invalidate queries to refresh file list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
      options?.onSuccess?.();
      
      return true;
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Berechtigungen');
      return false;
    }
  };

  /**
   * Migrate files from storage to file_metadata table
   */
  const handleMigrateFiles = async (): Promise<boolean> => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-storage-files', {
        body: { bucketName: 'login-media' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Migration erfolgreich! ${data.migratedCount} Dateien migriert, ${data.skippedCount} übersprungen.`
        );
        
        // Invalidate queries to refresh file list instead of page reload
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
        options?.onSuccess?.();
        
        return true;
      } else {
        toast.error(`Migration mit Fehlern: ${data.errors.join(', ')}`);
        return false;
      }
    } catch (error) {
      toast.error('Migration fehlgeschlagen');
      return false;
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    isMigrating,
    handleBulkPermissions,
    handleMigrateFiles,
  };
}