import { useState, useMemo, useCallback } from "react";

export interface FilterConfig<T> {
  searchFields: (keyof T)[]; // Felder die durchsucht werden sollen
  filters?: {
    [key: string]: {
      field: keyof T;
      type: 'select' | 'date' | 'boolean';
      options?: string[] | { value: string; label: string }[];
    };
  };
}

export interface SearchFilterState {
  searchTerm: string;
  filters: Record<string, any>;
}

export interface SearchFilterActions {
  setSearchTerm: (term: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  clearAll: () => void;
}

export interface SearchFilterResults<T> {
  filteredData: T[];
  searchTerm: string;
  filters: Record<string, any>;
  stats: {
    total: number;
    filtered: number;
    searchMatches: number;
  };
}

/**
 * Wiederverwendbarer Hook für Such- und Filter-Funktionalität
 * Abstrahiert die gemeinsame Logik für Textsuche und Filter
 */
export function useSearchFilter<T extends Record<string, any>>(
  data: T[],
  config: FilterConfig<T>
): SearchFilterResults<T> & SearchFilterActions {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { searchFields, filters: filterConfig } = config;

  // Textsuche über konfigurierte Felder
  const searchFilteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, searchFields]);

  // Filter anwenden
  const filteredData = useMemo(() => {
    return searchFilteredData.filter(item => {
      return Object.entries(filters).every(([filterKey, filterValue]) => {
        if (!filterValue || filterValue === 'all') return true;

        const filterDef = filterConfig?.[filterKey];
        if (!filterDef) return true;

        const itemValue = item[filterDef.field];

        switch (filterDef.type) {
          case 'select':
            return itemValue === filterValue;
          case 'boolean':
            return Boolean(itemValue) === Boolean(filterValue);
          case 'date':
            // Vereinfachte Datumsfilterung - kann erweitert werden
            return new Date(itemValue).toDateString() === new Date(filterValue).toDateString();
          default:
            return String(itemValue) === String(filterValue);
        }
      });
    });
  }, [searchFilteredData, filters, filterConfig]);

  // Filter-Aktionen
  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const clearAll = useCallback(() => {
    setSearchTerm("");
    setFilters({});
  }, []);

  // Statistiken
  const stats = useMemo(() => ({
    total: data.length,
    filtered: filteredData.length,
    searchMatches: searchFilteredData.length
  }), [data.length, filteredData.length, searchFilteredData.length]);

  return {
    filteredData,
    searchTerm,
    filters,
    stats,
    setSearchTerm,
    setFilter,
    clearFilters,
    clearSearch,
    clearAll
  };
}

// Utility Hook für häufige Filter-Pattern
export function useCommonFilters() {
  const userRoleFilter = {
    type: 'select' as const,
    options: [
      { value: 'all', label: 'Alle Rollen' },
      { value: 'admin', label: 'Administrator' },
      { value: 'kranfuehrer', label: 'Kranführer' },
      { value: 'mitglied', label: 'Mitglied' }
    ]
  };

  const statusFilter = {
    type: 'select' as const,
    options: [
      { value: 'all', label: 'Alle Status' },
      { value: 'active', label: 'Aktiv' },
      { value: 'inactive', label: 'Inaktiv' }
    ]
  };

  const slotStatusFilter = {
    type: 'select' as const,
    options: [
      { value: 'all', label: 'Alle Slots' },
      { value: 'available', label: 'Verfügbar' },
      { value: 'booked', label: 'Gebucht' },
      { value: 'blocked', label: 'Gesperrt' }
    ]
  };

  const dateRangeFilter = {
    type: 'date' as const,
    options: [
      { value: 'all', label: 'Alle Daten' },
      { value: 'today', label: 'Heute' },
      { value: 'week', label: 'Diese Woche' },
      { value: 'month', label: 'Dieser Monat' }
    ]
  };

  return {
    userRoleFilter,
    statusFilter,
    slotStatusFilter,
    dateRangeFilter
  };
}

// Hook für erweiterte Suchfunktionen
export function useAdvancedSearch<T extends Record<string, any>>(
  data: T[],
  config: FilterConfig<T> & {
    fuzzySearch?: boolean;
    minSearchLength?: number;
    debounceMs?: number;
  }
) {
  const { minSearchLength = 2, fuzzySearch = false } = config;
  
  const baseResult = useSearchFilter(data, config);

  // Erweiterte Suche mit Fuzzy-Matching (vereinfacht)
  const enhancedFilteredData = useMemo(() => {
    if (!fuzzySearch || baseResult.searchTerm.length < minSearchLength) {
      return baseResult.filteredData;
    }

    // Vereinfachtes Fuzzy-Matching - kann mit einer Library wie Fuse.js erweitert werden
    const searchWords = baseResult.searchTerm.toLowerCase().split(' ');
    
    return baseResult.filteredData.filter(item => {
      return searchWords.every(word => 
        config.searchFields.some(field => 
          String(item[field]).toLowerCase().includes(word)
        )
      );
    });
  }, [baseResult.filteredData, baseResult.searchTerm, fuzzySearch, minSearchLength, config.searchFields]);

  return {
    ...baseResult,
    filteredData: enhancedFilteredData,
    isSearching: baseResult.searchTerm.length >= minSearchLength
  };
}