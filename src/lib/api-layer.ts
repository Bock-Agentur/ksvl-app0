/**
 * Zentraler API-Layer für Datenbank-Integration
 * Bereitet die App für echte Backend-Anbindung vor
 */

import { 
  User, 
  Slot, 
  AuditLogEntry, 
  Message,
  CreateUserRequest,
  UpdateUserRequest,
  CreateSlotRequest,
  UpdateSlotRequest,
  BookSlotRequest,
  ApiResponse,
  PaginatedResponse
} from "@/types";

// ===== API CONFIG =====
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT = 10000;

class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ===== BASE API CLIENT =====
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Operation successful'
      };
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message,
          message: 'API request failed'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Network error occurred'
      };
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const searchParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${searchParams}`);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// ===== API INSTANCES =====
const apiClient = new ApiClient();

// ===== USER API =====
export const userApi = {
  /**
   * Get all users with optional filtering and pagination
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<User[]>('/users', params);
    // Transform ApiResponse to PaginatedResponse for mock compatibility
    return {
      data: response.data || [],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: response.data?.length || 0,
        totalPages: Math.ceil((response.data?.length || 0) / (params?.limit || 20))
      },
      success: response.success,
      error: response.error
    };
  },

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/users/${id}`);
  },

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/users', userData);
  },

  /**
   * Update existing user
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${id}`, userData);
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/users/${id}`);
  },

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post('/users/bulk-delete', { ids });
  },

  /**
   * Export users to CSV
   */
  async exportUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Blob>> {
    return apiClient.get('/users/export', filters);
  }
};

// ===== SLOT API =====
export const slotApi = {
  /**
   * Get all slots with optional filtering and pagination
   */
  async getSlots(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    craneOperatorId?: string;
    status?: 'available' | 'booked' | 'blocked';
  }): Promise<PaginatedResponse<Slot>> {
    const response = await apiClient.get<Slot[]>('/slots', params);
    return {
      data: response.data || [],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: response.data?.length || 0,
        totalPages: Math.ceil((response.data?.length || 0) / (params?.limit || 20))
      },
      success: response.success,
      error: response.error
    };
  },

  /**
   * Get slot by ID
   */
  async getSlot(id: string): Promise<ApiResponse<Slot>> {
    return apiClient.get<Slot>(`/slots/${id}`);
  },

  /**
   * Create new slot
   */
  async createSlot(slotData: CreateSlotRequest): Promise<ApiResponse<Slot>> {
    return apiClient.post<Slot>('/slots', slotData);
  },

  /**
   * Update existing slot
   */
  async updateSlot(id: string, slotData: UpdateSlotRequest): Promise<ApiResponse<Slot>> {
    return apiClient.patch<Slot>(`/slots/${id}`, slotData);
  },

  /**
   * Delete slot
   */
  async deleteSlot(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/slots/${id}`);
  },

  /**
   * Book a slot
   */
  async bookSlot(bookingData: BookSlotRequest): Promise<ApiResponse<Slot>> {
    return apiClient.post<Slot>('/slots/book', bookingData);
  },

  /**
   * Cancel booking
   */
  async cancelBooking(slotId: string): Promise<ApiResponse<Slot>> {
    return apiClient.post<Slot>(`/slots/${slotId}/cancel`);
  },

  /**
   * Get slots for specific date range
   */
  async getSlotsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Slot[]>> {
    return apiClient.get<Slot[]>('/slots', { dateFrom: startDate, dateTo: endDate });
  },

  /**
   * Validate slot booking (consecutive slots logic)
   */
  async validateSlotBooking(slotData: {
    date: string;
    time: string;
    duration: number;
    craneOperatorId: string;
  }, excludeSlotId?: string): Promise<ApiResponse<{ isValid: boolean; message?: string }>> {
    return apiClient.post('/slots/validate', { ...slotData, excludeSlotId });
  }
};

// ===== AUDIT LOG API =====
export const auditLogApi = {
  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
    targetType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<AuditLogEntry>> {
    const response = await apiClient.get<AuditLogEntry[]>('/audit-logs', params);
    return {
      data: response.data || [],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: response.data?.length || 0,
        totalPages: Math.ceil((response.data?.length || 0) / (params?.limit || 20))
      },
      success: response.success,
      error: response.error
    };
  },

  /**
   * Create audit log entry (usually done automatically by backend)
   */
  async createAuditLog(logData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<ApiResponse<AuditLogEntry>> {
    return apiClient.post<AuditLogEntry>('/audit-logs', logData);
  }
};

// ===== MESSAGE API =====
export const messageApi = {
  /**
   * Get all messages
   */
  async getMessages(params?: {
    page?: number;
    limit?: number;
    status?: string;
    recipient?: string;
  }): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<Message[]>('/messages', params);
    return {
      data: response.data || [],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: response.data?.length || 0,
        totalPages: Math.ceil((response.data?.length || 0) / (params?.limit || 20))
      },
      success: response.success,
      error: response.error
    };
  },

  /**
   * Send message
   */
  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>('/messages', messageData);
  },

  /**
   * Update message
   */
  async updateMessage(id: string, messageData: Partial<Message>): Promise<ApiResponse<Message>> {
    return apiClient.patch<Message>(`/messages/${id}`, messageData);
  },

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/messages/${id}`);
  }
};

// ===== STATISTICS API =====
export const statsApi = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<{
    todayBookings: number;
    weeklyBookings: number;
    availableSlots: number;
    totalMembers: number;
    recentActivity: AuditLogEntry[];
  }>> {
    return apiClient.get('/stats/dashboard');
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    recentJoins: User[];
  }>> {
    return apiClient.get('/stats/users');
  },

  /**
   * Get slot statistics
   */
  async getSlotStats(params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    total: number;
    booked: number;
    available: number;
    byOperator: Record<string, number>;
    utilization: number;
  }>> {
    return apiClient.get('/stats/slots', params);
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Handles API response and extracts data or error
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>
): { data?: T; error?: string } {
  if (response.success && response.data) {
    return { data: response.data };
  }
  
  return { 
    error: response.error || response.message || 'Unknown error occurred'
  };
}

