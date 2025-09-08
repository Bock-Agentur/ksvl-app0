import { ReactNode, useState } from "react";
import { ChevronUp, ChevronDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  className?: string;
}

export interface DataTableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  show?: (item: T) => boolean;
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: DataTableAction<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: {
    label: string;
    icon?: ReactNode;
    onClick: (selectedIds: string[]) => void;
    variant?: "default" | "destructive";
  }[];
  emptyState?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * Wiederverwendbare Datentabelle mit Sortierung, Selektion und Aktionen
 * Unterstützt Bulk-Aktionen und anpassbare Spalten
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  selectable = false,
  onSelectionChange,
  bulkActions = [],
  emptyState,
  title,
  subtitle,
  className = ""
}: DataTableProps<T>) {
  
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sortierung
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(current => 
        current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc'
      );
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sortierte Daten
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    const aValue = a[sortColumn as keyof T];
    const bValue = b[sortColumn as keyof T];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Selektion
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(data.map(item => item.id));
      setSelectedIds(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < data.length;

  // Bulk Actions
  const selectedCount = selectedIds.size;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div>
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && selectedCount > 0 && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedCount} Element(e) ausgewählt
          </span>
          {bulkActions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              onClick={() => action.onClick(Array.from(selectedIds))}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedIds(new Set());
              onSelectionChange?.([]);
            }}
          >
            Auswahl aufheben
          </Button>
        </div>
      )}

      {/* Tabelle */}
      <Card>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <div className="p-8 text-center">
              {emptyState || (
                <p className="text-muted-foreground">Keine Daten vorhanden.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                    </TableHead>
                  )}
                  
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={`${column.width || ''} ${column.className || ''} ${
                        column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(String(column.key))}
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {column.sortable && (
                          <div className="flex flex-col ml-1">
                            {sortColumn === column.key && sortDirection ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )
                            ) : (
                              <>
                                <ChevronUp className="h-3 w-3 opacity-30" />
                                <ChevronDown className="h-3 w-3 opacity-30 -mt-1" />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  
                  {actions.length > 0 && (
                    <TableHead className="w-16">Aktionen</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow 
                    key={item.id}
                    className={`${
                      selectedIds.has(item.id) ? 'bg-muted/50' : ''
                    } transition-colors hover:bg-muted/30`}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) => 
                            handleSelectItem(item.id, checked as boolean)
                          }
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => (
                      <TableCell 
                        key={String(column.key)} 
                        className={column.className || ''}
                      >
                        {column.render ? (
                          column.render(item[column.key as keyof T], item, index)
                        ) : (
                          String(item[column.key as keyof T] || '')
                        )}
                      </TableCell>
                    ))}
                    
                    {actions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions
                              .filter(action => !action.show || action.show(item))
                              .map((action, actionIndex) => (
                                <DropdownMenuItem
                                  key={actionIndex}
                                  onClick={() => action.onClick(item)}
                                  className={action.variant === "destructive" ? "text-destructive" : ""}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Standard Column Renderers
export const columnRenderers = {
  badge: (value: string, variant: "default" | "secondary" | "outline" = "default") => (
    <Badge variant={variant}>{value}</Badge>
  ),
  
  status: (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Aktiv" : "Inaktiv"}
    </Badge>
  ),
  
  date: (date: string | Date, format = "dd.MM.yyyy") => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('de-DE');
  },
  
  truncate: (text: string, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },
  
  currency: (amount: number, currency = '€') => {
    if (amount === null || amount === undefined) return '';
    return `${amount.toFixed(2)} ${currency}`;
  }
};