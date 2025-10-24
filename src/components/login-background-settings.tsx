import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLoginBackground } from "@/hooks/use-login-background";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Eye, Maximize2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function CountdownPreview({ endDate, text, small }: { endDate: string | null; text: string; small?: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, tenths: 0, hundredths: 0 });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const ms = difference % 1000;
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          tenths: Math.floor(ms / 100),
          hundredths: Math.floor((ms % 100) / 10)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 10);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex justify-center items-start gap-0.5">
        <div className="flex flex-col items-center">
          <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white tabular-nums`}>{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-[8px] text-white/70 mt-0.5">Tage</span>
        </div>
        <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white`}>:</span>
        <div className="flex flex-col items-center">
          <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white tabular-nums`}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-[8px] text-white/70 mt-0.5">Stunden</span>
        </div>
        <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white`}>:</span>
        <div className="flex flex-col items-center">
          <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white tabular-nums`}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-[8px] text-white/70 mt-0.5">Minuten</span>
        </div>
        <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white`}>:</span>
        <div className="flex flex-col items-center">
          <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white tabular-nums`}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-[8px] text-white/70 mt-0.5">Sekunden</span>
        </div>
        <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white`}>:</span>
        <div className="flex flex-col items-center">
          <span className={`${small ? 'text-2xl' : 'text-4xl'} font-thin text-white tabular-nums`}>{String(timeLeft.tenths)}{String(timeLeft.hundredths)}</span>
          <span className="text-[8px] text-white/70 mt-0.5">1/100</span>
        </div>
      </div>
      {text && (
        <p className={`text-white/90 ${small ? 'text-[10px]' : 'text-sm'} mt-2`}>{text}</p>
      )}
    </div>
  );
}

