import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRole } from "@/hooks/use-role";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { getWidgetsForRole, getSectionsForRole, type DashboardItem } from "@/lib/dashboard-config";
import { UserRole } from "@/types/user";
import { RotateCcw, GripVertical, Eye, EyeOff, LayoutGrid, Columns2, Square } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

interface SortableDashboardItemProps {
  item: DashboardItem;
  isEnabled: boolean;
  onToggle: () => void;
  column: number;
}

function SortableDashboardItem({ item, isEnabled, onToggle, column }: SortableDashboardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
        
        <Badge variant={isSection ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
          {isSection ? 'Bereich' : 'Widget'}
        </Badge>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge variant="outline" className="text-xs">
          {item.size === "small" ? "Klein" : 
           item.size === "medium" ? "Mittel" : "Groß"}
        </Badge>
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

export function DashboardSettings() {
  const { currentRole, currentUser } = useRole();
  const isAdmin = currentUser?.roles?.includes("admin") || currentRole === "admin";
  const [targetRole, setTargetRole] = useState<UserRole>(currentRole);
  
  const { 
    settings, 
    saveSettings, 
    resetToDefaults, 
    isItemEnabled,
    toggleItem
  } = useDashboardSettings(targetRole, isAdmin);

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

  const handleDragEnd = (event: DragEndEvent, targetColumn: number) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const columnItems = itemsByColumn[targetColumn] || [];
    const oldIndex = columnItems.findIndex(item => item.id === active.id);
    const newIndex = columnItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1) return;

    const reorderedItems = arrayMove(columnItems, oldIndex, newIndex);
    
    const newPositions = { ...settings.allItemsPositions };
    
    reorderedItems.forEach((item, index) => {
      newPositions[item.id] = {
        column: targetColumn,
        order: index
      };
    });

    saveSettings({ allItemsPositions: newPositions });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard-Einstellungen</h2>
        <p className="text-muted-foreground">
          Passen Sie Ihr Dashboard nach Ihren Wünschen an.
        </p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Rollenauswahl</CardTitle>
            <CardDescription>
              Konfigurieren Sie das Dashboard für verschiedene Benutzerrollen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={targetRole} onValueChange={(value) => setTargetRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mitglied">Mitglied</SelectItem>
                <SelectItem value="gastmitglied">Gastmitglied</SelectItem>
                <SelectItem value="kranfuehrer">Kranführer</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="vorstand">Vorstand</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dashboard-Layout</CardTitle>
          <CardDescription>
            Wählen Sie die Anzahl der Spalten für Ihr Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
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

      <Card>
        <CardHeader>
          <CardTitle>Dashboard-Elemente</CardTitle>
          <CardDescription>
            Ziehen Sie Bereiche und Widgets per Drag & Drop, um sie neu anzuordnen
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              
              return (
                <div key={column} className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg sticky top-0 z-10">
                    <h4 className="font-semibold text-sm">
                      {settings.columnLayout === 1 
                        ? "Dashboard-Layout" 
                        : `Spalte ${column}`}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, column)}
                  >
                    <SortableContext
                      items={items.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 min-h-[300px] p-4 border-2 border-dashed border-muted rounded-lg bg-muted/5">
                        {items.length > 0 ? (
                          items.map(item => (
                            <SortableDashboardItem
                              key={item.id}
                              item={item}
                              isEnabled={isItemEnabled(item.id)}
                              onToggle={() => toggleItem(item.id)}
                              column={column}
                            />
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                            Ziehen Sie Elemente hierher
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anzeigeoptionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
  );
}
