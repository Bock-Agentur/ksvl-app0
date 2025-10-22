import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeSettings, ThemeSetting } from "@/hooks/use-theme-settings";
import { Palette, Save, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  description?: string;
}

function ColorPicker({ color, onChange, label, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Trendy Color Palette - same as in DesignSettings
  const trendyColors = [
    { name: "Ocean Blue", value: "202 85% 23%" },
    { name: "Coral Pink", value: "348 77% 67%" },
    { name: "Sea Green", value: "133 28% 68%" },
    { name: "Bright Cyan", value: "194 99% 47%" },
    { name: "Light Sea Foam", value: "87 66% 84%" },
    { name: "Deep Navy", value: "210 60% 25%" },
    { name: "Light Gray", value: "210 40% 88%" },
    { name: "White", value: "0 0% 100%" },
  ];
  
  // Parse HSL to get RGB for color picker
  const hslToRgb = (hslString: string) => {
    const match = hslString.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: 1
    };
  };
  
  // Convert RGB to HSL string
  const rgbToHsl = (rgba: { r: number; g: number; b: number; a: number }) => {
    const r = rgba.r / 255;
    const g = rgba.g / 255;
    const b = rgba.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  
  const rgbaColor = hslToRgb(color);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 p-2 justify-start"
          >
            <div 
              className="w-6 h-6 rounded border mr-2 flex-shrink-0"
              style={{ backgroundColor: `hsl(${color})` }}
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
                onChange={(newColor) => onChange(rgbToHsl(newColor))}
              />
            </div>
            
            <Separator />
            
            {/* Trendy Color Palette */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Farbpalette</Label>
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
                        backgroundColor: `hsl(${trendyColor.value})`
                      }}
                    />
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: `hsl(${color})` }}
              />
              <span className="text-xs font-mono">{color}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ThemeManager() {
  const { settings, isLoading, updateSetting, applyTheme } = useThemeSettings();
  const [editedColors, setEditedColors] = useState<Record<string, string>>({});

  // Apply theme on load and when settings change
  useEffect(() => {
    if (settings) {
      applyTheme();
    }
  }, [settings]);

  const handleColorChange = (id: string, value: string) => {
    setEditedColors(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = (id: string) => {
    const newValue = editedColors[id];
    if (newValue) {
      updateSetting({ id, hsl_value: newValue });
      setEditedColors(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const parseHSL = (hslString: string): { h: number; s: number; l: number } | null => {
    // Parse "202 85% 23%" format
    const match = hslString.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
    if (match) {
      return {
        h: parseInt(match[1]),
        s: parseInt(match[2]),
        l: parseInt(match[3]),
      };
    }
    return null;
  };

  const renderColorCard = (setting: ThemeSetting) => {
    const currentValue = editedColors[setting.id] || setting.hsl_value;
    const hasChanges = editedColors[setting.id] !== undefined;

    // Skip gradients in this view - they're handled separately
    if (setting.category === 'gradient') {
      return (
        <Card key={setting.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-semibold">{setting.name}</CardTitle>
                {setting.description && (
                  <CardDescription className="text-xs mt-1">{setting.description}</CardDescription>
                )}
              </div>
              {setting.is_default && (
                <Badge variant="outline" className="text-xs">Standard</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="w-full h-16 rounded-lg border-2 border-border shadow-sm"
              style={{ background: currentValue }}
            />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">CSS Gradient</Label>
              <Input
                value={currentValue}
                onChange={(e) => handleColorChange(setting.id, e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(setting.id)}
                className="w-full"
              >
                <Save className="w-3 h-3 mr-2" />
                Speichern
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={setting.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">{setting.name}</CardTitle>
              {setting.description && (
                <CardDescription className="text-xs mt-1">{setting.description}</CardDescription>
              )}
            </div>
            {setting.is_default && (
              <Badge variant="outline" className="text-xs">Standard</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ColorPicker
            color={currentValue}
            onChange={(newValue) => handleColorChange(setting.id, newValue)}
            label="Farbe"
          />
          {hasChanges && (
            <Button
              size="sm"
              onClick={() => handleSave(setting.id)}
              className="w-full"
            >
              <Save className="w-3 h-3 mr-2" />
              Speichern
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Lade Design-Einstellungen...</p>
        </CardContent>
      </Card>
    );
  }

  const baseColors = settings?.filter(s => s.category === 'base') || [];
  const badgeColors = settings?.filter(s => s.category === 'badge') || [];
  const slotColors = settings?.filter(s => s.category === 'slot-status') || [];
  const slotAltColors = settings?.filter(s => s.category === 'slot-status-alt') || [];
  const themeColors = settings?.filter(s => s.category === 'theme') || [];
  const gradients = settings?.filter(s => s.category === 'gradient') || [];

  return (
    <div className="space-y-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6" />
            <div>
              <CardTitle className="text-xl">Theme-Verwaltung</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Passen Sie die Farben und das Design Ihrer Anwendung an
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="base">Basis-Farben</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="slots">Slot-Status</TabsTrigger>
          <TabsTrigger value="slots-alt">Slot-Alt</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="gradients">Gradienten</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {baseColors.map(renderColorCard)}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4 mt-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Passen Sie die Farben aller Badge-Varianten an. Badges werden in der gesamten Anwendung verwendet.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badgeColors.map(renderColorCard)}
          </div>
          
          {/* Badge Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vorschau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Standard</Badge>
                <Badge variant="secondary">Sekundär</Badge>
                <Badge variant="destructive">Destruktiv</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Erfolg</Badge>
                <Badge variant="warning">Warnung</Badge>
                <Badge variant="available">Verfügbar</Badge>
                <Badge variant="booked">Gebucht</Badge>
                <Badge variant="blocked">Blockiert</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots" className="space-y-4 mt-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Diese Farben werden für Slot-Status-Badges verwendet (verfügbar, gebucht, blockiert).
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slotColors.map(renderColorCard)}
          </div>
        </TabsContent>

        <TabsContent value="slots-alt" className="space-y-4 mt-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Alternative Slot-Farben mit dem Trendy-Design (Hintergrund, Rahmen, Text).
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slotAltColors.map(renderColorCard)}
          </div>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themeColors.map(renderColorCard)}
          </div>
        </TabsContent>

        <TabsContent value="gradients" className="space-y-4 mt-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Gradienten werden als CSS-Strings gespeichert (z.B. linear-gradient...).
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradients.map(renderColorCard)}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Vorschau der aktuellen Farben</p>
              <p className="text-sm text-muted-foreground">
                Änderungen werden sofort in der Anwendung übernommen
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: `hsl(${baseColors[0]?.hsl_value || '202 85% 23%'})` }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: `hsl(${baseColors[1]?.hsl_value || '348 77% 67%'})` }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: `hsl(${baseColors[2]?.hsl_value || '133 28% 68%'})` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