export function LoginBackgroundSettings() {
  const { background, setBackground } = useLoginBackground();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Local state for preview
  const [localSettings, setLocalSettings] = useState(background);
  
  const [isOverlayColorOpen, setIsOverlayColorOpen] = useState(false);
  const [isInputBgColorOpen, setIsInputBgColorOpen] = useState(false);

  // Update local state when background changes from server
  useEffect(() => {
    setLocalSettings(background);
  }, [background]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wähle ein Bild (JPG, PNG, WEBP) oder Video (MP4, WEBM)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      toast({
        title: "Datei zu groß",
        description: `${isVideo ? 'Videos' : 'Bilder'} dürfen maximal ${maxSize / 1024 / 1024}MB groß sein`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Delete old file if exists
      if (localSettings.filename) {
        await supabase.storage
          .from('login-media')
          .remove([localSettings.filename]);
      }

      // Upload new file
      const fileExt = file.name.split('.').pop();
      const fileName = `background-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('login-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('login-media')
        .getPublicUrl(fileName);

      // Update local settings and save to database
      const newSettings = {
        ...localSettings,
        type: (isVideo ? 'video' : 'image') as 'video' | 'image',
        url: publicUrl,
        filename: fileName
      };
      setLocalSettings(newSettings);
      
      // Automatically save to database
      await setBackground(newSettings);

      toast({
        title: "Erfolgreich hochgeladen und gespeichert",
        description: `Hintergrund wurde aktualisiert`
      });
    } catch (error: any) {
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete file from storage
      if (localSettings.filename) {
        await supabase.storage
          .from('login-media')
          .remove([localSettings.filename]);
      }

      // Reset to gradient in local settings
      const newSettings = {
        type: 'gradient' as const,
        url: null,
        filename: null,
        videoOnMobile: false,
        cardOpacity: localSettings.cardOpacity,
        cardBorderBlur: localSettings.cardBorderBlur,
        cardBorderRadius: localSettings.cardBorderRadius,
        overlayColor: localSettings.overlayColor,
        overlayOpacity: localSettings.overlayOpacity,
        mediaBlur: localSettings.mediaBlur,
        inputBgColor: localSettings.inputBgColor,
        inputBgOpacity: localSettings.inputBgOpacity,
        loginBlockVerticalPositionDesktop: localSettings.loginBlockVerticalPositionDesktop,
        loginBlockVerticalPositionTablet: localSettings.loginBlockVerticalPositionTablet,
        loginBlockVerticalPositionMobile: localSettings.loginBlockVerticalPositionMobile,
        loginBlockWidthDesktop: localSettings.loginBlockWidthDesktop,
        loginBlockWidthTablet: localSettings.loginBlockWidthTablet,
        loginBlockWidthMobile: localSettings.loginBlockWidthMobile,
        countdownEnabled: localSettings.countdownEnabled,
        countdownEndDate: localSettings.countdownEndDate,
        countdownText: localSettings.countdownText,
        countdownVerticalPositionDesktop: localSettings.countdownVerticalPositionDesktop,
        countdownVerticalPositionTablet: localSettings.countdownVerticalPositionTablet,
        countdownVerticalPositionMobile: localSettings.countdownVerticalPositionMobile
      };
      setLocalSettings(newSettings);
      
      // Automatically save to database
      await setBackground(newSettings);

      toast({
        title: "Hintergrund gelöscht und gespeichert",
        description: "Gradient wurde aktiviert"
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    try {
      await setBackground(localSettings);
      toast({
        title: "Einstellungen gespeichert",
        description: "Login-Hintergrund wurde aktualisiert"
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Speichern",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTypeChange = (type: 'gradient' | 'image' | 'video') => {
    if (type === 'gradient') {
      handleDelete();
    } else {
      setLocalSettings({ ...localSettings, type });
    }
  };

  const handleVideoOnMobileChange = (checked: boolean) => {
    setLocalSettings({ ...localSettings, videoOnMobile: checked });
  };

  const handleOpacityChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, cardOpacity: value[0] });
  };

  const handleBorderBlurChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, cardBorderBlur: value[0] });
  };

  const handleBorderRadiusChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, cardBorderRadius: value[0] });
  };

  const handleOverlayColorChange = (color: string) => {
    setLocalSettings({ ...localSettings, overlayColor: color });
  };

  const handleOverlayOpacityChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, overlayOpacity: value[0] });
  };

  const handleMediaBlurChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, mediaBlur: value[0] });
  };

  const handleInputBgColorChange = (color: string) => {
    setLocalSettings({ ...localSettings, inputBgColor: color });
  };

  const handleInputBgOpacityChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, inputBgOpacity: value[0] });
  };

  const handleLoginBlockVerticalPositionDesktopChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, loginBlockVerticalPositionDesktop: value[0] });
  };

  const handleLoginBlockVerticalPositionTabletChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, loginBlockVerticalPositionTablet: value[0] });
  };

  const handleLoginBlockVerticalPositionMobileChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, loginBlockVerticalPositionMobile: value[0] });
  };

  const handleCountdownEnabledChange = (checked: boolean) => {
    setLocalSettings({ ...localSettings, countdownEnabled: checked });
  };

  const handleCountdownEndDateChange = (date: string) => {
    setLocalSettings({ ...localSettings, countdownEndDate: date });
  };

  const handleCountdownTextChange = (text: string) => {
    setLocalSettings({ ...localSettings, countdownText: text });
  };

  const handleCountdownVerticalPositionDesktopChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, countdownVerticalPositionDesktop: value[0] });
  };

  const handleCountdownVerticalPositionTabletChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, countdownVerticalPositionTablet: value[0] });
  };

  const handleCountdownVerticalPositionMobileChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, countdownVerticalPositionMobile: value[0] });
  };

  const handleLoginBlockWidthDesktopChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, loginBlockWidthDesktop: value[0] });
  };

  const handleLoginBlockWidthTabletChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, loginBlockWidthTablet: value[0] });
  };

  const handleLoginBlockWidthMobileChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, loginBlockWidthMobile: value[0] });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Login-Hintergrund</CardTitle>
          <CardDescription>
            Gestalte den Hintergrund der Login-Seite mit einem Bild oder Video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background Type Selection */}
          <div className="space-y-3">
            <Label>Hintergrund-Typ</Label>
            <div className="flex gap-4">
              <Button
                variant={localSettings.type === 'gradient' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('gradient')}
                className="flex-1"
              >
                Gradient
              </Button>
              <Button
                variant={localSettings.type === 'image' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('image')}
                className="flex-1"
              >
                Bild
              </Button>
              <Button
                variant={localSettings.type === 'video' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('video')}
                className="flex-1"
              >
                Video
              </Button>
            </div>
          </div>

          {/* File Upload */}
          {localSettings.type !== 'gradient' && (
            <div className="space-y-3">
              <Label htmlFor="file-upload">
                {localSettings.type === 'video' ? 'Video hochladen' : 'Bild hochladen'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept={localSettings.type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {localSettings.url && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hintergrund löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Der aktuelle Hintergrund wird gelöscht und der Standard-Gradient wird aktiviert.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {localSettings.type === 'video'
                  ? 'Empfohlen: MP4 oder WEBM, max 50MB, 1920x1080, 30fps'
                  : 'Empfohlen: JPG, PNG oder WEBP, max 20MB, 1920x1080'
                }
              </p>
              {uploading && (
                <div className="text-sm text-muted-foreground">
                  Wird hochgeladen...
                </div>
              )}
            </div>
          )}

          {/* Video on Mobile Option */}
          {localSettings.type === 'video' && localSettings.url && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="video-mobile"
                  checked={localSettings.videoOnMobile}
                  onCheckedChange={handleVideoOnMobileChange}
                />
                <Label htmlFor="video-mobile" className="cursor-pointer">
                  Video auch auf Mobile abspielen
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                ⚠️ Beachte: Videos können auf Mobile-Geräten mehr Datenvolumen verbrauchen
              </p>
            </div>
          )}

          {/* Media Blur Slider */}
          {localSettings.url && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Hintergrund-Weichzeichnung</Label>
                <span className="text-sm text-muted-foreground">{localSettings.mediaBlur}px</span>
              </div>
              <Slider
                value={[localSettings.mediaBlur]}
                onValueChange={handleMediaBlurChange}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Kein Blur</span>
                <span>Stark verschwommen</span>
              </div>
            </div>
          )}

          {/* Overlay Color Picker */}
          {localSettings.url && (
            <div className="space-y-3">
              <Label>Overlay-Farbe</Label>
              <Popover open={isOverlayColorOpen} onOpenChange={setIsOverlayColorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-10 p-2 justify-start">
                    <div 
                      className="w-6 h-6 rounded border mr-2 flex-shrink-0"
                      style={{ backgroundColor: localSettings.overlayColor }}
                    />
                    <span className="text-sm font-mono truncate">{localSettings.overlayColor}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <HexColorPicker 
                    color={localSettings.overlayColor} 
                    onChange={handleOverlayColorChange}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: localSettings.overlayColor }}
                    />
                    <span className="text-xs font-mono">{localSettings.overlayColor}</span>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Overlay Opacity Slider */}
          {localSettings.url && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Overlay-Transparenz</Label>
                <span className="text-sm text-muted-foreground">{localSettings.overlayOpacity}%</span>
              </div>
              <Slider
                value={[localSettings.overlayOpacity]}
                onValueChange={handleOverlayOpacityChange}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Transparent</span>
                <span>Undurchsichtig</span>
              </div>
            </div>
          )}

          {/* Input Background Color */}
          <div className="space-y-3">
            <Label>Eingabefeld Hintergrundfarbe</Label>
            <Popover open={isInputBgColorOpen} onOpenChange={setIsInputBgColorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-10 p-2 justify-start">
                  <div 
                    className="w-6 h-6 rounded border mr-2 flex-shrink-0"
                    style={{ backgroundColor: localSettings.inputBgColor }}
                  />
                  <span className="text-sm font-mono truncate">{localSettings.inputBgColor}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <HexColorPicker 
                  color={localSettings.inputBgColor} 
                  onChange={handleInputBgColorChange}
                />
                <div className="flex items-center gap-2 mt-3">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: localSettings.inputBgColor }}
                  />
                  <span className="text-xs font-mono">{localSettings.inputBgColor}</span>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Input Background Opacity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Eingabefeld Transparenz</Label>
              <span className="text-sm text-muted-foreground">{localSettings.inputBgOpacity}%</span>
            </div>
            <Slider
              value={[localSettings.inputBgOpacity]}
              onValueChange={handleInputBgOpacityChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Transparent</span>
              <span>Undurchsichtig</span>
            </div>
          </div>

          {/* Login Block Settings with Tabs */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <Label className="text-base font-semibold">Login-Block Einstellungen</Label>
            <p className="text-sm text-muted-foreground">
              Positioniere und dimensioniere die Eingabefelder, Buttons und Links als zusammenhängenden Block
            </p>
            
            <Tabs defaultValue="desktop" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="tablet">Tablet</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              
              <TabsContent value="desktop" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Vertikale Position</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.loginBlockVerticalPositionDesktop || 50}%
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.loginBlockVerticalPositionDesktop || 50]}
                    onValueChange={handleLoginBlockVerticalPositionDesktopChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Oben</span>
                    <span>Unten</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Breite des Login-Blocks</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.loginBlockWidthDesktop || 400}px
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.loginBlockWidthDesktop || 400]}
                    onValueChange={handleLoginBlockWidthDesktopChange}
                    min={300}
                    max={600}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Schmal</span>
                    <span>Breit</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tablet" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Vertikale Position</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.loginBlockVerticalPositionTablet || 50}%
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.loginBlockVerticalPositionTablet || 50]}
                    onValueChange={handleLoginBlockVerticalPositionTabletChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Oben</span>
                    <span>Unten</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Breite des Login-Blocks</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.loginBlockWidthTablet || 380}px
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.loginBlockWidthTablet || 380]}
                    onValueChange={handleLoginBlockWidthTabletChange}
                    min={300}
                    max={600}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Schmal</span>
                    <span>Breit</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mobile" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Vertikale Position</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.loginBlockVerticalPositionMobile || 50}%
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.loginBlockVerticalPositionMobile || 50]}
                    onValueChange={handleLoginBlockVerticalPositionMobileChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Oben</span>
                    <span>Unten</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Breite des Login-Blocks</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.loginBlockWidthMobile || 340}px
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.loginBlockWidthMobile || 340]}
                    onValueChange={handleLoginBlockWidthMobileChange}
                    min={280}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Schmal</span>
                    <span>Breit</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Countdown Settings */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label htmlFor="countdown-enabled">Countdown aktivieren</Label>
              <Switch
                id="countdown-enabled"
                checked={localSettings.countdownEnabled}
                onCheckedChange={handleCountdownEnabledChange}
              />
            </div>
            
            {localSettings.countdownEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="countdown-date">Enddatum</Label>
                  <Input
                    id="countdown-date"
                    type="datetime-local"
                    value={localSettings.countdownEndDate || ''}
                    onChange={(e) => handleCountdownEndDateChange(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="countdown-text">Countdown-Text</Label>
                  <Input
                    id="countdown-text"
                    type="text"
                    placeholder="z.B. bis zur neuen Segelsaison"
                    value={localSettings.countdownText}
                    onChange={(e) => handleCountdownTextChange(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Countdown Position Desktop (vertikal)</Label>
                    <span className="text-sm text-muted-foreground">{localSettings.countdownVerticalPositionDesktop}%</span>
                  </div>
                  <Slider
                    value={[localSettings.countdownVerticalPositionDesktop]}
                    onValueChange={handleCountdownVerticalPositionDesktopChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Oben</span>
                    <span>Unten</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Countdown Position Tablet (vertikal)</Label>
                    <span className="text-sm text-muted-foreground">{localSettings.countdownVerticalPositionTablet}%</span>
                  </div>
                  <Slider
                    value={[localSettings.countdownVerticalPositionTablet]}
                    onValueChange={handleCountdownVerticalPositionTabletChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Oben</span>
                    <span>Unten</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Countdown Position Mobile (vertikal)</Label>
                    <span className="text-sm text-muted-foreground">{localSettings.countdownVerticalPositionMobile}%</span>
                  </div>
                  <Slider
                    value={[localSettings.countdownVerticalPositionMobile]}
                    onValueChange={handleCountdownVerticalPositionMobileChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Oben</span>
                    <span>Unten</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Preview */}
          {localSettings.url && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vorschau</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Originalgröße
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md h-[80vh] p-0">
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      {localSettings.type === 'video' ? (
                        <video
                          src={localSettings.url}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                        />
                      ) : (
                        <img
                          src={localSettings.url}
                          alt="Background preview"
                          className="w-full h-full object-cover"
                          style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                        />
                      )}
                      {/* Overlay Layer - z-index: 1 */}
                      <div 
                        className="absolute inset-0"
                        style={{ 
                          backgroundColor: `${localSettings.overlayColor}${Math.round((localSettings.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
                          zIndex: 1
                        }}
                      />
                      {/* Countdown Layer - z-index: 2 */}
                      {localSettings.countdownEnabled && localSettings.countdownEndDate && (
                        <div 
                          className="absolute inset-0 flex flex-col items-center pointer-events-none" 
                          style={{ 
                            paddingTop: `${localSettings.countdownVerticalPositionDesktop}%`,
                            zIndex: 2
                          }}
                        >
                          <CountdownPreview 
                            endDate={localSettings.countdownEndDate}
                            text={localSettings.countdownText}
                          />
                        </div>
                      )}
                      {/* Login Form Layer - z-index: 3 */}
                      <div 
                        className="absolute inset-0 flex flex-col items-center p-4"
                        style={{ 
                          zIndex: 3,
                          paddingTop: `${localSettings.loginBlockVerticalPositionDesktop || 50}vh`
                        }}
                      >
                        <div 
                          className="w-full space-y-3"
                          style={{
                            maxWidth: `${localSettings.loginBlockWidthDesktop || 400}px`
                          }}
                        >
                          <div 
                            className="flex items-center gap-3 px-4"
                            style={{
                              backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                              borderRadius: `${localSettings.cardBorderRadius}px`,
                              height: '48px'
                            }}
                          >
                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span style={{ color: 'rgba(0, 0, 0, 0.5)' }}>E-Mail oder Benutzername</span>
                          </div>
                          <div 
                            className="flex items-center gap-3 px-4"
                            style={{
                              backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                              borderRadius: `${localSettings.cardBorderRadius}px`,
                              height: '48px'
                            }}
                          >
                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span style={{ color: 'rgba(0, 0, 0, 0.5)' }}>Passwort</span>
                          </div>
                          <div 
                            className="w-full bg-primary text-primary-foreground font-medium text-center shadow-lg flex items-center justify-center"
                            style={{ 
                              borderRadius: `${localSettings.cardBorderRadius}px`,
                              height: '48px'
                            }}
                          >
                            Anmelden
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative w-full rounded-lg overflow-hidden border mx-auto" style={{ aspectRatio: '9/19.5', maxWidth: '280px' }}>
                {localSettings.type === 'video' ? (
                  <video
                    src={localSettings.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                  />
                ) : (
                  <img
                    src={localSettings.url}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                  />
                )}
                {/* Overlay Layer - z-index: 1 */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundColor: `${localSettings.overlayColor}${Math.round((localSettings.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
                    zIndex: 1
                  }}
                />
                {/* Countdown Layer - z-index: 2 */}
                {localSettings.countdownEnabled && localSettings.countdownEndDate && (
                  <div 
                    className="absolute inset-0 flex flex-col items-center pointer-events-none" 
                    style={{ 
                      paddingTop: `${localSettings.countdownVerticalPositionMobile}%`,
                      zIndex: 2
                    }}
                  >
                    <CountdownPreview 
                      endDate={localSettings.countdownEndDate}
                      text={localSettings.countdownText}
                      small
                    />
                  </div>
                )}
                {/* Login Form Layer - z-index: 3 */}
                <div 
                  className="absolute inset-0 flex flex-col items-center p-4"
                  style={{ 
                    zIndex: 3,
                    paddingTop: `${localSettings.loginBlockVerticalPositionMobile || 50}vh`
                  }}
                >
                  <div 
                    className="w-full space-y-2"
                    style={{
                      maxWidth: `${localSettings.loginBlockWidthMobile || 340}px`
                    }}
                  >
                    <div 
                      className="flex items-center gap-2 px-3 text-xs"
                      style={{
                        backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                        borderRadius: `${localSettings.cardBorderRadius}px`,
                        height: '36px',
                        color: '#000000'
                      }}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>E-Mail</span>
                    </div>
                    <div 
                      className="flex items-center gap-2 px-3 text-xs"
                      style={{
                        backgroundColor: `${localSettings.inputBgColor}${Math.round(localSettings.inputBgOpacity * 2.55).toString(16).padStart(2, '0')}`,
                        borderRadius: `${localSettings.cardBorderRadius}px`,
                        height: '36px',
                        color: '#000000'
                      }}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0, 0, 0, 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="truncate" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>Passwort</span>
                    </div>
                    <div 
                      className="w-full bg-primary text-primary-foreground text-xs font-medium text-center shadow-lg flex items-center justify-center"
                      style={{ 
                        borderRadius: `${localSettings.cardBorderRadius}px`,
                        height: '36px'
                      }}
                    >
                      Anmelden
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              className="w-full"
              size="lg"
            >
              Einstellungen speichern
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
