import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSlotDesign, SlotDesignSettings } from "@/hooks/use-slot-design";
import { StatusLabel } from "@/components/ui/status-label";
import { cn } from "@/lib/utils";
import { 
  Palette, 
  RotateCcw, 
  Eye, 
  Clock, 
  CheckCircle,
  XCircle,
  UserCheck,
  User,
  Calendar,
  Sparkles,
  Settings,
  CalendarCheck
} from "lucide-react";
import { HexColorPicker, RgbaColorPicker } from "react-colorful";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Trendy Color Palette
  const trendyColors = [
    { name: "Trendy Pink", value: "hsl(348, 77%, 67%)" },
    { name: "Trendy Navy", value: "hsl(202, 85%, 23%)" },
    { name: "Transparent Blue Gray", value: "hsla(210, 25%, 98%, 0.2)" },
    { name: "Trendy Light Green", value: "hsl(87, 66%, 84%)" },
    { name: "Trendy Green", value: "hsl(133, 28%, 68%)" },
    { name: "White", value: "hsl(0, 0%, 100%)" },
    { name: "Black", value: "hsl(0, 0%, 0%)" },
    { name: "Transparent", value: "transparent" }
  ];
  
  // Parse RGBA color
  const parseRgba = (rgbaString: string) => {
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  };
  
  // Convert RGBA object to string
  const rgbaToString = (rgba: { r: number; g: number; b: number; a: number }) => {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  };
  
  const rgbaColor = parseRgba(color);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 p-2 justify-start"
          >
            <div 
              className="w-6 h-6 rounded border mr-2 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-mono truncate">{color}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Individuelle Farbauswahl</Label>
              <RgbaColorPicker
                color={rgbaColor}
                onChange={(newColor) => onChange(rgbaToString(newColor))}
              />
            </div>
            
            <Separator />
            
            {/* Trendy Color Palette */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Trendy Farbpalette</Label>
              <div className="grid grid-cols-4 gap-2">
                {trendyColors.map((trendyColor) => (
                  <Button
                    key={trendyColor.value}
                    variant="outline"
                    size="sm"
                    className="h-8 w-full p-1"
                    onClick={() => onChange(trendyColor.value)}
                    title={trendyColor.name}
                  >
                    <div 
                      className="w-full h-full rounded border"
                      style={{ 
                        backgroundColor: trendyColor.value === "transparent" ? "transparent" : trendyColor.value,
                        backgroundImage: trendyColor.value === "transparent" 
                          ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)"
                          : undefined,
                        backgroundSize: trendyColor.value === "transparent" ? "8px 8px" : undefined,
                        backgroundPosition: trendyColor.value === "transparent" ? "0 0, 4px 4px" : undefined
                      }}
                    />
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-mono">{color}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DesignSettings() {
  const { toast } = useToast();
  const { settings, updateSlotType, resetToDefaults, resetToOriginalDefaults, isLoading } = useSlotDesign();
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefreshPreview = () => {
    // Force update CSS custom properties
    const root = document.documentElement;
    
    // Available slot colors
    root.style.setProperty('--slot-available-bg', settings.available.background);
    root.style.setProperty('--slot-available-border', settings.available.border);
    root.style.setProperty('--slot-available-text', settings.available.text);
    root.style.setProperty('--slot-available-label', settings.available.label);
    
    // Booked slot colors
    root.style.setProperty('--slot-booked-bg', settings.booked.background);
    root.style.setProperty('--slot-booked-border', settings.booked.border);
    root.style.setProperty('--slot-booked-text', settings.booked.text);
    root.style.setProperty('--slot-booked-label', settings.booked.label);
    
    // Blocked slot colors
    root.style.setProperty('--slot-blocked-bg', settings.blocked.background);
    root.style.setProperty('--slot-blocked-border', settings.blocked.border);
    root.style.setProperty('--slot-blocked-text', settings.blocked.text);
    root.style.setProperty('--slot-blocked-label', settings.blocked.label);
    
    // Force re-render
    setRefreshKey(prev => prev + 1);
    
    toast({
      title: "Vorschau aktualisiert",
      description: "Die Live-Vorschau wurde mit den aktuellen Farbeinstellungen aktualisiert."
    });
  };

  // Fixed trendy demo design
  const DEMO_TRENDY_DESIGN = {
    available: {
      background: "hsl(133, 28%, 68%)", // trendy-green
      border: "hsl(133, 28%, 68%)",
      text: "hsl(var(--primary-foreground))",
      label: "hsl(133, 28%, 58%)" // darker green label
    },
    booked: {
      background: "hsl(202, 85%, 23%)", // trendy-navy
      border: "hsl(202, 85%, 23%)",
      text: "hsl(var(--primary-foreground))",
      label: "hsla(210, 25%, 98%, 0.2)" // transparent-blue-gray label
    },
    blocked: {
      background: "hsl(348, 77%, 67%)", // trendy-pink
      border: "hsl(348, 77%, 67%)",
      text: "hsl(var(--primary-foreground))",
      label: "hsl(348, 77%, 57%)" // darker pink label
    }
  };

  const demoSettings = DEMO_TRENDY_DESIGN;

  const handleReset = () => {
    resetToOriginalDefaults();
    toast({
      title: "Design zurückgesetzt",
      description: "Alle Slot-Farben wurden auf die ursprünglichen Standardwerte zurückgesetzt."
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Lade Design-Einstellungen...</p>
        </div>
      </div>
    );
  }

  const slotTypes: Array<{
    key: keyof SlotDesignSettings;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: "available",
      label: "Verfügbare Slots",
      description: "Slots, die gebucht werden können",
      icon: CheckCircle
    },
    {
      key: "booked", 
      label: "Gebuchte Slots",
      description: "Bereits reservierte Slots",
      icon: Calendar
    },
    {
      key: "blocked",
      label: "Gesperrte Slots", 
      description: "Nicht buchbare Slots",
      icon: XCircle
    }
  ];

  const colorTypes = [
    { key: "background" as const, label: "Hintergrund" },
    { key: "border" as const, label: "Rahmen" },
    { key: "text" as const, label: "Text" },
    { key: "label" as const, label: "Label" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Slot Design-Einstellungen
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Passen Sie die Farben der Slots in der Wochenansicht und Slot-Verwaltung an. 
            Alle Farben unterstützen Transparenz (Alpha-Kanal).
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Live Demo Slots - Shows trendy style with standard colors */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Standard Slot-Vorschau (Trendy Design)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
              {slotTypes.map(({ key, label, icon: Icon }) => {
                const currentDemoSettings = demoSettings;
                
                return (
                  <Card 
                    key={key}
                    className="transition-all hover:shadow-sm cursor-pointer rounded-lg shadow-sm border-0"
                    style={{
                      backgroundColor: currentDemoSettings[key].background,
                      color: currentDemoSettings[key].text
                    }}
                  >
                    <CardContent className="p-4 relative">
                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                          <Badge 
                            className="text-xs border-0"
                            style={{
                              backgroundColor: currentDemoSettings[key].label,
                              color: "hsl(0 0% 100%)"
                            }}
                          >
                            {key === "available" ? "Verfügbar" : key === "booked" ? "Gebucht" : "Gesperrt"}
                          </Badge>
                      </div>

                      <div className="pr-16 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-primary-foreground" />
                          <span className="font-semibold text-primary-foreground">08:00</span>
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                              color: "hsl(var(--primary-foreground))",
                              borderColor: "transparent"
                            }}
                          >
                            60min
                          </Badge>
                        </div>
                        <div className="text-sm mb-2 text-primary-foreground">
                          Trendy Design
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary-foreground">
                          <UserCheck className="w-4 h-4 text-primary-foreground" />
                          <span>Kranführer: Max Mustermann</span>
                        </div>
                        {key === "booked" && (
                          <div className="flex items-center gap-2 text-sm mt-1 text-primary-foreground">
                            <User className="w-4 h-4 text-primary-foreground" />
                            <span>Gebucht von: Maria Schmidt</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom right icons for trendy style */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <Icon className="w-3 h-3 text-primary-foreground" />
                        {key === "booked" && <CalendarCheck className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Live Preview with Current Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Live-Vorschau mit aktuellen Einstellungen</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={forceRefreshPreview}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Aktualisieren
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30" key={refreshKey}>
              {slotTypes.map(({ key, label }) => (
                <div key={key} className="text-center">
                <div 
                  className="p-4 mb-2 font-medium transition-all cursor-pointer hover:scale-105 relative rounded-lg shadow-sm"
                  style={{
                    backgroundColor: settings[key].background,
                    color: settings[key].text,
                    borderColor: settings[key].border,
                  }}
                >
                    {/* Status Badge - wie im Style Center */}
                    <div className="absolute top-2 right-2">
                    <StatusLabel status={key as "available" | "booked" | "blocked"} size="sm">
                      {key === "available" ? "Verfügbar" : key === "booked" ? "Gebucht" : "Gesperrt"}
                    </StatusLabel>
                    </div>
                    <div className="pr-8">
                      {label.split(' ')[0]} {/* Erste Wort des Labels */}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Color Settings */}
          <div className="space-y-6">
            <Label className="text-base font-medium">Farbeinstellungen</Label>
            
            {slotTypes.map(({ key, label, description, icon: Icon }) => (
              <Card key={key} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{label}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {colorTypes.map(({ key: colorKey, label: colorLabel }) => (
                      <ColorPicker
                        key={colorKey}
                        color={settings[key][colorKey]}
                        onChange={(color) => updateSlotType(key, colorKey, color)}
                        label={colorLabel}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Auf Standard zurücksetzen
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Änderungen werden automatisch gespeichert
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}