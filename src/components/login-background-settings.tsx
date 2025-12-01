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
import { useToast, useLoginBackground, useFileManager } from "@/hooks";
import type { LoginBackground } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Eye, Maximize2, FolderOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileSelectorDialog } from "@/components/file-manager/file-selector-dialog";
import { Badge } from "@/components/ui/badge";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function CountdownPreview({ endDate, text, small, showDays, fontSize, fontWeight }: { endDate: string | null; text: string; small?: boolean; showDays?: boolean; fontSize?: number; fontWeight?: number }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, tenths: 0, hundredths: 0 });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const ms = difference % 1000;
        const totalHours = Math.floor(difference / (1000 * 60 * 60));
        const hours = showDays !== false 
          ? Math.floor((difference / (1000 * 60 * 60)) % 24)
          : totalHours;
        
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours,
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
  }, [endDate, showDays]);

  if (!endDate) return null;

  const baseFontSize = fontSize || (small ? 24 : 48);
  const textSize = `${baseFontSize}px`;
  const labelSize = small ? 'text-[8px]' : 'text-[10px]';
  const weight = fontWeight || 100;
  const actualShowDays = showDays !== false;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex justify-center items-start gap-0.5">
        {actualShowDays && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>{String(timeLeft.days).padStart(2, '0')}</span>
              <span className={`${labelSize} text-white/70 mt-0.5`}>Tage</span>
            </div>
            <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>Stunden</span>
        </div>
        <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>Minuten</span>
        </div>
        <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>Sekunden</span>
        </div>
        <span className="text-white" style={{ fontSize: textSize, fontWeight: weight }}>:</span>
        <div className="flex flex-col items-center">
          <span className="text-white tabular-nums" style={{ fontSize: textSize, fontWeight: weight }}>{String(timeLeft.tenths)}{String(timeLeft.hundredths)}</span>
          <span className={`${labelSize} text-white/70 mt-0.5`}>1/100</span>
        </div>
      </div>
      {text && (
        <p className={`text-white/90 ${small ? 'text-[10px]' : 'text-sm'} mt-2`}>{text}</p>
      )}
    </div>
  );
}

// Helper: Generate preview URL from storagePath or url
const getPreviewUrl = (settings: LoginBackground): string | null => {
  // If url exists (for preview during upload), use it
  if (settings.url) {
    return settings.url;
  }
  
  // If storagePath and bucket exist, generate URL
  if (settings.storagePath && settings.bucket) {
    const { data } = supabase.storage
      .from(settings.bucket)
      .getPublicUrl(settings.storagePath);
    return data.publicUrl;
  }
  
  return null;
};

