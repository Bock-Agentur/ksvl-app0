import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { userApi, slotApi, auditLogApi, handleApiResponse, apiCache } from "@/lib/api-layer";
import { User, Slot, AuditLogEntry, ApiResponse } from "@/types";

interface ApiDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface ApiDataActions<T> {
  refresh: () => Promise<void>;
  invalidate: () => void;
  updateOptimistic: (id: string, updates: Partial<T>) => void;
  removeOptimistic: (id: string) => void;
}

/**
 * Hook für API-Datenmanagement mit Caching und Error Handling
 * Ersetzt schrittweise die Test-Data-Hooks
 */
function useApiData<T extends { id: string }>(
  apiCall: () => Promise<ApiResponse<T[]>>,
  cacheKey: string,
  cacheTtl: number = 5 * 60 * 1000 // 5 Minuten
): ApiDataState<T> & ApiDataActions<T> {
  
  const [state, setState] = useState<ApiDataState<T>>({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  });
  
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = apiCache.get<T[]>(cacheKey);
    if (cachedData) {
      setState(prev => ({
        ...prev,
        data: cachedData,
        lastUpdated: new Date()
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      const { data, error } = handleApiResponse(response);
      
      if (data) {
        setState({
          data,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
        
        // Cache successful response
        apiCache.set(cacheKey, data, cacheTtl);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error || 'Failed to fetch data'
        }));
        
        if (error) {
          toast({
            title: "Fehler beim Laden",
            description: error,
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      toast({
        title: "Netzwerkfehler",
        description: "Daten konnten nicht geladen werden",
        variant: "destructive"
      });
    }
  }, [apiCall, cacheKey, cacheTtl, toast]);

  const refresh = useCallback(async () => {
    apiCache.invalidate(cacheKey);
    await fetchData();
  }, [fetchData, cacheKey]);

  const invalidate = useCallback(() => {
    apiCache.invalidate(cacheKey);
  }, [cacheKey]);

  const updateOptimistic = useCallback((id: string, updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  }, []);

  const removeOptimistic = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id)
    }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
    invalidate,
    updateOptimistic,
    removeOptimistic
  };
}

// ===== SPECIALIZED HOOKS =====

/**
 * Hook für Benutzerdaten mit API-Integration
 */
export function useApiUsers() {
  return useApiData(
    () => userApi.getUsers(),
    'users'
  );
}

/**
 * Hook für Slot-Daten mit API-Integration  
 */
export function useApiSlots(params?: {
  dateFrom?: string;
  dateTo?: string;
  craneOperatorId?: string;
}) {
  return useApiData(
    () => slotApi.getSlots(params),
    `slots-${JSON.stringify(params || {})}`
  );
}

/**
 * Hook für Audit-Logs mit API-Integration
 */
export function useApiAuditLogs(params?: {
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useApiData(
    () => auditLogApi.getAuditLogs(params),
    `audit-logs-${JSON.stringify(params || {})}`
  );
}

/**
 * Migration Hook - Übergang von Test Data zu API
 */
export function useMigrationState() {
  const [isMigrated, setIsMigrated] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const { toast } = useToast();

  const migrateToApi = useCallback(async (
    testUsers: User[], 
    testSlots: Slot[]
  ) => {
    setMigrationProgress(0);
    
    try {
      // Migrate users first
      setMigrationProgress(25);
      for (const user of testUsers) {
        await userApi.createUser({
          name: user.name,
          email: user.email,
          phone: user.phone,
          boatName: user.boatName,
          memberNumber: user.memberNumber,
          role: user.role,
          roles: user.roles,
          status: user.status
        });
      }
      
      setMigrationProgress(75);
      
      // Migrate slots
      for (const slot of testSlots) {
        await slotApi.createSlot({
          date: slot.date,
          time: slot.time,
          duration: slot.duration,
          craneOperatorId: slot.craneOperator.id,
          notes: slot.notes
        });
      }
      
      setMigrationProgress(100);
      setIsMigrated(true);
      
      toast({
        title: "Migration erfolgreich",
        description: "Alle Test-Daten wurden zur Datenbank migriert",
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Migration fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    isMigrated,
    migrationProgress,
    migrateToApi,
    setIsMigrated
  };
}

/**
 * Real-time updates Hook
 */
export function useRealTimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // WebSocket connection would be established here
    // For now, we simulate connection status
    setIsConnected(true);
    
    return () => {
      setIsConnected(false);
    };
  }, []);

  const subscribeToSlotUpdates = useCallback((callback: (slot: Slot) => void) => {
    // WebSocket subscription would be implemented here
    // For now, return a cleanup function
    return () => {};
  }, []);

  const subscribeToUserUpdates = useCallback((callback: (user: User) => void) => {
    return () => {};
  }, []);

  return {
    isConnected,
    subscribeToSlotUpdates,
    subscribeToUserUpdates
  };
}