/**
 * Sichere Storage-Utilities für localStorage/sessionStorage
 * Robuste Fehlerbehandlung und Type-Safety
 */

import { logger } from "@/lib/logger";

export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
}

class StorageError extends Error {
  constructor(message: string, public readonly operation: string, public readonly key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

interface StorageOptions {
  type?: StorageType;
  encrypt?: boolean;
  compress?: boolean;
  expiry?: number; // Milliseconds from now
}

interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

class SafeStorage {
  private isStorageAvailable(type: StorageType): boolean {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getStorage(type: StorageType): Storage {
    if (!this.isStorageAvailable(type)) {
      throw new StorageError(`${type} is not available`, 'getStorage');
    }
    return window[type];
  }

  private createStorageItem<T>(value: T, options?: StorageOptions): StorageItem<T> {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
    };

    if (options?.expiry) {
      item.expiry = Date.now() + options.expiry;
    }

    return item;
  }

  private isItemExpired<T>(item: StorageItem<T>): boolean {
    if (!item.expiry) return false;
    return Date.now() > item.expiry;
  }

  /**
   * Speichert einen Wert sicher im Storage
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const { type = StorageType.LOCAL } = options;
      const storage = this.getStorage(type);
      
      const item = this.createStorageItem(value, options);
      const serialized = JSON.stringify(item);
      
      storage.setItem(key, serialized);
      
      logger.debug('STORAGE', `Stored item: ${key}`);
      return true;
    } catch (error) {
      logger.error('STORAGE', `Failed to store item: ${key}`, error);
      return false;
    }
  }

  /**
   * Lädt einen Wert sicher aus dem Storage
   */
  getItem<T>(key: string, defaultValue?: T, type: StorageType = StorageType.LOCAL): T | null {
    try {
      const storage = this.getStorage(type);
      const serialized = storage.getItem(key);
      
      if (!serialized) {
        return defaultValue || null;
      }

      const item: StorageItem<T> = JSON.parse(serialized);
      
      // Check expiry
      if (this.isItemExpired(item)) {
        logger.debug('STORAGE', `Item expired: ${key}`);
        this.removeItem(key, type);
        return defaultValue || null;
      }

      logger.debug('STORAGE', `Retrieved item: ${key}`);
      return item.value;
    } catch (error) {
      logger.error('STORAGE', `Failed to retrieve item: ${key}`, error);
      return defaultValue || null;
    }
  }

  /**
   * Entfernt einen Wert sicher aus dem Storage
   */
  removeItem(key: string, type: StorageType = StorageType.LOCAL): boolean {
    try {
      const storage = this.getStorage(type);
      storage.removeItem(key);
      
      logger.debug('STORAGE', `Removed item: ${key}`);
      return true;
    } catch (error) {
      logger.error('STORAGE', `Failed to remove item: ${key}`, error);
      return false;
    }
  }

  /**
   * Prüft ob ein Key existiert
   */
  hasItem(key: string, type: StorageType = StorageType.LOCAL): boolean {
    try {
      const storage = this.getStorage(type);
      return storage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Löscht alle Einträge aus dem Storage
   */
  clear(type: StorageType = StorageType.LOCAL): boolean {
    try {
      const storage = this.getStorage(type);
      storage.clear();
      
      logger.debug('STORAGE', 'Cleared all items');
      return true;
    } catch (error) {
      logger.error('STORAGE', 'Failed to clear storage', error);
      return false;
    }
  }

  /**
   * Gibt alle Keys zurück
   */
  getAllKeys(type: StorageType = StorageType.LOCAL): string[] {
    try {
      const storage = this.getStorage(type);
      const keys: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) keys.push(key);
      }
      
      return keys;
    } catch (error) {
      logger.error('STORAGE', 'Failed to get all keys', error);
      return [];
    }
  }

  /**
   * Bereinigt abgelaufene Einträge
   */
  cleanupExpired(type: StorageType = StorageType.LOCAL): number {
    let cleanedCount = 0;
    
    try {
      const keys = this.getAllKeys(type);
      
      for (const key of keys) {
        try {
          const serialized = this.getStorage(type).getItem(key);
          if (!serialized) continue;
          
          const item: StorageItem<any> = JSON.parse(serialized);
          if (this.isItemExpired(item)) {
            this.removeItem(key, type);
            cleanedCount++;
          }
        } catch {
          // Silently skip invalid items
        }
      }
      
      if (cleanedCount > 0) {
        logger.debug('STORAGE', `Cleaned up ${cleanedCount} expired items`);
      }
    } catch (error) {
      logger.error('STORAGE', 'Failed to cleanup expired items', error);
    }
    
    return cleanedCount;
  }

  /**
   * Gibt Storage-Informationen zurück
   */
  getInfo(type: StorageType = StorageType.LOCAL): { available: boolean; used: number; total: number } {
    try {
      const storage = this.getStorage(type);
      const used = new Blob(Object.values(storage)).size;
      
      // Try to estimate quota (this is browser-dependent)
      let total = 5 * 1024 * 1024; // Default 5MB assumption
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          total = estimate.quota || total;
        });
      }
      
      return {
        available: true,
        used,
        total,
      };
    } catch {
      return {
        available: false,
        used: 0,
        total: 0,
      };
    }
  }
}

// Export singleton instance
export const storage = new SafeStorage();

// Convenience methods for specific data types
export const userStorage = {
  getCurrentUser: () => storage.getItem('currentUser'),
  setCurrentUser: (user: any) => storage.setItem('currentUser', user),
  getCurrentRole: () => storage.getItem('currentRole'),
  setCurrentRole: (role: string) => storage.setItem('currentRole', role),
  clearUserData: () => {
    storage.removeItem('currentUser');
    storage.removeItem('currentRole');
  },
};

export const appStorage = {
  getSettings: () => storage.getItem('appSettings', {}),
  setSettings: (settings: any) => storage.setItem('appSettings', settings),
  getPreferences: () => storage.getItem('userPreferences', {}),
  setPreferences: (prefs: any) => storage.setItem('userPreferences', prefs),
};

// Auto-cleanup expired items on load
setTimeout(() => {
  storage.cleanupExpired(StorageType.LOCAL);
  storage.cleanupExpired(StorageType.SESSION);
}, 1000);