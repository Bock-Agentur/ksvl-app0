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

  const hslToHex = (hslString: string): string => {
    const hsl = parseHSL(hslString);
    if (!hsl) return "#000000";

    const { h, s, l } = hsl;
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lDecimal - c / 2;

    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    const toHex = (value: number) => {
      const hex = Math.round((value + m) * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const renderColorCard = (setting: ThemeSetting) => {
    const currentValue = editedColors[setting.id] || setting.hsl_value;
    const hexColor = setting.category !== 'gradient' ? hslToHex(currentValue) : '#000000';
    const hasChanges = editedColors[setting.id] !== undefined;

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
          {setting.category !== 'gradient' ? (
            <>
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: `hsl(${currentValue})` }}
                />
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">HSL Wert</Label>
                  <Input
                    value={currentValue}
                    onChange={(e) => handleColorChange(setting.id, e.target.value)}
                    placeholder="202 85% 23%"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Hex:</Label>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{hexColor}</code>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">CSS Gradient</Label>
              <div 
                className="w-full h-16 rounded-lg border-2 border-border shadow-sm"
                style={{ background: currentValue }}
              />
              <Input
                value={currentValue}
                onChange={(e) => handleColorChange(setting.id, e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          )}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="base">Basis-Farben</TabsTrigger>
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
