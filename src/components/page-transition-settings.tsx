import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Zap, Play, RotateCcw, Save, Loader2 } from "lucide-react";
import { usePageTransitionSettings, type PageTransitionSettings } from "@/hooks/core/settings/use-page-transition-settings";
import { toast } from "sonner";

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
] as const;

const EFFECT_OPTIONS = [
  { value: 'none', label: 'Keine Animation' },
  { value: 'fade', label: 'Einblenden' },
  { value: 'slide-up', label: 'Nach oben gleiten' },
  { value: 'slide-down', label: 'Nach unten gleiten' },
  { value: 'scale', label: 'Skalieren' },
  { value: 'fade-slide', label: 'Einblenden + Gleiten' },
] as const;

export function PageTransitionSettings() {
  const { settings: savedSettings, updateSettings, isLoading, DEFAULT_SETTINGS } = usePageTransitionSettings();
  
  // Local state for unsaved changes
  const [localSettings, setLocalSettings] = useState<PageTransitionSettings>(savedSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Preview state
  const [previewKey, setPreviewKey] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  // Sync local state when saved settings change
  useEffect(() => {
    setLocalSettings(savedSettings);
    setHasChanges(false);
  }, [savedSettings]);

  const handleLocalChange = <K extends keyof PageTransitionSettings>(
    key: K,
    value: PageTransitionSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      toast.success("Einstellungen gespeichert");
    } catch (error) {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  const triggerPreview = () => {
    setIsPreviewVisible(false);
    setTimeout(() => {
      setPreviewKey(prev => prev + 1);
      setIsPreviewVisible(true);
    }, 50);
  };

  const getPreviewStyle = (): React.CSSProperties => {
    if (!localSettings.enabled || localSettings.effect === 'none' || !isPreviewVisible) {
      return { opacity: isPreviewVisible ? 1 : 0 };
    }

    const baseStyle: React.CSSProperties = {
      animationDuration: `${localSettings.duration}ms`,
      animationTimingFunction: localSettings.easing,
      animationFillMode: 'forwards',
    };

    switch (localSettings.effect) {
      case 'fade':
        return { ...baseStyle, animationName: 'page-fade' };
      case 'slide-up':
        return { 
          ...baseStyle, 
          animationName: 'page-slide-up',
          '--translate-distance': `${localSettings.translateDistance}px`,
        } as React.CSSProperties;
      case 'slide-down':
        return { 
          ...baseStyle, 
          animationName: 'page-slide-down',
          '--translate-distance': `${localSettings.translateDistance}px`,
        } as React.CSSProperties;
      case 'scale':
        return { ...baseStyle, animationName: 'page-scale' };
      case 'fade-slide':
        return { 
          ...baseStyle, 
          animationName: 'page-fade-slide',
          '--translate-distance': `${localSettings.translateDistance}px`,
        } as React.CSSProperties;
      default:
        return {};
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const showSlideDistance = ['slide-up', 'slide-down', 'fade-slide'].includes(localSettings.effect);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Seitenübergänge
          </CardTitle>
          <CardDescription>
            Konfiguriere die Animation beim Wechseln zwischen Seiten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Seitenübergänge aktiviert</Label>
              <p className="text-sm text-muted-foreground">
                Animationen beim Seitenwechsel ein-/ausschalten
              </p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(checked) => handleLocalChange('enabled', checked)}
            />
          </div>

          {localSettings.enabled && (
            <>
              {/* Effect */}
              <div className="space-y-2">
                <Label>Effekt</Label>
                <Select
                  value={localSettings.effect}
                  onValueChange={(value) => handleLocalChange('effect', value as PageTransitionSettings['effect'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFECT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {localSettings.effect !== 'none' && (
                <>
                  {/* Duration - Einblenden */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Einblenden (Content)</Label>
                      <span className="text-sm text-muted-foreground">{localSettings.duration}ms</span>
                    </div>
                    <Slider
                      value={[localSettings.duration]}
                      onValueChange={([value]) => handleLocalChange('duration', value)}
                      min={100}
                      max={3000}
                      step={50}
                    />
                  </div>

                  {/* Easing */}
                  <div className="space-y-2">
                    <Label>Easing-Funktion</Label>
                    <Select
                      value={localSettings.easing}
                      onValueChange={(value) => handleLocalChange('easing', value as PageTransitionSettings['easing'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EASING_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Translate Distance (only for slide effects) */}
                  {showSlideDistance && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Slide-Distanz</Label>
                        <span className="text-sm text-muted-foreground">{localSettings.translateDistance}px</span>
                      </div>
                      <Slider
                        value={[localSettings.translateDistance]}
                        onValueChange={([value]) => handleLocalChange('translateDistance', value)}
                        min={0}
                        max={50}
                        step={2}
                      />
                    </div>
                  )}

                  {/* Loader Fade Out Duration - Ausblenden */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Ausblenden (Loader)</Label>
                      <span className="text-sm text-muted-foreground">{localSettings.loaderFadeOutDuration}ms</span>
                    </div>
                    <Slider
                      value={[localSettings.loaderFadeOutDuration]}
                      onValueChange={([value]) => handleLocalChange('loaderFadeOutDuration', value)}
                      min={100}
                      max={3000}
                      step={50}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} title="Auf Standard zurücksetzen">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {localSettings.enabled && localSettings.effect !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vorschau</CardTitle>
            <CardDescription>
              Zeigt die Animation mit den aktuellen lokalen Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                key={previewKey}
                className="h-32 rounded-lg bg-muted/50 border flex items-center justify-center"
                style={getPreviewStyle()}
              >
                <p className="text-muted-foreground">Seiteninhalt</p>
              </div>
              <Button variant="secondary" size="sm" onClick={triggerPreview}>
                <Play className="h-4 w-4 mr-2" />
                Animation abspielen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
