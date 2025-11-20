import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/hooks/use-role";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { getWidgetsForRole, getSectionsForRole, type DashboardItem } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";
import { SettingsSectionLoader } from "@/components/common/settings-section-loader";
import { RotateCcw, GripVertical, Eye, EyeOff, LayoutGrid, Columns2, Square, Smartphone, Settings as SettingsIcon, Type } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, DragOverlay, pointerWithin, useDroppable, rectIntersection } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleCardGrid } from "@/components/common/role-card-grid";

interface SortableDashboardItemProps {
  item: DashboardItem;
  isEnabled: boolean;
  onToggle: () => void;
  column: number;
}

function SortableDashboardItem({ item, isEnabled, onToggle, column }: SortableDashboardItemProps) {
  const isMobile = useIsMobile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { column } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSection = 'category' in item && ['core', 'stats', 'actions', 'feed'].includes(item.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-card border rounded-lg transition-all",
        isDragging && "opacity-50 ring-2 ring-primary",
        !isEnabled && "opacity-60"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isEnabled ? (
          <Eye className="h-4 w-4 text-primary flex-shrink-0" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        
        {!isMobile && (
          <Badge variant={isSection ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
            {isSection ? 'Bereich' : 'Widget'}
          </Badge>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.name}</p>
          {!isMobile && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0">
        {!isMobile && (
          <Badge variant="outline" className="text-xs">
            {item.size === "small" ? "Klein" : 
             item.size === "medium" ? "Mittel" : "Groß"}
          </Badge>
        )}
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  column: number;
  items: DashboardItem[];
  isEnabled: (id: string) => boolean;
  onToggle: (id: string) => void;
  columnLayout: number;
  isOver: boolean;
}

function DroppableColumn({ column, items, isEnabled, onToggle, columnLayout, isOver }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `column-${column}`,
    data: { column }
  });

  return (
    <div ref={setNodeRef} className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg sticky top-0 z-10">
        <h4 className="font-semibold text-sm">
          {columnLayout === 1 
            ? "Dashboard-Layout" 
            : `Spalte ${column}`}
        </h4>
        <Badge variant="secondary" className="text-xs">
          {items.length}
        </Badge>
      </div>
      
      <div 
        className={cn(
          "space-y-2 min-h-[300px] p-4 border-2 border-dashed rounded-lg transition-all",
          isOver 
            ? "border-primary bg-primary/10 ring-2 ring-primary" 
            : "border-muted bg-muted/5"
        )}
      >
        {items.length > 0 ? (
          items.map(item => (
            <SortableDashboardItem
              key={item.id}
              item={item}
              isEnabled={isEnabled(item.id)}
              onToggle={() => onToggle(item.id)}
              column={column}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Ziehen Sie Elemente hierher
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardSettings() {
  const { currentRole, currentUser, setRole } = useRole();
  const [targetRole, setTargetRole] = useState<UserRole>(currentRole);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");
  const isMobile = useIsMobile();
  
  // Admin bearbeitet Templates für die gewählte Rolle (Route ist bereits geschützt)
  const { 
    settings,
    isLoading,
    saveSettings, 
    resetToDefaults, 
    isItemEnabled,
    toggleItem
  } = useDashboardSettings(targetRole);

  const availableRoles: UserRole[] = ["admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allDashboardItems = useMemo(() => {
    const sections = getSectionsForRole(targetRole).map(s => ({ 
      ...s, 
      itemType: 'section' as const 
    }));
    const widgets = getWidgetsForRole(targetRole).map(w => ({ 
      ...w, 
      itemType: 'widget' as const 
    }));
    
    return { sections, widgets, all: [...sections, ...widgets] };
  }, [targetRole]);

  const itemsByColumn = useMemo(() => {
    const columns: Record<number, DashboardItem[]> = {};
    for (let i = 1; i <= settings.columnLayout; i++) {
      columns[i] = [];
    }
    
    allDashboardItems.all.forEach(item => {
      const customPos = settings.allItemsPositions?.[item.id];
      const column = customPos?.column || item.position.column;
      const adjustedColumn = Math.min(column, settings.columnLayout);
      
      if (!columns[adjustedColumn]) {
        columns[adjustedColumn] = [];
      }
      
      columns[adjustedColumn].push(item);
    });
    
    // Sort within columns
    Object.keys(columns).forEach(col => {
      const colNum = parseInt(col);
      columns[colNum].sort((a, b) => {
        const posA = settings.allItemsPositions?.[a.id] || a.position;
        const posB = settings.allItemsPositions?.[b.id] || b.position;
        return posA.order - posB.order;
      });
    });
    
    return columns;
  }, [allDashboardItems, settings.allItemsPositions, settings.columnLayout]);

  const mobileItems = useMemo(() => {
    const items = [...allDashboardItems.all];
    
    if (settings.mobileItemsOrder && settings.mobileItemsOrder.length > 0) {
      // Sort by custom mobile order
      items.sort((a, b) => {
        const indexA = settings.mobileItemsOrder!.indexOf(a.id);
        const indexB = settings.mobileItemsOrder!.indexOf(b.id);
        
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
    } else {
      // Default: sort by position
      items.sort((a, b) => {
        const posA = settings.allItemsPositions?.[a.id] || a.position;
        const posB = settings.allItemsPositions?.[b.id] || b.position;
        
        if (posA.column !== posB.column) {
          return posA.column - posB.column;
        }
        return posA.order - posB.order;
      });
    }
    
    return items;
  }, [allDashboardItems, settings.mobileItemsOrder, settings.allItemsPositions]);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string;
    setOverId(overId || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    if (!over) return;

    // Determine source column
    let sourceColumn = 0;
    let sourceItem: DashboardItem | null = null;
    
    Object.entries(itemsByColumn).forEach(([col, items]) => {
      const found = items.find(item => item.id === active.id);
      if (found) {
        sourceColumn = parseInt(col);
        sourceItem = found;
      }
    });

    if (!sourceItem) return;

    // Determine target column
    let targetColumn = sourceColumn;
    let targetItem: DashboardItem | null = null;
    
    // Check if dropped on a column container
    if (typeof over.id === 'string' && over.id.startsWith('column-')) {
      targetColumn = parseInt(over.id.replace('column-', ''));
    } else {
      // Dropped on an item
      Object.entries(itemsByColumn).forEach(([col, items]) => {
        const found = items.find(item => item.id === over.id);
        if (found) {
          targetColumn = parseInt(col);
          targetItem = found;
        }
      });
    }

    const newPositions = { ...settings.allItemsPositions };

    if (sourceColumn === targetColumn) {
      // Same column - reorder
      if (!targetItem || active.id === over.id) return;
      
      const columnItems = itemsByColumn[sourceColumn] || [];
      const oldIndex = columnItems.findIndex(item => item.id === active.id);
      const newIndex = columnItems.findIndex(item => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedItems = arrayMove(columnItems, oldIndex, newIndex);
      
      reorderedItems.forEach((item, index) => {
        newPositions[item.id] = {
          column: sourceColumn,
          order: index
        };
      });
    } else {
      // Different columns - move item
      const sourceItems = [...(itemsByColumn[sourceColumn] || [])].filter(item => item.id !== active.id);
      const targetItems = [...(itemsByColumn[targetColumn] || [])];
      
      if (targetItem) {
        // Insert at specific position
        const targetIndex = targetItems.findIndex(item => item.id === over.id);
        targetItems.splice(targetIndex, 0, sourceItem);
      } else {
        // Add to end of column
        targetItems.push(sourceItem);
      }
      
      // Update positions for source column
      sourceItems.forEach((item, index) => {
        newPositions[item.id] = {
          column: sourceColumn,
          order: index
        };
      });
      
      // Update positions for target column
      targetItems.forEach((item, index) => {
        newPositions[item.id] = {
          column: targetColumn,
          order: index
        };
      });
    }

    saveSettings({ allItemsPositions: newPositions });
  };

  const handleMobileDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    if (!over || active.id === over.id) return;

    const oldIndex = mobileItems.findIndex(item => item.id === active.id);
    const newIndex = mobileItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(mobileItems, oldIndex, newIndex);
    const newOrder = reorderedItems.map(item => item.id);

    saveSettings({ mobileItemsOrder: newOrder });
  };

  const activeItem = activeId ? allDashboardItems.all.find(item => item.id === activeId) : null;
  
  const getOverColumn = (): number | null => {
    if (!overId) return null;
    if (typeof overId === 'string' && overId.startsWith('column-')) {
      return parseInt(overId.replace('column-', ''));
    }
    // Find column of the item being hovered
    for (const [col, items] of Object.entries(itemsByColumn)) {
      if (items.some(item => item.id === overId)) {
        return parseInt(col);
      }
    }
    return null;
  };

  return (
    <SettingsSectionLoader isLoading={isLoading} title="Dashboard-Einstellungen">
      <div className="space-y-6">
        <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
          <CardHeader className={isMobile ? "px-4 py-3" : ""}>
            <CardTitle className={cn(
              "flex items-center gap-2 font-bold",
              isMobile ? "text-lg" : "text-2xl"
            )}>
              <SettingsIcon className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
              Dashboard-Einstellungen
            </CardTitle>
            {!isMobile && (
              <CardDescription>
                Passen Sie Ihr Dashboard nach Ihren Wünschen an.
              </CardDescription>
            )}
          </CardHeader>
        </Card>

      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader className={isMobile ? "px-4 py-3" : ""}>
          <CardTitle className={isMobile ? "text-base" : ""}>Rollenauswahl</CardTitle>
          {!isMobile && (
            <CardDescription>
              Konfigurieren Sie das Dashboard für verschiedene Benutzerrollen
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={cn(
          "space-y-4",
          isMobile && "px-4 pb-4"
        )}>
          <div className="space-y-3">
            <Label className={cn(
              "font-medium",
              isMobile ? "text-sm" : "text-base"
            )}>Rolle auswählen</Label>
            <RoleCardGrid 
              activeRole={targetRole}
              onRoleSelect={setTargetRole}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader className={isMobile ? "px-4 py-3" : ""}>
          <CardTitle>Dashboard-Layout</CardTitle>
          <CardDescription>
            Wählen Sie die Anzahl der Spalten für Ihr Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "px-4 pb-4" : ""}>
          <div className="grid grid-cols-3 gap-4">
            {([1, 2, 3] as const).map(cols => (
              <Card 
                key={cols}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  settings.columnLayout === cols && "ring-2 ring-primary shadow-lg"
                )}
                onClick={() => saveSettings({ columnLayout: cols })}
              >
                <CardContent className="p-6 text-center space-y-3">
                  {cols === 1 && <Square className="h-8 w-8 mx-auto text-primary" />}
                  {cols === 2 && <Columns2 className="h-8 w-8 mx-auto text-primary" />}
                  {cols === 3 && <LayoutGrid className="h-8 w-8 mx-auto text-primary" />}
                  <div>
                    <p className="font-medium">{cols} Spalte{cols > 1 ? 'n' : ''}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cols === 1 && "Fokussiert"}
                      {cols === 2 && "Ausgewogen"}
                      {cols === 3 && "Übersichtlich"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader className={isMobile ? "px-4 py-3" : ""}>
          <CardTitle>Dashboard-Elemente</CardTitle>
          <CardDescription>
            Konfigurieren Sie die Anordnung für Desktop und Mobile/Tablet getrennt
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "px-4 pb-4" : ""}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "desktop" | "mobile")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="desktop" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile & Tablet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="desktop">
              <p className="text-sm text-muted-foreground mb-4">
                Ziehen Sie Bereiche und Widgets per Drag & Drop zwischen Spalten, um sie neu anzuordnen
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={allDashboardItems.all.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div 
                    className={cn(
                      "grid gap-6",
                      settings.columnLayout === 1 && "grid-cols-1",
                      settings.columnLayout === 2 && "grid-cols-1 lg:grid-cols-2",
                      settings.columnLayout === 3 && "grid-cols-1 lg:grid-cols-3"
                    )}
                  >
                    {Array.from({ length: settings.columnLayout }).map((_, colIndex) => {
                      const column = colIndex + 1;
                      const items = itemsByColumn[column] || [];
                      const overColumn = getOverColumn();
                      const isOver = overColumn === column;
                      
                      return (
                        <DroppableColumn
                          key={column}
                          column={column}
                          items={items}
                          isEnabled={isItemEnabled}
                          onToggle={toggleItem}
                          columnLayout={settings.columnLayout}
                          isOver={isOver}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeItem ? (
                    <div className="p-4 bg-card border-2 border-primary rounded-lg shadow-lg opacity-80">
                      <div className="flex items-center gap-3">
                        <Badge variant={activeItem.itemType === 'section' ? 'default' : 'secondary'} className="text-xs">
                          {activeItem.itemType === 'section' ? 'Bereich' : 'Widget'}
                        </Badge>
                        <p className="font-medium text-sm">{activeItem.name}</p>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </TabsContent>

            <TabsContent value="mobile">
              <p className="text-sm text-muted-foreground mb-4">
                Auf Mobile und Tablet wird immer nur eine Spalte angezeigt. Ziehen Sie die Elemente in die gewünschte Reihenfolge.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleMobileDragEnd}
              >
                <SortableContext
                  items={mobileItems.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 p-4 border-2 border-dashed border-muted rounded-lg bg-muted/5">
                    {mobileItems.map(item => (
                      <SortableDashboardItem
                        key={item.id}
                        item={item}
                        isEnabled={isItemEnabled(item.id)}
                        onToggle={() => toggleItem(item.id)}
                        column={1}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeItem ? (
                    <div className="p-4 bg-card border-2 border-primary rounded-lg shadow-lg opacity-80">
                      <div className="flex items-center gap-3">
                        <Badge variant={activeItem.itemType === 'section' ? 'default' : 'secondary'} className="text-xs">
                          {activeItem.itemType === 'section' ? 'Bereich' : 'Widget'}
                        </Badge>
                        <p className="font-medium text-sm">{activeItem.name}</p>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader className={isMobile ? "px-4 py-3" : ""}>
          <CardTitle>Anzeigeoptionen</CardTitle>
          <CardDescription>
            Passen Sie Animationen und Darstellung an
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(
          "space-y-4",
          isMobile && "px-4 pb-4"
        )}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animationen aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Aktiviert Scroll-Animationen für Dashboard-Elemente
              </p>
            </div>
            <Switch
              checked={settings.animationEnabled}
              onCheckedChange={(checked) => saveSettings({ animationEnabled: checked })}
            />
          </div>

          {settings.animationEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Animationstyp</Label>
                <Select
                  value={settings.animationType}
                  onValueChange={(value: any) => saveSettings({ animationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fadeIn">Einblenden</SelectItem>
                    <SelectItem value="dropDown">Von oben</SelectItem>
                    <SelectItem value="scrollReveal">Scroll-Enthüllung</SelectItem>
                    <SelectItem value="slideFromSides">Von den Seiten</SelectItem>
                    <SelectItem value="staggered">Versetzt</SelectItem>
                    <SelectItem value="bounce">Springen</SelectItem>
                    <SelectItem value="none">Keine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Layout-Stil</Label>
            <Select
              value={settings.layout}
              onValueChange={(value: any) => saveSettings({ layout: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Standard</SelectItem>
                <SelectItem value="compact">Kompakt</SelectItem>
                <SelectItem value="detailed">Detailliert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Aktualisierungsintervall</Label>
            <Select
              value={settings.refreshInterval.toString()}
              onValueChange={(value) => saveSettings({ refreshInterval: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30000">30 Sekunden</SelectItem>
                <SelectItem value="60000">1 Minute</SelectItem>
                <SelectItem value="300000">5 Minuten</SelectItem>
                <SelectItem value="600000">10 Minuten</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Auf Standard zurücksetzen
        </Button>
      </div>
      </div>
    </SettingsSectionLoader>
  );
}
