import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useStartupScreen } from '@/hooks/use-startup-screen';
import { StartupScreen } from './startup-screen';
import { Play, RotateCcw, Save, Download, Sparkles, Settings, Palette, Timer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function StartupScreenSettings() {
  const { settings, updateSettings, resetSettings, saveAsDefault, loadDefaultSettings } = useStartupScreen();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const backgroundGradientOptions = [
    { value: 'navy-pink', label: 'Navy → Pink' },
    { value: 'cyan-green', label: 'Cyan → Green' },
    { value: 'pink-cyan', label: 'Pink → Cyan' },
    { value: 'navy-cyan', label: 'Navy → Cyan' },
    { value: 'maritime-sunset', label: 'Maritime Sunset' },
    { value: 'ocean-breeze', label: 'Ocean Breeze' }
  ];

  const backgroundColorOptions = [
    { value: 'trendy-navy', label: 'Trendy Navy' },
    { value: 'trendy-pink', label: 'Trendy Pink' },
    { value: 'trendy-cyan', label: 'Trendy Cyan' },
    { value: 'trendy-green', label: 'Trendy Green' },
    { value: 'primary', label: 'Primary' }
  ];

  const enterAnimationOptions = [
    { value: 'slide-up', label: 'Von unten einfahren' },
    { value: 'slide-down', label: 'Von oben einfahren' },
    { value: 'slide-left', label: 'Von rechts einfahren' },
    { value: 'slide-right', label: 'Von links einfahren' },
    { value: 'fade', label: 'Einblenden' },
    { value: 'scale', label: 'Vergrößern' },
    { value: 'scale-rotate', label: 'Skalieren & Drehen' },
    { value: 'flip-x', label: 'Horizontal umklappen' },
    { value: 'flip-y', label: 'Vertikal umklappen' },
    { value: 'zoom-in', label: 'Hineinzoomen' },
    { value: 'spiral-in', label: 'Spirale hinein' },
    { value: 'elastic-in', label: 'Elastisch hinein' },
    { value: 'bounce-in', label: 'Hüpfend hinein' },
    { value: 'roll-in', label: 'Hineinrollen' },
    { value: 'unfold', label: 'Entfalten' }
  ];

  const exitAnimationOptions = [
    { value: 'slide-up', label: 'Nach oben ausfahren' },
    { value: 'slide-down', label: 'Nach unten ausfahren' },
    { value: 'slide-left', label: 'Nach links ausfahren' },
    { value: 'slide-right', label: 'Nach rechts ausfahren' },
    { value: 'fade', label: 'Ausblenden' },
    { value: 'scale', label: 'Verkleinern' },
    { value: 'scale-rotate', label: 'Skalieren & Drehen' },
    { value: 'flip-x', label: 'Horizontal umklappen' },
    { value: 'flip-y', label: 'Vertikal umklappen' },
    { value: 'zoom-out', label: 'Herauszoomen' },
    { value: 'spiral-out', label: 'Spirale heraus' },
    { value: 'elastic-out', label: 'Elastisch heraus' },
    { value: 'bounce-out', label: 'Hüpfend heraus' },
    { value: 'roll-out', label: 'Herausrollen' },
    { value: 'fold', label: 'Zusammenfalten' }
  ];

  const mainPageAnimationOptions = [
    { value: 'startup-fade-in', label: 'Sanft einblenden' },
    { value: 'startup-slide-in-up', label: 'Von unten einfahren' },
    { value: 'startup-slide-in-down', label: 'Von oben einfahren' },
    { value: 'startup-scale-in', label: 'Vergrößern' },
    { value: 'startup-zoom-in', label: 'Hineinzoomen' },
    { value: 'startup-rotate-in', label: 'Hineindrehen' },
    { value: 'startup-elastic', label: 'Elastisch' },
    { value: 'startup-bounce', label: 'Hüpfend' },
    { value: 'startup-wave', label: 'Welleneffekt' }
  ];

  const easingOptions = [
    { value: 'ease', label: 'Standard' },
    { value: 'ease-in', label: 'Langsam beginnen' },
    { value: 'ease-out', label: 'Langsam enden' },
    { value: 'ease-in-out', label: 'Sanft beginnen & enden' },
    { value: 'linear', label: 'Konstant' },
    { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: 'Hüpfend' },
    { value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', label: 'Geschmeidig' },
    { value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', label: 'Elastisch' },
    { value: 'cubic-bezier(0.645, 0.045, 0.355, 1)', label: 'Dramatisch' },
    { value: 'cubic-bezier(0.23, 1, 0.32, 1)', label: 'Elegant' },
    { value: 'cubic-bezier(0.77, 0, 0.175, 1)', label: 'Schnell & Scharf' }
  ];

  const iconAnimationOptions = [
    { value: 'pulse-glow', label: 'Leuchtender Puls' },
    { value: 'bounce', label: 'Hüpfen' },
    { value: 'pulse', label: 'Pulsieren' },
    { value: 'spin', label: 'Drehen' },
    { value: 'ping', label: 'Ping-Wellen' },
    { value: 'wiggle', label: 'Wackeln' },
    { value: 'float', label: 'Schweben' },
    { value: 'shake', label: 'Schütteln' },
    { value: 'glow-pulse', label: 'Glüh-Puls' },
    { value: 'breathe', label: 'Atmen' },
    { value: 'orbit', label: 'Kreisbahn' },
    { value: 'morph', label: 'Morphen' }
  ];

  const textAnimationOptions = [
    { value: 'slide-up', label: 'Von unten einfahren' },
    { value: 'bounce', label: 'Hüpfen' },
    { value: 'pulse', label: 'Pulsieren' },
    { value: 'fade', label: 'Einblenden' },
    { value: 'scale', label: 'Skalieren' },
    { value: 'wiggle', label: 'Wackeln' },
    { value: 'typewriter', label: 'Schreibmaschine' },
    { value: 'glitch', label: 'Glitch-Effekt' },
    { value: 'neon-flicker', label: 'Neon-Flackern' },
    { value: 'wave-text', label: 'Textwelle' },
    { value: 'letter-dance', label: 'Buchstaben-Tanz' },
    { value: 'glow-text', label: 'Glühender Text' }
  ];

  const containerAnimationOptions = [
    { value: 'none', label: 'Keine Animation' },
    { value: 'scale-in', label: 'Vergrößern' },
    { value: 'rotate-in', label: 'Hineindrehen' },
    { value: 'float', label: 'Schweben' },
    { value: 'breathe', label: 'Atmen' },
    { value: 'elastic', label: 'Elastisch' },
    { value: 'magnetic', label: 'Magnetisch' }
  ];

  const backgroundAnimationOptions = [
    { value: 'none', label: 'Keine Animation' },
    { value: 'fade-in', label: 'Einblenden' },
    { value: 'zoom-in', label: 'Hineinzoomen' },
    { value: 'gradient-shift', label: 'Gradient-Verschiebung' },
    { value: 'particle-flow', label: 'Partikel-Fluss' },
    { value: 'wave-motion', label: 'Wellenbewegung' },
    { value: 'aurora', label: 'Aurora-Effekt' }
  ];

  const handlePreview = () => {
    setIsPreviewVisible(true);
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Einstellungen zurückgesetzt",
      description: "Startbildschirm-Einstellungen wurden auf Standard zurückgesetzt."
    });
  };

  const handleSaveAsDefault = () => {
    saveAsDefault();
    toast({
      title: "Als Standard gespeichert",
      description: "Aktuelle Einstellungen wurden als neue Standardwerte gespeichert."
    });
  };

  const handleLoadDefaults = () => {
    const loaded = loadDefaultSettings();
    if (loaded) {
      toast({
        title: "Standard-Einstellungen geladen",
        description: "Gespeicherte Standard-Einstellungen wurden angewendet."
      });
    } else {
      toast({
        title: "Keine Standard-Einstellungen",
        description: "Es wurden noch keine benutzerdefinierten Standards gespeichert.",
        variant: "destructive"
      });
    }
  };

  const handleShowDefaults = () => {
    try {
      const savedDefaults = localStorage.getItem('startupScreenDefaults');
      if (savedDefaults) {
        const parsedDefaults = JSON.parse(savedDefaults);
        const defaultsValue = parsedDefaults.value || parsedDefaults;
        
        console.log('=== GESPEICHERTE STANDARD-EINSTELLUNGEN ===');
        console.log(JSON.stringify(defaultsValue, null, 2));
        
        toast({
          title: "Standard-Einstellungen",
          description: "Gespeicherte Standard-Einstellungen wurden in der Konsole ausgegeben. (F12 → Konsole)"
        });
      } else {
        toast({
          title: "Keine Standards gefunden",
          description: "Es wurden noch keine Standard-Einstellungen gespeichert.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Lesen der Standard-Einstellungen:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Lesen der Standard-Einstellungen.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle>Startbildschirm Konfiguration</CardTitle>
          </div>
          <CardDescription>
            Erweiterte Konfiguration für Animationen, Effekte und Verhalten des Startbildschirms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 1. GRUNDEINSTELLUNGEN */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold">Grundeinstellungen</h3>
            </div>
            
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Startbildschirm aktiviert</Label>
                <p className="text-sm text-muted-foreground">
                  Startbildschirm beim Laden der App anzeigen
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(enabled) => updateSettings({ enabled })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label>Anzeigedauer: {settings.duration / 1000}s</Label>
                <Slider
                  value={[settings.duration]}
                  onValueChange={([duration]) => updateSettings({ duration })}
                  min={1000}
                  max={10000}
                  step={500}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Wie lange der Startbildschirm angezeigt wird
                </p>
              </div>

              {/* Text */}
              <div className="space-y-2">
                <Label htmlFor="text">Angezeigter Text</Label>
                <Input
                  id="text"
                  value={settings.text}
                  onChange={(e) => updateSettings({ text: e.target.value })}
                  placeholder="KSVL App"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 2. ERSCHEINUNG */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold">Erscheinung & Hintergrund</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Background Type */}
              <div className="space-y-2">
                <Label>Hintergrund Typ</Label>
                <Select
                  value={settings.backgroundType}
                  onValueChange={(backgroundType: 'gradient' | 'solid') => 
                    updateSettings({ backgroundType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="solid">Einfarbig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Background Animation */}
              <div className="space-y-2">
                <Label>Hintergrund Animation</Label>
                <Select
                  value={settings.backgroundAnimation}
                  onValueChange={(backgroundAnimation) => updateSettings({ backgroundAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {backgroundAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Background Gradient */}
            {settings.backgroundType === 'gradient' && (
              <div className="space-y-2">
                <Label>Gradient-Auswahl</Label>
                <Select
                  value={settings.backgroundGradient}
                  onValueChange={(backgroundGradient) => updateSettings({ backgroundGradient })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {backgroundGradientOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Background Color */}
            {settings.backgroundType === 'solid' && (
              <div className="space-y-2">
                <Label>Hintergrundfarbe</Label>
                <Select
                  value={settings.backgroundColor}
                  onValueChange={(backgroundColor) => updateSettings({ backgroundColor })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {backgroundColorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* 3. BILDSCHIRM-ANIMATIONEN */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold">Bildschirm-Animationen & Timing</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Enter Animation */}
              <div className="space-y-2">
                <Label>Einblende Animation</Label>
                <Select
                  value={settings.enterAnimation}
                  onValueChange={(enterAnimation) => updateSettings({ enterAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {enterAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exit Animation */}
              <div className="space-y-2">
                <Label>Ausblende Animation</Label>
                <Select
                  value={settings.exitAnimation}
                  onValueChange={(exitAnimation) => updateSettings({ exitAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {exitAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Main Page Animation */}
              <div className="space-y-2">
                <Label>Startseiten Animation</Label>
                <Select
                  value={settings.mainPageAnimation}
                  onValueChange={(mainPageAnimation) => updateSettings({ mainPageAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {mainPageAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Timing Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Geschwindigkeit & Easing</h4>
                
                {/* Animation Speed */}
                <div className="space-y-2">
                  <Label>Geschwindigkeit: {settings.animationSpeed}x</Label>
                  <Slider
                    value={[settings.animationSpeed]}
                    onValueChange={([animationSpeed]) => updateSettings({ animationSpeed })}
                    min={0.2}
                    max={5.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    0.2x = sehr langsam, 5x = sehr schnell
                  </p>
                </div>

                {/* Animation Easing */}
                <div className="space-y-2">
                  <Label>Easing-Kurve</Label>
                  <Select
                    value={settings.animationEasing}
                    onValueChange={(animationEasing) => updateSettings({ animationEasing })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {easingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Zeitdauern</h4>
                
                {/* Enter Duration */}
                <div className="space-y-2">
                  <Label>Einblende-Dauer: {settings.enterDuration}ms</Label>
                  <Slider
                    value={[settings.enterDuration]}
                    onValueChange={([enterDuration]) => updateSettings({ enterDuration })}
                    min={100}
                    max={3000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Exit Duration */}
                <div className="space-y-2">
                  <Label>Ausblende-Dauer: {settings.exitDuration}ms</Label>
                  <Slider
                    value={[settings.exitDuration]}
                    onValueChange={([exitDuration]) => updateSettings({ exitDuration })}
                    min={100}
                    max={3000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Main Page Duration */}
                <div className="space-y-2">
                  <Label>Startseiten-Dauer: {settings.mainPageDuration}ms</Label>
                  <Slider
                    value={[settings.mainPageDuration]}
                    onValueChange={([mainPageDuration]) => updateSettings({ mainPageDuration })}
                    min={100}
                    max={2000}
                    step={50}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 4. ELEMENT-ANIMATIONEN */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold">Element-Animationen</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Icon Animation */}
              <div className="space-y-2">
                <Label>Icon Animation</Label>
                <Select
                  value={settings.iconAnimation}
                  onValueChange={(iconAnimation) => updateSettings({ iconAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {iconAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Animation */}
              <div className="space-y-2">
                <Label>Text Animation</Label>
                <Select
                  value={settings.textAnimation}
                  onValueChange={(textAnimation) => updateSettings({ textAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {textAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Container Animation */}
              <div className="space-y-2">
                <Label>Container Animation</Label>
                <Select
                  value={settings.containerAnimation}
                  onValueChange={(containerAnimation) => updateSettings({ containerAnimation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {containerAnimationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Element Timing */}
            <div className="space-y-4">
              <h4 className="font-medium">Element-Timing & Staffelung</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Icon Delay */}
                <div className="space-y-2">
                  <Label>Icon Verzögerung: {settings.iconDelay}ms</Label>
                  <Slider
                    value={[settings.iconDelay]}
                    onValueChange={([iconDelay]) => updateSettings({ iconDelay })}
                    min={0}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Text Delay */}
                <div className="space-y-2">
                  <Label>Text Verzögerung: {settings.textDelay}ms</Label>
                  <Slider
                    value={[settings.textDelay]}
                    onValueChange={([textDelay]) => updateSettings({ textDelay })}
                    min={0}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Element Stagger */}
                <div className="space-y-2">
                  <Label>Element Staffelung: {settings.elementStagger}ms</Label>
                  <Slider
                    value={[settings.elementStagger]}
                    onValueChange={([elementStagger]) => updateSettings({ elementStagger })}
                    min={0}
                    max={500}
                    step={25}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 5. ERWEITERTE EFFEKTE */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold">Erweiterte Effekte</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Visuelle Effekte</h4>
                
                {/* Effect Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="parallax">Parallax-Effekt</Label>
                    <Switch
                      id="parallax"
                      checked={settings.parallaxEffect}
                      onCheckedChange={(parallaxEffect) => updateSettings({ parallaxEffect })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blur">Unschärfe-Effekt</Label>
                    <Switch
                      id="blur"
                      checked={settings.blurEffect}
                      onCheckedChange={(blurEffect) => updateSettings({ blurEffect })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="glow">Glüh-Effekt</Label>
                    <Switch
                      id="glow"
                      checked={settings.glowEffect}
                      onCheckedChange={(glowEffect) => updateSettings({ glowEffect })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rotation">Rotation-Effekt</Label>
                    <Switch
                      id="rotation"
                      checked={settings.rotationEffect}
                      onCheckedChange={(rotationEffect) => updateSettings({ rotationEffect })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scale">Skalierungs-Effekt</Label>
                    <Switch
                      id="scale"
                      checked={settings.scaleEffect}
                      onCheckedChange={(scaleEffect) => updateSettings({ scaleEffect })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Effekt-Intensität</h4>
                
                {/* Shadow Intensity */}
                <div className="space-y-2">
                  <Label>Schatten-Intensität: {Math.round(settings.shadowIntensity * 100)}%</Label>
                  <Slider
                    value={[settings.shadowIntensity]}
                    onValueChange={([shadowIntensity]) => updateSettings({ shadowIntensity })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 6. PERFORMANCE & ZUGÄNGLICHKEIT */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-semibold">Performance & Zugänglichkeit</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smooth">Sanfte Übergänge</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktiviert CSS-Übergangsglättung
                  </p>
                </div>
                <Switch
                  id="smooth"
                  checked={settings.smoothTransitions}
                  onCheckedChange={(smoothTransitions) => updateSettings({ smoothTransitions })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hardware">Hardware-Beschleunigung</Label>
                  <p className="text-sm text-muted-foreground">
                    Nutzt GPU für bessere Performance
                  </p>
                </div>
                <Switch
                  id="hardware"
                  checked={settings.hardwareAcceleration}
                  onCheckedChange={(hardwareAcceleration) => updateSettings({ hardwareAcceleration })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced">Reduzierte Bewegung</Label>
                  <p className="text-sm text-muted-foreground">
                    Respektiert Benutzer-Präferenzen für weniger Animation
                  </p>
                </div>
                <Switch
                  id="reduced"
                  checked={settings.reducedMotion}
                  onCheckedChange={(reducedMotion) => updateSettings({ reducedMotion })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-6">
            <Button onClick={handlePreview} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Vorschau
            </Button>
            <Button onClick={handleSaveAsDefault} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Als Standard
            </Button>
            <Button onClick={handleLoadDefaults} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Standard laden
            </Button>
            <Button onClick={handleShowDefaults} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Standards anzeigen
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {isPreviewVisible && (
        <StartupScreen
          isVisible={true}
          settings={settings}
          onComplete={() => setIsPreviewVisible(false)}
        />
      )}
    </div>
  );
}