export function LoginBackgroundSettings() {
  const { background, setBackground } = useLoginBackground();
  const { toast } = useToast();
  const { getFilePreviewUrl } = useFileManager();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Local state for preview
  const [localSettings, setLocalSettings] = useState(background);
  
  const [isOverlayColorOpen, setIsOverlayColorOpen] = useState(false);
  const [isInputBgColorOpen, setIsInputBgColorOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);
  const [legacyMediaSelectorOpen, setLegacyMediaSelectorOpen] = useState(false);

  // Update local state when background changes from server
  useEffect(() => {
    setLocalSettings(background);
  }, [background]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(background);
    setHasUnsavedChanges(hasChanges);
  }, [localSettings, background]);

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
      
      const { data, error: uploadError } = await supabase.storage
        .from('login-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Update local settings with bucket and storage path
      const { data: urlData } = supabase.storage.from('login-media').getPublicUrl(data.path);
      const newSettings = {
        ...localSettings,
        type: (isVideo ? 'video' : 'image') as 'video' | 'image',
        bucket: 'login-media' as const,
        storagePath: data.path,
        url: urlData.publicUrl, // Temporary for preview
        filename: fileName
      };
      setLocalSettings(newSettings);

      toast({
        title: "Erfolgreich hochgeladen",
        description: `Bild wurde hochgeladen. Klicke auf "Speichern" um die Änderungen zu übernehmen.`
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

  const handleResetToDefaults = async () => {
    // Reset to gradient without deleting files from storage
    const newSettings = {
      ...localSettings,
      type: 'gradient' as const,
      url: null,
      filename: null
    };
    setLocalSettings(newSettings);

    toast({
      title: "Auf Standard zurückgesetzt",
      description: "Klicke auf 'Speichern' um die Änderungen zu übernehmen."
    });
  };

  const handleSave = async () => {
    try {
      // Save with url set to null (only storagePath is persisted)
      await setBackground({ ...localSettings, url: null });
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
    // Just change the type without resetting other settings
    setLocalSettings({ ...localSettings, type });
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

  const handleCountdownShowDaysChange = (checked: boolean) => {
    setLocalSettings({ ...localSettings, countdownShowDays: checked });
  };

  const handleCountdownFontSizeChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, countdownFontSize: value[0] });
  };

  const handleCountdownFontWeightChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, countdownFontWeight: value[0] });
  };


  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
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

          {/* Gradient Editor */}
          {localSettings.type === 'gradient' && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Label>Gradient CSS</Label>
              <Input
                value={localSettings.url || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'}
                onChange={(e) => setLocalSettings({ ...localSettings, url: e.target.value })}
                placeholder="z.B. linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Gib einen CSS-Gradient ein. Beispiele: 
                linear-gradient(135deg, #667eea, #764ba2) oder 
                radial-gradient(circle, #ff6b6b, #4ecdc4)
              </p>
              <div 
                className="w-full h-20 rounded border"
                style={{ background: localSettings.url || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              />
            </div>
          )}

          {/* File Upload & File Manager */}
          {localSettings.type !== 'gradient' && (
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Hochladen</TabsTrigger>
                <TabsTrigger value="manager">Gespeichert</TabsTrigger>
                <TabsTrigger value="file-manager">Dateimanager</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-3 mt-4">
                <Label htmlFor="file-upload">
                  {localSettings.type === 'video' ? 'Video hochladen' : 'Bild hochladen'}
                </Label>
                <div className="flex gap-2 items-start">
                  <Input
                    key={localSettings.filename || 'empty'}
                    id="file-upload"
                    type="file"
                    accept={localSettings.type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {getPreviewUrl(localSettings) && (
                    <div className="relative w-20 h-20 rounded border overflow-hidden flex-shrink-0">
                      {localSettings.type === 'video' ? (
                        <video
                          src={getPreviewUrl(localSettings)!}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={getPreviewUrl(localSettings)!}
                          alt="Vorschau"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                {localSettings.filename && (
                  <p className="text-xs text-muted-foreground truncate">
                    Aktuelle Datei: {localSettings.filename}
                  </p>
                )}
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
              </TabsContent>
              
              <TabsContent value="manager" className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLegacyMediaSelectorOpen(true)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Gespeicherte Dateien durchsuchen
                </Button>
                {localSettings.filename && (
                  <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Ausgewählte Datei:</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{localSettings.filename}</p>
                    {getPreviewUrl(localSettings) && (
                      <div className="relative w-full h-40 rounded border overflow-hidden mt-2">
                        {localSettings.type === 'video' ? (
                          <video
                            src={getPreviewUrl(localSettings)!}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <img
                            src={getPreviewUrl(localSettings)!}
                            alt="Vorschau"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="file-manager" className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFileSelectorOpen(true)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Aus Dateimanager auswählen
                </Button>
                {localSettings.filename && (
                  <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Ausgewählte Datei:</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{localSettings.filename}</p>
                    {getPreviewUrl(localSettings) && (
                      <div className="relative w-full h-40 rounded border overflow-hidden mt-2">
                        {localSettings.type === 'video' ? (
                          <video
                            src={getPreviewUrl(localSettings)!}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <img
                            src={getPreviewUrl(localSettings)!}
                            alt="Vorschau"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Video on Mobile Option */}
          {localSettings.type === 'video' && getPreviewUrl(localSettings) && (
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
          {getPreviewUrl(localSettings) && (
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
          {getPreviewUrl(localSettings) && (
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
          {getPreviewUrl(localSettings) && (
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="countdown-show-days">Tage anzeigen</Label>
                  <Switch
                    id="countdown-show-days"
                    checked={localSettings.countdownShowDays !== false}
                    onCheckedChange={handleCountdownShowDaysChange}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Schriftgröße</Label>
                    <span className="text-sm text-muted-foreground">{localSettings.countdownFontSize || 48}px</span>
                  </div>
                  <Slider
                    value={[localSettings.countdownFontSize || 48]}
                    onValueChange={handleCountdownFontSizeChange}
                    min={24}
                    max={120}
                    step={4}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Klein</span>
                    <span>Groß</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Schriftdicke</Label>
                    <span className="text-sm text-muted-foreground">{localSettings.countdownFontWeight || 100}</span>
                  </div>
                  <Slider
                    value={[localSettings.countdownFontWeight || 100]}
                    onValueChange={handleCountdownFontWeightChange}
                    min={100}
                    max={900}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Dünn (100)</span>
                    <span>Fett (900)</span>
                  </div>
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
          {getPreviewUrl(localSettings) && (
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
                        src={getPreviewUrl(localSettings)!}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          style={{ filter: `blur(${localSettings.mediaBlur}px)` }}
                        />
                      ) : (
                        <img
                        src={getPreviewUrl(localSettings)!}
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
                          className="absolute inset-0 flex flex-col items-center"
                          style={{ 
                            paddingTop: `${localSettings.countdownVerticalPositionDesktop}%`,
                            zIndex: 2
                          }}
                        >
                          <CountdownPreview 
                            endDate={localSettings.countdownEndDate}
                            text={localSettings.countdownText}
                            showDays={localSettings.countdownShowDays}
                            fontSize={localSettings.countdownFontSize}
                            fontWeight={localSettings.countdownFontWeight}
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
                    className="absolute inset-0 flex flex-col items-center"
                    style={{ 
                      paddingTop: `${localSettings.countdownVerticalPositionMobile}%`,
                      zIndex: 2
                    }}
                  >
                    <CountdownPreview 
                      endDate={localSettings.countdownEndDate}
                      text={localSettings.countdownText}
                      small
                      showDays={localSettings.countdownShowDays}
                      fontSize={localSettings.countdownFontSize}
                      fontWeight={localSettings.countdownFontWeight}
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

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-3">
            <Button 
              onClick={handleSave} 
              className="w-full relative"
              size="lg"
              disabled={!hasUnsavedChanges}
            >
              Einstellungen speichern
              {hasUnsavedChanges && (
                <Badge className="absolute -top-1 -right-1 h-3 min-w-3 p-0 flex items-center justify-center animate-pulse bg-destructive">
                  <span className="sr-only">Ungespeicherte Änderungen</span>
                </Badge>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Auf Standard zurücksetzen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Auf Standard zurücksetzen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dies setzt den Login-Screen auf den Standard-Gradient zurück. Gespeicherte Dateien im Dateimanager bleiben erhalten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToDefaults}>
                    Zurücksetzen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* File Selector Dialog */}
      {/* File Selector Dialogs */}
      <FileSelectorDialog
        open={fileSelectorOpen}
        onOpenChange={setFileSelectorOpen}
        onSelect={(file) => {
          console.log('📁 File selected from File Manager:', file);
          
          // All File Manager files are in documents bucket
          const bucket = 'documents';
          
          // Generate preview URL
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.storage_path);
          console.log('🔗 Generated preview URL:', urlData.publicUrl);
          
          setLocalSettings({
            ...localSettings,
            type: file.file_type === 'video' ? 'video' : 'image',
            bucket: bucket,
            storagePath: file.storage_path,
            url: urlData.publicUrl, // Temporary for preview
            filename: file.filename
          });
          setFileSelectorOpen(false);
          toast({
            title: "Datei ausgewählt",
            description: `${file.filename} wurde ausgewählt. Klicke auf "Speichern" um die Änderungen zu übernehmen.`
          });
        }}
        title="Login-Hintergrund auswählen"
        description="Wählen Sie ein Bild oder Video aus dem Dateimanager"
        filters={{
          file_type: localSettings.type === 'video' ? 'video' : 'image',
        }}
      />
      
      <FileSelectorDialog
        open={legacyMediaSelectorOpen}
        onOpenChange={setLegacyMediaSelectorOpen}
        onSelect={(file) => {
          console.log('📁 File selected from Legacy Media:', file);
          
          // All File Manager files are in documents bucket
          const bucket = 'documents';
          
          // Generate preview URL
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.storage_path);
          console.log('🔗 Generated preview URL:', urlData.publicUrl);
          
          setLocalSettings({
            ...localSettings,
            type: file.file_type === 'video' ? 'video' : 'image',
            bucket: bucket,
            storagePath: file.storage_path,
            url: urlData.publicUrl, // Temporary for preview
            filename: file.filename
          });
          setLegacyMediaSelectorOpen(false);
          toast({
            title: "Datei ausgewählt",
            description: `${file.filename} wurde ausgewählt. Klicke auf "Speichern" um die Änderungen zu übernehmen.`
          });
        }}
        title="Gespeicherte Dateien durchsuchen"
        description="Wähle eine Datei aus dem Dateimanager"
        filters={{
          file_type: localSettings.type === 'video' ? 'video' : 'image',
        }}
      />
    </div>
  );
}
