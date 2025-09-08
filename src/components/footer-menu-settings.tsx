import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/user";
import { useFooterMenuSettings, FooterMenuItem } from "@/hooks/use-footer-menu-settings";
import { 
  Navigation, 
  Plus, 
  X, 
  RotateCcw, 
  Save, 
  ArrowUp, 
  ArrowDown,
  Home,
  Calendar,
  UserCheck,
  User,
  TestTube,
  MessageSquare,
  Users,
  FileText,
  Settings,
  BarChart3,
  Bell,
  HelpCircle,
  Cloud,
  Anchor,
  Layers,
  Eye,
  EyeOff,
  Shield,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

// Icon mapping für die Anzeige
const ICON_MAP = {
  Home,
  Calendar,
  UserCheck,
  User,
  TestTube,
  MessageSquare,
  Users,
  FileText,
  Settings,
  BarChart3,
  Bell,
  HelpCircle,
  Cloud,
  Anchor,
  Layers,
  Palette
};

export function FooterMenuSettings() {
  const { toast } = useToast();
  const {
    settings,
    displaySettings,
    getMenuItemsForRole,
    updateRoleMenuItems,
    resetToDefaults,
    getAvailableItemsForRole,
    saveDisplaySettings,
    getDisplaySettingsForRole
  } = useFooterMenuSettings();

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem("footerMenuActiveRole");
    return (savedRole as UserRole) || "admin";
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Get current role's display settings
  const currentRoleDisplaySettings = getDisplaySettingsForRole(activeRole);
  const currentItems = getMenuItemsForRole(activeRole);
  const availableItems = getAvailableItemsForRole(activeRole);
  const unusedItems = availableItems.filter(
    item => !currentItems.some(current => current.id === item.id)
  );

  const handleAddItem = (item: FooterMenuItem) => {
    if (currentItems.length >= 6) {
      toast({
        title: "Maximum erreicht",
        description: "Es können maximal 6 Menüpunkte angezeigt werden.",
        variant: "destructive"
      });
      return;
    }

    const newItems = [...currentItems, item];
    updateRoleMenuItems(activeRole, newItems);
    setIsAddDialogOpen(false);
    
    toast({
      title: "Menüpunkt hinzugefügt",
      description: `"${item.label}" wurde zum Footer-Menü hinzugefügt.`
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = currentItems.filter(item => item.id !== itemId);
    updateRoleMenuItems(activeRole, newItems);
    
    const removedItem = currentItems.find(item => item.id === itemId);
    toast({
      title: "Menüpunkt entfernt",
      description: `"${removedItem?.label}" wurde aus dem Footer-Menü entfernt.`
    });
  };

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentItems.length) return;
    
    const newItems = [...currentItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    updateRoleMenuItems(activeRole, newItems);
  };

  const handleToggleLabels = (showLabels: boolean) => {
    saveDisplaySettings(activeRole, showLabels);
    toast({
      title: showLabels ? "Text-Labels aktiviert" : "Text-Labels deaktiviert",
      description: `Labels für ${getRoleDisplayName(activeRole)} werden ${showLabels ? "angezeigt" : "ausgeblendet"}.`
    });
  };

  const handleResetAll = () => {
    resetToDefaults();
    toast({
      title: "Einstellungen zurückgesetzt",
      description: "Alle Footer-Menü-Einstellungen wurden auf die Standardwerte zurückgesetzt."
    });
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "mitglied": return "Mitglied";
      case "kranfuehrer": return "Kranführer";
      case "admin": return "Administrator";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "mitglied": return Users;
      case "kranfuehrer": return UserCheck;
      case "admin": return Shield;
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Home className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Footer-Menü Einstellungen
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Konfigurieren Sie die Menüpunkte im unteren Navigationsbereich für jede Benutzerrolle. Maximal 6 Menüpunkte pro Rolle.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selector */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Rolle auswählen</Label>
            <div className="flex gap-2 justify-center sm:justify-start">
              {(["admin", "kranfuehrer", "mitglied"] as UserRole[]).map((role) => {
                const Icon = getRoleIcon(role);
                const items = getMenuItemsForRole(role);
                return (
                  <Card 
                    key={role}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50 w-20 sm:w-24",
                      activeRole === role 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:shadow-sm"
                    )}
                    onClick={() => {
                      setActiveRole(role);
                      localStorage.setItem("footerMenuActiveRole", role);
                    }}
                  >
                    <CardContent className="p-3 text-center">
                      <Icon className={cn(
                        "h-6 w-6 mx-auto mb-1",
                        activeRole === role ? "text-primary" : "text-muted-foreground"
                      )} />
                      <p className={cn(
                        "font-medium text-xs",
                        activeRole === role ? "text-primary" : "text-foreground"
                      )}>
                        {role === "mitglied" ? "Mitgl." : role === "kranfuehrer" ? "Kran" : "Admin"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {items.length}/6
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Anzeige-Optionen für {getRoleDisplayName(activeRole)}</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                {currentRoleDisplaySettings.showLabels ? (
                  <Eye className="h-4 w-4 text-success" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">Text-Labels anzeigen</p>
                  <p className="text-xs text-muted-foreground">
                    Zeigt Text unter den Icons im Footer an
                  </p>
                </div>
              </div>
              <Switch
                checked={currentRoleDisplaySettings.showLabels}
                onCheckedChange={handleToggleLabels}
              />
            </div>
          </div>

          {/* Current Menu Items */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3">
              <Label className="text-base font-medium">
                Menüpunkte für {getRoleDisplayName(activeRole)} ({currentItems.length}/6)
              </Label>
              <div className="flex flex-col gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentItems.length >= 6 || unusedItems.length === 0}
                      className="w-full"
                    >
                      Hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Menüpunkt hinzufügen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {unusedItems.map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => handleAddItem(item)}
                        >
                          <div className="flex items-center gap-3">
                            {renderIcon(item.icon)}
                            <div className="text-left">
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {item.id}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                      {unusedItems.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Alle verfügbaren Menüpunkte sind bereits hinzugefügt.
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Force refresh all components
                    window.dispatchEvent(new CustomEvent('footerSettingsChanged'));
                    
                    toast({
                      title: "Menü aktualisiert",
                      description: "Das Footer-Menü wurde mit den aktuellen Einstellungen neu geladen."
                    });
                  }}
                  className="w-full"
                >
                  Menü aktualisieren
                </Button>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="space-y-2">
              {currentItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-6">
                    <Navigation className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Noch keine Menüpunkte konfiguriert
                    </p>
                  </CardContent>
                </Card>
              ) : (
                currentItems.map((item, index) => (
                  <Card key={item.id} className="border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {renderIcon(item.icon)}
                          <div>
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">ID: {item.id}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-auto">
                          {/* Move buttons */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveItem(index, index - 1)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveItem(index, index + 1)}
                            disabled={index === currentItems.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                          
                          {/* Remove button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Vorschau Footer-Menü</Label>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex justify-around items-center bg-card border rounded-lg p-2 min-h-[60px]">
                    {currentItems.map((item, index) => (
                      <div key={`preview-${item.id}-${index}`} className={cn(
                        "flex flex-col items-center py-2 px-1 sm:px-3 min-w-0",
                        currentRoleDisplaySettings.showLabels ? "gap-1" : "gap-0"
                      )}>
                        {renderIcon(item.icon)}
                        {currentRoleDisplaySettings.showLabels && (
                          <span className="text-xs font-medium truncate max-w-16">{item.label}</span>
                        )}
                      </div>
                    ))}
                    {currentItems.length === 0 && (
                      <p className="text-sm text-muted-foreground">Keine Menüpunkte</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {getRoleDisplayName(activeRole)}: {currentRoleDisplaySettings.showLabels ? "Icons mit Text" : "Nur Icons"} ({currentItems.length}/6)
                  </p>
                </CardContent>
              </Card>
            </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleResetAll}
              className="flex items-center gap-2 h-12"
            >
              <RotateCcw className="w-4 h-4" />
              Alle zurücksetzen
            </Button>
            <Button 
              onClick={() => toast({ title: "Gespeichert", description: "Einstellungen werden automatisch gespeichert." })}
              className="flex items-center gap-2 h-12"
            >
              <Save className="w-4 h-4" />
              Automatisch gespeichert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary for All Roles */}
          <div className="grid grid-cols-3 gap-3">
            {(["admin", "kranfuehrer", "mitglied"] as UserRole[]).map((role) => {
              const items = getMenuItemsForRole(role);
              const Icon = getRoleIcon(role);
              const displaySettings = getDisplaySettingsForRole(role);
              return (
                <div key={role} className="text-center p-3 bg-muted/30 rounded-lg">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-medium text-xs mb-1">
                    {role === "mitglied" ? "Mitgl." : role === "kranfuehrer" ? "Kran" : "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {items.length}/6
                  </p>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {displaySettings.showLabels ? "Text" : "Icons"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}