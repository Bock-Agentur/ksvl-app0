import { useState } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FilterOption {
  value: string;
  label: string;
}

interface UserFiltersSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string | null;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string | null;
  onStatusFilterChange: (value: string) => void;
  roleOptions: FilterOption[];
  statusOptions: FilterOption[];
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  sortBy: 'name' | 'email' | 'memberNumber' | 'role';
  onSortByChange: (value: 'name' | 'email' | 'memberNumber' | 'role') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: () => void;
}

export function UserFiltersSection({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  roleOptions,
  statusOptions,
  onClearFilters,
  filteredCount,
  totalCount,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}: UserFiltersSectionProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const hasActiveFilters = searchTerm || (roleFilter && roleFilter !== 'all') || (statusFilter && statusFilter !== 'all');

  return (
    <>
      {/* Mobile Collapsible */}
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="sm:hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between bg-white rounded-[2rem] card-shadow-soft border-0 hover:bg-white/90 px-6 py-4 h-auto"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-semibold text-sm">Suche & Filter</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-mobile">Suche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-mobile"
                      placeholder="Nach Name, E-Mail, Telefon..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Rolle</Label>
                  <Select 
                    value={roleFilter || "all"} 
                    onValueChange={onRoleFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select 
                    value={statusFilter || "all"} 
                    onValueChange={onStatusFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" onClick={onClearFilters} className="w-full">
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredCount} von {totalCount} Benutzern</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort-mobile" className="text-xs">Sortieren:</Label>
                  <Select value={sortBy} onValueChange={(value: any) => onSortByChange(value)}>
                    <SelectTrigger id="sort-mobile" className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">E-Mail</SelectItem>
                      <SelectItem value="memberNumber">Mitgliedsnr.</SelectItem>
                      <SelectItem value="role">Rolle</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={onSortOrderChange}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop Card */}
      <Card className="hidden sm:block bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Suche & Filter
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-desktop" className="text-sm font-normal">Sortieren:</Label>
              <Select value={sortBy} onValueChange={(value: any) => onSortByChange(value)}>
                <SelectTrigger id="sort-desktop" className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="memberNumber">Mitgliedsnummer</SelectItem>
                  <SelectItem value="role">Rolle</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onSortOrderChange}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nach Name, E-Mail, Telefon oder Mitgliedsnummer suchen..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label>Rolle</Label>
              <Select 
                value={roleFilter || "all"} 
                onValueChange={onRoleFilterChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-48">
              <Label>Status</Label>
              <Select 
                value={statusFilter || "all"} 
                onValueChange={onStatusFilterChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="outline" onClick={onClearFilters}>
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredCount} von {totalCount} Benutzern angezeigt
          </div>
        </CardContent>
      </Card>
    </>
  );
}
