import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMenuSettings, MenuItemConfig } from "@/hooks/use-menu-settings";
import { UserRole } from "@/types";
import { GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function MenuSettings() {
  const { settings, updateHeaderItemsOrder, updateDefaultRole, resetToDefaults, forceRefresh, getOrderedHeaderItems } = useMenuSettings();
  const { toast } = useToast();
  const [draggedItem, setDraggedItem] = useState<MenuItemConfig | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  const orderedItems = getOrderedHeaderItems();

  const handleDragStart = (e: React.DragEvent, item: MenuItemConfig) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOver(itemId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: MenuItemConfig) => {
    e.preventDefault();
    setDraggedOver(null);
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    const items = [...orderedItems];
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    const targetIndex = items.findIndex(item => item.id === targetItem.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item and insert at target position
      const [removed] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, removed);
      
      updateHeaderItemsOrder(items);
      toast({
        title: "Menüreihenfolge aktualisiert",
        description: "Die neue Reihenfolge wurde gespeichert.",
      });
    }
    
    setDraggedItem(null);
  };

  const handleRoleChange = (role: UserRole) => {
    updateDefaultRole(role);
    toast({
      title: "Standard-Rolle aktualisiert",
      description: `${role === "admin" ? "Administrator" : role === "kranfuehrer" ? "Kranführer" : "Mitglied"} ist jetzt die Standard-Rolle.`,
    });
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: "Menü-Einstellungen zurückgesetzt",
      description: "Alle Einstellungen wurden auf die Standardwerte zurückgesetzt.",
    });
  };

  const handleForceRefresh = () => {
    forceRefresh();
    toast({
      title: "Icons aktualisiert",
      description: "Die Menü-Icons wurden mit den neuesten Änderungen aktualisiert.",
    });
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "admin": return "Administrator";
      case "kranfuehrer": return "Kranführer";
      case "mitglied": return "Mitglied";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Drawer-Menü Einstellungen
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleForceRefresh}>
                Icons aktualisieren
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Zurücksetzen
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Hinweis:</strong> Diese Einstellungen betreffen das Drawer-Menü, das über das Burger-Symbol im Footer (nur für Admins) geöffnet wird.
            </p>
          </div>

          {/* Standard-Rolle Einstellung */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-2">Standard-Rolle beim Öffnen des Drawer-Menüs</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Wählen Sie die Rolle, für die die Drawer-Menüpunkte standardmäßig angezeigt werden sollen.
              </p>
            </div>
            <Select value={settings.defaultRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Standard-Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="kranfuehrer">Kranführer</SelectItem>
                <SelectItem value="mitglied">Mitglied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Menüreihenfolge */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-2">Drawer-Menü Reihenfolge</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ziehen Sie die Menüpunkte per Drag & Drop, um ihre Reihenfolge im Drawer zu ändern.
              </p>
            </div>
            
            <div className="space-y-2">
              {orderedItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg cursor-move transition-colors",
                    "hover:bg-muted/50",
                    draggedOver === item.id && "bg-primary/10 border-primary",
                    draggedItem?.id === item.id && "opacity-50"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <div className="flex gap-1">
                      {item.roles.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {getRoleDisplayName(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Vorschau */}
          <div className="space-y-3">
            <h3 className="font-medium">Live-Vorschau der Menüreihenfolge</h3>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                {orderedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2 bg-background border rounded-md"
                  >
                    <span className="text-xs text-muted-foreground">{index + 1}.</span>
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                So wird das Menü im Drawer angezeigt (von oben nach unten).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}