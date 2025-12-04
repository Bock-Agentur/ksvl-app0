import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Zap, Play, RotateCcw } from "lucide-react";
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
  const { settings, updateSettings, isLoading, DEFAULT_SETTINGS } = usePageTransitionSettings();
  const [previewKey, setPreviewKey] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const handleChange = async <K extends keyof PageTransitionSettings>(
    key: K,
    value: PageTransitionSettings[K]
  ) => {
    await updateSettings({ [key]: value });
  };

  const handleReset = async () => {
    await updateSettings(DEFAULT_SETTINGS);
    toast.success("Einstellungen zurückgesetzt");
  };

  const triggerPreview = () => {
    setIsPreviewVisible(false);
    setTimeout(() => {
      setPreviewKey(prev => prev + 1);
      setIsPreviewVisible(true);
    }, 50);
  };

  const getPreviewStyle = (): React.CSSProperties => {
    if (!settings.enabled || settings.effect === 'none' || !isPreviewVisible) {
      return { opacity: isPreviewVisible ? 1 : 0 };
    }

    const baseStyle: React.CSSProperties = {
      animationDuration: `${settings.duration}ms`,
      animationTimingFunction: settings.easing,
      animationFillMode: 'forwards',
    };

    switch (settings.effect) {
      case 'fade':
        return { ...baseStyle, animationName: 'page-fade' };
      case 'slide-up':
        return { 
          ...baseStyle, 
          animationName: 'page-slide-up',
          '--translate-distance': `${settings.translateDistance}px`,
        } as React.CSSProperties;
      case 'slide-down':
        return { 
          ...baseStyle, 
          animationName: 'page-slide-down',
          '--translate-distance': `${settings.translateDistance}px`,
        } as React.CSSProperties;
      case 'scale':
        return { ...baseStyle, animationName: 'page-scale' };
      case 'fade-slide':
        return { 
          ...baseStyle, 
          animationName: 'page-fade-slide',
          '--translate-distance': `${settings.translateDistance}px`,
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

  const showSlideDistance = ['slide-up', 'slide-down', 'fade-slide'].includes(settings.effect);

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
              checked={settings.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Effect */}
              <div className="space-y-2">
                <Label>Effekt</Label>
                <Select
                  value={settings.effect}
                  onValueChange={(value) => handleChange('effect', value as PageTransitionSettings['effect'])}
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

              {settings.effect !== 'none' && (
                <>
                  {/* Duration */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Animationsdauer</Label>
                      <span className="text-sm text-muted-foreground">{settings.duration}ms</span>
                    </div>
                    <Slider
                      value={[settings.duration]}
                      onValueChange={([value]) => handleChange('duration', value)}
                      min={200}
                      max={1500}
                      step={50}
                    />
                  </div>

                  {/* Easing */}
                  <div className="space-y-2">
                    <Label>Easing-Funktion</Label>
                    <Select
                      value={settings.easing}
                      onValueChange={(value) => handleChange('easing', value as PageTransitionSettings['easing'])}
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
                        <span className="text-sm text-muted-foreground">{settings.translateDistance}px</span>
                      </div>
                      <Slider
                        value={[settings.translateDistance]}
                        onValueChange={([value]) => handleChange('translateDistance', value)}
                        min={0}
                        max={30}
                        step={2}
                      />
                    </div>
                  )}

                  {/* Loader Fade Out Duration */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Loader-Ausblendung</Label>
                      <span className="text-sm text-muted-foreground">{settings.loaderFadeOutDuration}ms</span>
                    </div>
                    <Slider
                      value={[settings.loaderFadeOutDuration]}
                      onValueChange={([value]) => handleChange('loaderFadeOutDuration', value)}
                      min={200}
                      max={800}
                      step={50}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Reset Button */}
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Auf Standard zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {settings.enabled && settings.effect !== 'none' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vorschau</CardTitle>
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
