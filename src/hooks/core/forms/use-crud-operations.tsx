import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ApiResponse } from "@/types";
import { logger } from "@/lib/logger";

interface CrudConfig<T> {
  entityName: string; // e.g., "Benutzer", "Slot", "Nachricht"
  onAdd?: (item: T) => void;
  onUpdate?: (id: string, item: Partial<T>) => void;
  onDelete?: (id: string) => void;
  onGet?: (id: string) => T | undefined;
  onList?: () => T[];
}

interface CrudOperations<T> {
  create: (item: Omit<T, 'id'>) => Promise<boolean>;
  update: (id: string, updates: Partial<T>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  get: (id: string) => T | undefined;
  list: () => T[];
  bulkDelete: (ids: string[]) => Promise<boolean>;
}

/**
 * Wiederverwendbarer Hook für CRUD-Operationen mit Toast-Integration
 * Abstrahiert die gemeinsame Logik für Create, Read, Update, Delete
 */
export function useCrudOperations<T extends { id: string }>(
  config: CrudConfig<T>
): CrudOperations<T> {
  const { toast } = useToast();
  const { entityName, onAdd, onUpdate, onDelete, onGet, onList } = config;

  const create = useCallback(async (item: Omit<T, 'id'>): Promise<boolean> => {
    try {
      const itemWithId = {
        ...item,
        id: Math.random().toString(36).substr(2, 9)
      } as T;

      onAdd?.(itemWithId);

      toast({
        title: "Erfolgreich erstellt",
        description: `${entityName} wurde erfolgreich erstellt.`,
        variant: "default",
      });

      return true;
    } catch (error) {
      logger.error('CRUD', `Error creating ${entityName}`, error);
      toast({
        title: "Fehler beim Erstellen",
        description: `${entityName} konnte nicht erstellt werden.`,
        variant: "destructive",
      });
      return false;
    }
  }, [entityName, onAdd, toast]);

  const update = useCallback(async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      onUpdate?.(id, updates);

      toast({
        title: "Erfolgreich aktualisiert",
        description: `${entityName} wurde erfolgreich aktualisiert.`,
        variant: "default",
      });

      return true;
    } catch (error) {
      logger.error('CRUD', `Error updating ${entityName}`, error);
      toast({
        title: "Fehler beim Aktualisieren",
        description: `${entityName} konnte nicht aktualisiert werden.`,
        variant: "destructive",
      });
      return false;
    }
  }, [entityName, onUpdate, toast]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      onDelete?.(id);

      toast({
        title: "Erfolgreich gelöscht",
        description: `${entityName} wurde erfolgreich gelöscht.`,
        variant: "default",
      });

      return true;
    } catch (error) {
      logger.error('CRUD', `Error deleting ${entityName}`, error);
      toast({
        title: "Fehler beim Löschen",
        description: `${entityName} konnte nicht gelöscht werden.`,
        variant: "destructive",
      });
      return false;
    }
  }, [entityName, onDelete, toast]);

  const bulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      for (const id of ids) {
        onDelete?.(id);
      }

      toast({
        title: "Erfolgreich gelöscht",
        description: `${ids.length} ${entityName} wurden erfolgreich gelöscht.`,
        variant: "default",
      });

      return true;
    } catch (error) {
      logger.error('CRUD', `Error bulk deleting ${entityName}`, error);
      toast({
        title: "Fehler beim Löschen",
        description: `${entityName} konnten nicht gelöscht werden.`,
        variant: "destructive",
      });
      return false;
    }
  }, [entityName, onDelete, toast]);

  const get = useCallback((id: string): T | undefined => {
    return onGet?.(id);
  }, [onGet]);

  const list = useCallback((): T[] => {
    return onList?.() || [];
  }, [onList]);

  return {
    create,
    update,
    remove,
    get,
    list,
    bulkDelete
  };
}

// Utility function für API response handling
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  successMessage?: string,
  errorMessage?: string
): { success: boolean; data?: T } {
  if (response.success && response.data) {
    return { success: true, data: response.data };
  }
  
  return { 
    success: false, 
    data: undefined 
  };
}

// Hook für konfirmation dialogs
export function useConfirmDialog() {
  const { toast } = useToast();

  const confirm = useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    // In einer echten App würde hier ein Dialog-State gesetzt werden
    // Für jetzt verwenden wir window.confirm als Fallback
    if (window.confirm(`${title}\n\n${description}`)) {
      onConfirm();
    } else {
      onCancel?.();
    }
  }, []);

  return { confirm };
}