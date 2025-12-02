/**
 * FileManagerFilters Component
 * 
 * Handles search, category, and file type filtering for the file manager.
 * Supports both mobile (collapsible) and desktop layouts.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, ChevronDown, Grid3x3, List, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileFilters, ViewMode } from "../types/file-manager.types";

interface FileManagerFiltersProps {
  filters: FileFilters;
  searchQuery: string;
  viewMode: ViewMode;
  isAdmin: boolean;
  isMobile: boolean;
  isFilterOpen: boolean;
  multiSelectMode: boolean;
  onFiltersChange: (filters: FileFilters) => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterOpenChange: (open: boolean) => void;
  onMultiSelectToggle: () => void;
}

export function FileManagerFilters({
  filters,
  searchQuery,
  viewMode,
  isAdmin,
  isMobile,
  isFilterOpen,
  multiSelectMode,
  onFiltersChange,
  onSearchChange,
  onViewModeChange,
  onFilterOpenChange,
  onMultiSelectToggle,
}: FileManagerFiltersProps) {
  const handleResetFilters = () => {
    onSearchChange('');
    onFiltersChange({ category: undefined, file_type: undefined });
  };

  const hasActiveFilters = searchQuery || filters.file_type || (filters.category && filters.category !== 'all');

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex gap-2">
        <Button
          variant={multiSelectMode ? 'default' : 'outline'}
          size="sm"
          onClick={onMultiSelectToggle}
          className="flex items-center gap-2 bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 hover:bg-white/90 px-4 py-4 h-auto"
        >
          <CheckSquare className="h-4 w-4" />
          {multiSelectMode ? 'Fertig' : 'Auswählen'}
        </Button>
        
        <Collapsible open={isFilterOpen} onOpenChange={onFilterOpenChange} className="flex-1">
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-between bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 hover:bg-white/90 px-6 py-4 h-auto"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-semibold text-sm">Filter</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isFilterOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
              <CardContent className="pt-4 space-y-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search-mobile">Suche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-mobile"
                      placeholder="Dateien durchsuchen..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <Label>Kategorie</Label>
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => {
                      onFiltersChange({ ...filters, category: value === 'all' ? undefined : value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="general">Meine Dateien</SelectItem>
                      {isAdmin && (
                        <>
                          <SelectItem value="user_document">Mitglieder-Dokumente</SelectItem>
                          <SelectItem value="login_media">Login-Medien</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Type Filter */}
                <div>
                  <Label>Dateityp</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['all', 'image'].map((type) => (
                      <Button
                        key={type}
                        variant={filters.file_type === (type === 'all' ? undefined : type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFiltersChange({ ...filters, file_type: type === 'all' ? undefined : type })}
                      >
                        {type === 'all' ? 'Alle' : 'Bilder'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* View Mode */}
                <div>
                  <Label>Ansicht</Label>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('grid')}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      Rasteransicht
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewModeChange('list')}
                      className="flex items-center gap-2 flex-1"
                    >
                      <List className="h-4 w-4" />
                      Listenansicht
                    </Button>
                  </div>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleResetFilters} className="w-full">
                    Filter zurücksetzen
                  </Button>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  // Desktop Layout
  return (
    <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
      <CardContent className="pt-6 space-y-4">
        {/* View Mode Toggle & Multi-Select Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="flex items-center gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              Rasteransicht
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Listenansicht
            </Button>
          </div>
          
          <Button
            variant={multiSelectMode ? 'default' : 'outline'}
            size="sm"
            onClick={onMultiSelectToggle}
            className="flex items-center gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            {multiSelectMode ? 'Fertig' : 'Auswählen'}
          </Button>
        </div>

        {/* Search */}
        <div>
          <Label htmlFor="search-desktop">Suche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-desktop"
              placeholder="Dateien durchsuchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div>
          <Tabs 
            value={filters.category || 'all'} 
            onValueChange={(value) => {
              onFiltersChange({ ...filters, category: value === 'all' ? undefined : value });
            }}
            className="w-full"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="general">Meine Dateien</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="user_document">Mitglieder-Dokumente</TabsTrigger>
                  <TabsTrigger value="login_media">Login-Medien</TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* File Type Filter */}
        <div>
          <Label>Dateityp</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['all', 'image'].map((type) => (
              <Button
                key={type}
                variant={filters.file_type === (type === 'all' ? undefined : type) ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, file_type: type === 'all' ? undefined : type })}
              >
                {type === 'all' ? 'Alle' : 'Bilder'}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(filters.file_type || searchQuery) && (
          <div className="flex gap-2 flex-wrap">
            {filters.file_type && (
              <Badge variant="secondary" className="gap-1">
                Typ: {filters.file_type}
                <button onClick={() => onFiltersChange({ ...filters, file_type: undefined })}>×</button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Suche: {searchQuery}
                <button onClick={() => onSearchChange('')}>×</button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}