/**
 * Retry mechanism for failed requests
 */
export async function retryRequest<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: ApiResponse<T>;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      if (result.success) {
        return result;
      }
      lastError = result;
    } catch (error) {
      lastError = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  return lastError!;
}

/**
 * Optimistic update helper
 */
export function optimisticUpdate<T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return items.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
}

/**
 * Cache management for API responses
 */
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCache();

// ===== INTEGRATION HOOKS =====

/**
 * Hook für API-Integration mit Test Data Fallback
 * Ermöglicht nahtlosen Übergang von Test-Daten zu echten API-Calls
 */
export function useApiIntegration() {
  const isApiMode = Boolean(import.meta.env.VITE_API_URL);
  
  return {
    isApiMode,
    
    // User operations
    async getUsers(params?: any): Promise<User[]> {
      if (isApiMode) {
        const response = await userApi.getUsers(params);
        return response.data || [];
      }
      // Fallback to test data - wird durch echte API ersetzt
      return [];
    },
    
    async createUser(userData: CreateUserRequest): Promise<User | null> {
      if (isApiMode) {
        const response = await userApi.createUser(userData);
        return response.data || null;
      }
      // Fallback implementation
      return null;
    },
    
    // Slot operations
    async getSlots(params?: any): Promise<Slot[]> {
      if (isApiMode) {
        const response = await slotApi.getSlots(params);
        return response.data || [];
      }
      return [];
    },
    
    // Audit operations
    async getAuditLogs(params?: any): Promise<AuditLogEntry[]> {
      if (isApiMode) {
        const response = await auditLogApi.getAuditLogs(params);
        return response.data || [];
      }
      return [];
    }
  };
}

// ===== WEBHOOK HANDLERS =====

/**
 * Webhook handler für real-time updates
 */
export class WebhookHandler {
  private listeners = new Map<string, ((data: any) => void)[]>();
  
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  // Real-time events
  onSlotBooked(callback: (slot: Slot) => void) {
    return this.subscribe('slot.booked', callback);
  }
  
  onSlotCancelled(callback: (slot: Slot) => void) {
    return this.subscribe('slot.cancelled', callback);
  }
  
  onUserUpdated(callback: (user: User) => void) {
    return this.subscribe('user.updated', callback);
  }
}

export const webhookHandler = new WebhookHandler();

// ===== MIGRATION UTILITIES =====

/**
 * Utilities für den Übergang von Test-Daten zur Datenbank
 */
export const migrationUtils = {
  /**
   * Konvertiert Test-Daten für Datenbank-Import
   */
  prepareForDatabase: {
    users: (users: User[]): CreateUserRequest[] => {
      return users.map(user => ({
        name: user.name,
        email: user.email,
        phone: user.phone,
        boatName: user.boatName,
        memberNumber: user.memberNumber,
        role: user.role,
        roles: user.roles,
        status: user.status
      }));
    },
    
    slots: (slots: Slot[]): CreateSlotRequest[] => {
      return slots.map(slot => ({
        date: slot.date,
        time: slot.time,
        duration: slot.duration,
        craneOperatorId: slot.craneOperator.id,
        notes: slot.notes
      }));
    }
  },

  /**
   * Validates data before migration
   */
  validateForMigration: {
    users: (users: User[]): { valid: User[]; invalid: User[]; errors: string[] } => {
      const valid: User[] = [];
      const invalid: User[] = [];
      const errors: string[] = [];
      
      users.forEach(user => {
        const issues: string[] = [];
        
        if (!user.name?.trim()) issues.push('Name fehlt');
        if (!user.email?.includes('@')) issues.push('Ungültige E-Mail');
        if (!user.memberNumber?.match(/^KSVL\d{3}$/)) issues.push('Ungültige Mitgliedsnummer');
        
        if (issues.length > 0) {
          invalid.push(user);
          errors.push(`${user.name || user.id}: ${issues.join(', ')}`);
        } else {
          valid.push(user);
        }
      });
      
      return { valid, invalid, errors };
    },
    
    slots: (slots: Slot[]): { valid: Slot[]; invalid: Slot[]; errors: string[] } => {
      const valid: Slot[] = [];
      const invalid: Slot[] = [];
      const errors: string[] = [];
      
      slots.forEach(slot => {
        const issues: string[] = [];
        
        if (!slot.date?.match(/^\d{4}-\d{2}-\d{2}$/)) issues.push('Ungültiges Datum');
        if (!slot.time?.match(/^\d{2}:\d{2}$/)) issues.push('Ungültige Zeit');
        if (![30, 45, 60].includes(slot.duration)) issues.push('Ungültige Dauer');
        
        if (issues.length > 0) {
          invalid.push(slot);
          errors.push(`Slot ${slot.date} ${slot.time}: ${issues.join(', ')}`);
        } else {
          valid.push(slot);
        }
      });
      
      return { valid, invalid, errors };
    }
  }
};

// ===== ERROR HANDLING =====

/**
 * Global error handler für API-Fehler
 */
export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof ApiError) {
      console.error('Unhandled API Error:', event.reason);
      // Hier könnten Toast-Nachrichten oder Error-Reporting integriert werden
    }
  });
}

/**
 * Error boundary für API-Komponenten
 */
export class ApiErrorBoundary extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ApiErrorBoundary';
  }
}

// ===== EXPORT DEFAULT CLIENT =====
export default apiClient;
export { ApiError, type ApiClient };