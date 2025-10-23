/**
 * Dashboard Settings Component
 * Interface for configuring dashboard widgets and layout
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Eye, EyeOff, Settings as SettingsIcon, Users, Shield, UserCheck, Zap, ArrowDown, MousePointer2, MoveHorizontal, Star, Sparkles, GripVertical } from "lucide-react";
import { DASHBOARD_WIDGETS, getWidgetsForRole, DashboardWidget } from "@/lib/dashboard-config";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useRole } from "@/hooks/use-role";
import { UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Sortable Widget Item Component
function SortableWidgetItem({ widget, isEnabled, onToggle }: { widget: DashboardWidget; isEnabled: boolean; onToggle: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg transition-colors",
        isEnabled ? "bg-card border-border" : "bg-muted/30 border-muted"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {isEnabled ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        <div>
          <p className="font-medium">{widget.name}</p>
          <p className="text-sm text-muted-foreground">{widget.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {widget.size === "small" ? "Klein" : widget.size === "medium" ? "Mittel" : "Groß"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Spalte {widget.position.column}
        </Badge>
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

export function DashboardSettings() {
  const {
    currentRole,
    currentUser
  } = useRole();
  const isAdmin = currentUser?.roles?.includes("admin") || currentRole === "admin";

  // Für Admins: Auswahl der zu konfigurierenden Rolle
  const [selectedConfigRole, setSelectedConfigRole] = useState<UserRole>(currentRole);

  // Verwende die ausgewählte Rolle für Admin-Konfiguration, sonst die aktuelle Rolle
  const targetRole = isAdmin ? selectedConfigRole : currentRole;
  const {
    settings,
    toggleWidget,
    toggleSection,
    resetToDefaults,
    isWidgetEnabled,
    saveSettings,
    isLoading
  } = useDashboardSettings(targetRole, isAdmin);
  const availableWidgets = getWidgetsForRole(targetRole);
  
  // Sortiere Widgets nach gespeicherter Reihenfolge
  const sortedWidgets = React.useMemo(() => {
    const orderMap = settings.widgetOrder || settings.enabledWidgets;
    return [...availableWidgets].sort((a, b) => {
      const indexA = orderMap.indexOf(a.id);
      const indexB = orderMap.indexOf(b.id);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [availableWidgets, settings.widgetOrder, settings.enabledWidgets]);

  const widgetsByCategory = sortedWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, typeof availableWidgets>);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, category: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const widgets = widgetsByCategory[category];
      const oldIndex = widgets.findIndex(w => w.id === active.id);
      const newIndex = widgets.findIndex(w => w.id === over.id);

      const reorderedCategoryWidgets = arrayMove(widgets, oldIndex, newIndex);
      
      // Kombiniere mit anderen Kategorien
      const allOtherWidgets = sortedWidgets.filter(w => w.category !== category);
      const newOrder = [...allOtherWidgets, ...reorderedCategoryWidgets]
        .sort((a, b) => {
          if (a.category === category && b.category === category) {
            return reorderedCategoryWidgets.indexOf(a) - reorderedCategoryWidgets.indexOf(b);
          }
          return 0;
        })
        .map(w => w.id);

      saveSettings({ widgetOrder: newOrder });
    }
  };
  const roleLabels: Record<UserRole, string> = {
    admin: "Administrator",
    vorstand: "Vorstand",
    kranfuehrer: "Kranführer",
    mitglied: "Mitglied",
    gastmitglied: "Gastmitglied"
  };
  const roleIcons: Record<UserRole, any> = {
    admin: Shield,
    vorstand: Shield,
    kranfuehrer: UserCheck,
    mitglied: Users,
    gastmitglied: Users
  };
  const categoryNames = {
    stats: "Statistiken",
    info: "Informationen",
    management: "Verwaltung",
    communication: "Kommunikation"
  };
  const layoutOptions = [{
    value: "default",
    label: "Standard"
  }, {
    value: "compact",
    label: "Kompakt"
  }, {
    value: "detailed",
    label: "Detailliert"
  }];
  const refreshIntervalOptions = [{
    value: 60000,
    label: "1 Minute"
  }, {
    value: 300000,
    label: "5 Minuten"
  }, {
    value: 900000,
    label: "15 Minuten"
  }, {
    value: 1800000,
    label: "30 Minuten"
  }, {
    value: 3600000,
    label: "1 Stunde"
  }];
  const animationOptions = [{
    value: "none",
    label: "Keine Animationen",
    icon: Eye,
    description: "Sofortiges Anzeigen ohne Animationen"
  }, {
    value: "fadeIn",
    label: "Sanft Einblenden",
    icon: Sparkles,
    description: "Elemente blenden langsam ein"
  }, {
    value: "dropDown",
    label: "Von Oben Fallen",
    icon: ArrowDown,
    description: "Cards fallen nacheinander von oben herab"
  }, {
    value: "scrollReveal",
    label: "Beim Scrollen",
    icon: MousePointer2,
    description: "Animationen beim Scrollen sichtbar"
  }, {
    value: "slideFromSides",
    label: "Von den Seiten",
    icon: MoveHorizontal,
    description: "Elemente gleiten von links/rechts herein"
  }, {
    value: "staggered",
    label: "Versetzt Erscheinen",
    icon: Star,
    description: "Verzögerte Animationen für besseren Effekt"
  }, {
    value: "bounce",
    label: "Federnd",
    icon: Zap,
    description: "Elemente federn beim Erscheinen"
  }];
  const enabledCount = settings.enabledWidgets.length;
  const totalCount = availableWidgets.length;
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Dashboard-Konfiguration
            {isAdmin && <Badge variant="secondary" className="ml-2">
                Administrator-Bereich
              </Badge>}
          </CardTitle>
          <CardDescription>
            {isAdmin ? "Konfigurieren Sie Dashboard-Einstellungen für alle Nutzerrollen" : "Passen Sie Ihr Dashboard an Ihre Bedürfnisse an"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Role Selector */}
          {isAdmin && <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Rolle auswählen</Label>
            </div>
            <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
              {(["admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"] as UserRole[]).map(role => {
              const Icon = roleIcons[role];
              return <Card key={role} className={cn("cursor-pointer transition-colors hover:bg-muted/50 w-20 sm:w-24", selectedConfigRole === role ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-sm")} onClick={() => setSelectedConfigRole(role)}>
                    <CardContent className="p-3 text-center">
                      <Icon className={cn("h-6 w-6 mx-auto mb-1", selectedConfigRole === role ? "text-primary" : "text-muted-foreground")} />
                      <p className={cn("font-medium text-xs", selectedConfigRole === role ? "text-primary" : "text-foreground")}>
                        {roleLabels[role]}
                      </p>
                    </CardContent>
                  </Card>;
            })}
            </div>
              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">
                  Aktuell konfiguriert: {roleLabels[selectedConfigRole]}
                </p>
                <p>
                  {selectedConfigRole === currentRole ? "Sie bearbeiten Ihre eigenen Einstellungen." : `Änderungen werden als Standard-Vorlage für alle ${roleLabels[selectedConfigRole].toLowerCase()} gespeichert. Bestehende Nutzer können diese Vorlage in ihren Einstellungen laden.`}
                </p>
              </div>
            </div>}
          
          {isAdmin && <Separator />}
          {/* Overview */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">
                {enabledCount} von {totalCount} Widgets aktiv
              </p>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? `Konfiguriere: ${roleLabels[selectedConfigRole]}` : `Ihre Rolle: ${roleLabels[currentRole]}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetToDefaults} className="flex items-center gap-2">
              Zurücksetzen
            </Button>
          </div>

          {/* Global Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Allgemeine Einstellungen</h3>
              {isAdmin && <Badge variant="outline" className="text-xs">
                  Für {roleLabels[selectedConfigRole]}
                </Badge>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select value={settings.layout} onValueChange={(value: any) => saveSettings({
                layout: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layoutOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aktualisierungsintervall</Label>
                <Select value={settings.refreshInterval.toString()} onValueChange={value => saveSettings({
                refreshInterval: parseInt(value)
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {refreshIntervalOptions.map(option => <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Animation Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Animationen</h3>
              {isAdmin && <Badge variant="outline" className="text-xs">
                  Für {roleLabels[selectedConfigRole]}
                </Badge>}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className={cn("h-4 w-4", settings.animationEnabled ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium">Animationen aktivieren</p>
                    <p className="text-sm text-muted-foreground">
                      Dashboard-Animationen beim Laden und Interagieren
                    </p>
                  </div>
                </div>
                <Switch checked={settings.animationEnabled} onCheckedChange={checked => saveSettings({
                animationEnabled: checked
              })} />
              </div>

              {settings.animationEnabled && <div className="space-y-3">
                  <Label>Animations-Typ</Label>
                  <div className="grid gap-2">
                    {animationOptions.map(option => {
                  const Icon = option.icon;
                  return <div key={option.value} className={cn("flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50", settings.animationType === option.value ? "border-primary bg-primary/5" : "border-border")} onClick={() => saveSettings({
                    animationType: option.value as any
                  })}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", settings.animationType === option.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{option.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
                          <div className={cn("w-4 h-4 rounded-full border-2 transition-colors", settings.animationType === option.value ? "border-primary bg-primary" : "border-muted-foreground")}>
                            {settings.animationType === option.value && <div className="w-full h-full rounded-full bg-card scale-50" />}
                          </div>
                        </div>;
                })}
                  </div>
                </div>}
            </div>
          </div>

          <Separator />

          {/* Core Dashboard Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Dashboard-Bereiche</h3>
              {isAdmin && <Badge variant="outline" className="text-xs">
                  Für {roleLabels[selectedConfigRole]}
                </Badge>}
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-card border-border">
                <div className="flex items-center gap-3">
                  {settings.showWelcomeSection ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="font-medium">Willkommensnachricht</p>
                    <p className="text-sm text-muted-foreground">
                      Begrüßung und nächster Termin
                    </p>
                  </div>
                </div>
                <Switch checked={settings.showWelcomeSection} onCheckedChange={() => saveSettings({
                showWelcomeSection: !settings.showWelcomeSection
              })} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-card border-border">
                <div className="flex items-center gap-3">
                  {settings.showStatsGrid ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="font-medium">Statistik-Übersicht</p>
                    <p className="text-sm text-muted-foreground">
                      Buchungen heute, diese Woche, verfügbare Slots und Auslastung
                    </p>
                  </div>
                </div>
                <Switch checked={settings.showStatsGrid} onCheckedChange={() => saveSettings({
                showStatsGrid: !settings.showStatsGrid
              })} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-card border-border">
                <div className="flex items-center gap-3">
                  {settings.showQuickActions ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="font-medium">Schnellzugriff</p>
                    <p className="text-sm text-muted-foreground">
                      Direkte Links zu häufig genutzten Funktionen
                    </p>
                  </div>
                </div>
                <Switch checked={settings.showQuickActions} onCheckedChange={() => saveSettings({
                showQuickActions: !settings.showQuickActions
              })} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-card border-border">
                <div className="flex items-center gap-3">
                  {settings.showActivityFeed ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="font-medium">Live-Activity Feed</p>
                    <p className="text-sm text-muted-foreground">
                      Echtzeitaktivitäten und Benachrichtigungen
                    </p>
                  </div>
                </div>
                <Switch checked={settings.showActivityFeed} onCheckedChange={() => saveSettings({
                showActivityFeed: !settings.showActivityFeed
              })} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Widget Categories */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Widget-Einstellungen</h3>
              {isAdmin && <Badge variant="outline" className="text-xs">
                  Für {roleLabels[selectedConfigRole]}
                </Badge>}
            </div>
            
            {Object.entries(widgetsByCategory).map(([category, widgets]) => <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-base">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {widgets.filter(w => isWidgetEnabled(w.id)).length}/{widgets.length}
                  </Badge>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, category)}
                >
                  <SortableContext
                    items={widgets.map(w => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-3">
                      {widgets.map(widget => (
                        <SortableWidgetItem
                          key={widget.id}
                          widget={widget}
                          isEnabled={isWidgetEnabled(widget.id)}
                          onToggle={() => toggleWidget(widget.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}