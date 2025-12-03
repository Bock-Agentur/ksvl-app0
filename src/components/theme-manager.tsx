import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeSettings, ThemeSetting, useRoleBadgeSettings, useToast } from "@/hooks";
import { Palette, Save, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { HexColorPicker, RgbaColorPicker } from "react-colorful";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { ROLE_ORDER, ROLE_LABELS } from "@/lib/role-order";
import { QUERY_KEYS } from "@/lib/query-keys";

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
  const { settings: roleBadgeSettings, isLoading: roleSettingsLoading } = useRoleBadgeSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedColors, setEditedColors] = useState<Record<string, string>>({});
  const [editedRoleBadges, setEditedRoleBadges] = useState<Record<string, { bg: string; text: string }>>({});

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

  const handleRoleBadgeSave = async (role: string) => {
    const edited = editedRoleBadges[role];
    if (!edited) return;

    const { error } = await supabase
      .from('role_badge_settings')
      .update({
        bg_color: edited.bg,
        text_color: edited.text,
        updated_at: new Date().toISOString(),
      })
      .eq('role', role);

    if (error) {
      toast({
        title: "Fehler",
        description: "Konnte Rollen-Badge-Einstellungen nicht speichern",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Gespeichert",
        description: "Rollen-Badge-Einstellungen wurden aktualisiert",
      });
      // Clear the edited state for this role
      setEditedRoleBadges(prev => {
        const { [role]: _, ...rest } = prev;
        return rest;
      });
      // Force re-fetch of role badge settings
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roleBadgeSettings });
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

  // Filter settings by category - DEPRECATED categories removed: slot-status, slot-status-alt, theme
  // Slot-Farben werden ausschließlich über slot-design-settings in app_settings verwaltet (siehe DesignSettings.tsx)
  const baseColors = settings?.filter(s => s.category === 'base') || [];
  const badgeColors = settings?.filter(s => s.category === 'badge') || [];
  const gradients = settings?.filter(s => s.category === 'gradient') || [];

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6" />
              <div>
                <CardTitle className="text-xl">Theme-Verwaltung</CardTitle>
                <CardDescription>
                  Passen Sie die Farben und das Design Ihrer Anwendung an
                </CardDescription>
              </div>
            </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="base">Basis-Farben</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="role-badges">Rollen-Badges</TabsTrigger>
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
                Passen Sie die Hintergrund- und Schriftfarben aller Badge-Varianten an. Badges werden in der gesamten Anwendung verwendet.
              </p>
            </CardContent>
          </Card>
          
          {/* Hinweis: Slot-bezogene Badges (available, booked, blocked) werden über Slot-Design verwaltet */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-amber-800">
                <strong>Hinweis:</strong> Die Farben für Slot-Status (Verfügbar, Gebucht, Blockiert) werden unter 
                <strong> Design → Slot-Design</strong> konfiguriert, nicht hier.
              </p>
            </CardContent>
          </Card>
          
          {/* Badge List View - ohne Slot-bezogene Badges */}
          <div className="space-y-3">
            {[
              { variant: 'default', bgName: 'Badge Standard', fgName: 'Badge Standard Vordergrund' },
              { variant: 'secondary', bgName: 'Badge Sekundär', fgName: 'Badge Sekundär Vordergrund' },
              { variant: 'destructive', bgName: 'Badge Destruktiv', fgName: 'Badge Destruktiv Vordergrund' },
              { variant: 'outline', bgName: 'Badge Outline', fgName: 'Badge Outline Vordergrund', hoverBgName: 'Badge Outline Hover', hoverFgName: 'Badge Outline Hover Vordergrund' },
              { variant: 'success', bgName: 'Badge Erfolg', fgName: 'Badge Erfolg Vordergrund' },
              { variant: 'warning', bgName: 'Badge Warnung', fgName: 'Badge Warnung Vordergrund' },
              // ENTFERNT: available, booked, blocked - werden über slot-design-settings verwaltet
            ].map(({ variant, bgName, fgName, hoverBgName, hoverFgName }) => {
              const bgSetting = badgeColors.find(s => s.name === bgName);
              const fgSetting = badgeColors.find(s => s.name === fgName);
              const hoverBgSetting = hoverBgName ? badgeColors.find(s => s.name === hoverBgName) : null;
              const hoverFgSetting = hoverFgName ? badgeColors.find(s => s.name === hoverFgName) : null;
              
              if (!bgSetting || !fgSetting) return null;
              
              const bgValue = editedColors[bgSetting.id] || bgSetting.hsl_value;
              const fgValue = editedColors[fgSetting.id] || fgSetting.hsl_value;
              const hoverBgValue = hoverBgSetting ? (editedColors[hoverBgSetting.id] || hoverBgSetting.hsl_value) : null;
              const hoverFgValue = hoverFgSetting ? (editedColors[hoverFgSetting.id] || hoverFgSetting.hsl_value) : null;
              const hasChanges = editedColors[bgSetting.id] !== undefined || editedColors[fgSetting.id] !== undefined || 
                                 (hoverBgSetting && editedColors[hoverBgSetting.id] !== undefined) ||
                                 (hoverFgSetting && editedColors[hoverFgSetting.id] !== undefined);
              
              return (
                <Card key={variant}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold capitalize">{variant}</CardTitle>
                      <Badge variant={variant as any} style={{ backgroundColor: `hsl(${bgValue})`, color: `hsl(${fgValue})` }}>
                        Beispiel
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ColorPicker
                        color={bgValue}
                        onChange={(newValue) => handleColorChange(bgSetting.id, newValue)}
                        label="Hintergrundfarbe"
                      />
                      <ColorPicker
                        color={fgValue}
                        onChange={(newValue) => handleColorChange(fgSetting.id, newValue)}
                        label="Schriftfarbe"
                      />
                      {hoverBgSetting && hoverBgValue && (
                        <>
                          <ColorPicker
                            color={hoverBgValue}
                            onChange={(newValue) => handleColorChange(hoverBgSetting.id, newValue)}
                            label="Hover Hintergrund"
                          />
                          {hoverFgSetting && hoverFgValue && (
                            <ColorPicker
                              color={hoverFgValue}
                              onChange={(newValue) => handleColorChange(hoverFgSetting.id, newValue)}
                              label="Hover Schrift"
                            />
                          )}
                        </>
                      )}
                    </div>
                    {hasChanges && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editedColors[bgSetting.id]) handleSave(bgSetting.id);
                          if (editedColors[fgSetting.id]) handleSave(fgSetting.id);
                          if (hoverBgSetting && editedColors[hoverBgSetting.id]) handleSave(hoverBgSetting.id);
                          if (hoverFgSetting && editedColors[hoverFgSetting.id]) handleSave(hoverFgSetting.id);
                        }}
                        className="w-full mt-3"
                      >
                        <Save className="w-3 h-3 mr-2" />
                        Speichern
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="role-badges" className="space-y-4 mt-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Passen Sie die Hintergrund- und Schriftfarben aller Rollen-Badges an.
              </p>
            </CardContent>
          </Card>
          
          {/* Role Badge List View */}
          <div className="space-y-3">
            {ROLE_ORDER.map((role) => {
              const label = ROLE_LABELS[role];
              const settings = roleBadgeSettings?.[role];
              if (!settings) return null;
              
              // Get current values with proper formatting
              const currentBg = editedRoleBadges[role]?.bg || settings.bgColor;
              const currentText = editedRoleBadges[role]?.text || settings.textColor;
              
              // Normalize to consistent format for display (remove hsl() wrapper and commas)
              const normalizedBg = currentBg.replace(/hsl\(([\d.]+),?\s*([\d.]+)%,?\s*([\d.]+)%\)/, '$1 $2% $3%');
              const normalizedText = currentText.replace(/hsl\(([\d.]+),?\s*([\d.]+)%,?\s*([\d.]+)%\)/, '$1 $2% $3%');
              
              const hasChanges = editedRoleBadges[role] !== undefined;
              
              return (
                <Card key={role}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">{label}</CardTitle>
                      <Badge 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `hsl(${normalizedBg.replace(/\s+/g, ', ')})`,
                          color: `hsl(${normalizedText.replace(/\s+/g, ', ')})`
                        }}
                      >
                        Beispiel
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ColorPicker
                        color={normalizedBg}
                        onChange={(newValue) => {
                          setEditedRoleBadges(prev => ({
                            ...prev,
                            [role]: {
                              bg: `hsl(${newValue.replace(/\s+/g, ', ')})`,
                              text: prev[role]?.text || settings.textColor
                            }
                          }));
                        }}
                        label="Hintergrundfarbe"
                      />
                      <ColorPicker
                        color={normalizedText}
                        onChange={(newValue) => {
                          setEditedRoleBadges(prev => ({
                            ...prev,
                            [role]: {
                              bg: prev[role]?.bg || settings.bgColor,
                              text: `hsl(${newValue.replace(/\s+/g, ', ')})`
                            }
                          }));
                        }}
                        label="Schriftfarbe"
                      />
                    </div>
                    {hasChanges && (
                      <Button
                        size="sm"
                        onClick={() => handleRoleBadgeSave(role)}
                        className="w-full mt-3"
                      >
                        <Save className="w-3 h-3 mr-2" />
                        Speichern
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* REMOVED: Slot-Status, Slot-Alt, Theme tabs - Slot-Farben werden über DesignSettings.tsx / slot-design-settings verwaltet */}

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
