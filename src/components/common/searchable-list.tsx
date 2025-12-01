import { ReactNode } from "react";
import { Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchFilter, FilterConfig } from "@/hooks";

export interface SearchableListProps<T> {
  data: T[];
  filterConfig: FilterConfig<T>;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: ReactNode;
  renderItem: (item: T, index: number) => ReactNode;
  renderStats?: (stats: { total: number; filtered: number; searchMatches: number }) => ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Wiederverwendbare Liste mit integrierter Such- und Filter-Funktionalität
 * Abstrahiert das gemeinsame Pattern für durchsuchbare Listen
 */
export function SearchableList<T extends Record<string, any>>({
  data,
  filterConfig,
  title = "Liste",
  subtitle,
  searchPlaceholder = "Suchen...",
  emptyStateTitle = "Keine Einträge gefunden",
  emptyStateDescription = "Versuche einen anderen Suchbegriff oder entferne die Filter.",
  emptyStateIcon,
  renderItem,
  renderStats,
  actions,
  className = ""
}: SearchableListProps<T>) {
  
  const searchFilter = useSearchFilter(data, filterConfig);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Statistiken */}
      {renderStats && (
        <div>
          {renderStats(searchFilter.stats)}
        </div>
      )}

      {/* Such- und Filter-Bereich */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Suche & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Suchfeld */}
            <div className="flex-1">
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={searchPlaceholder}
                  value={searchFilter.searchTerm}
                  onChange={(e) => searchFilter.setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Dynamische Filter */}
            {filterConfig.filters && Object.entries(filterConfig.filters).map(([key, filter]) => (
              <div key={key} className="sm:w-48">
                <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                <Select 
                  value={searchFilter.filters[key] || "all"} 
                  onValueChange={(value) => searchFilter.setFilter(key, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map(option => {
                      const optionValue = typeof option === 'string' ? option : option.value;
                      const optionLabel = typeof option === 'string' ? option : option.label;
                      return (
                        <SelectItem key={optionValue} value={optionValue}>
                          {optionLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {/* Reset Button */}
            {(searchFilter.searchTerm || Object.values(searchFilter.filters).some(v => v && v !== 'all')) && (
              <div className="flex items-end">
                <Button variant="outline" onClick={searchFilter.clearAll}>
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </div>
          
          {/* Ergebnis-Counter */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {searchFilter.stats.filtered} von {searchFilter.stats.total} Einträgen angezeigt
            </span>
            
            {/* Active Filter Tags */}
            <div className="flex gap-1">
              {searchFilter.searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Suche: "{searchFilter.searchTerm}"
                </Badge>
              )}
              {Object.entries(searchFilter.filters).map(([key, value]) => {
                if (!value || value === 'all') return null;
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {value}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {searchFilter.filteredData.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              {emptyStateIcon && (
                <div className="mx-auto mb-4">
                  {emptyStateIcon}
                </div>
              )}
              <p className="text-muted-foreground font-medium">{emptyStateTitle}</p>
              {searchFilter.searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  {emptyStateDescription}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          searchFilter.filteredData.map((item, index) => (
            <div key={`item-${index}`}>
              {renderItem(item, index)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Utility component für Standard-Statistiken
export function StandardStats({ 
  stats, 
  labels = ["Gesamt", "Gefiltert", "Suchübereinstimmungen"] 
}: { 
  stats: { total: number; filtered: number; searchMatches: number };
  labels?: [string, string, string];
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <p className="text-xs text-muted-foreground">{labels[0]}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{stats.filtered}</div>
          <p className="text-xs text-muted-foreground">{labels[1]}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-blue-600">{stats.searchMatches}</div>
          <p className="text-xs text-muted-foreground">{labels[2]}</p>
        </CardContent>
      </Card>
    </div>
  );
}