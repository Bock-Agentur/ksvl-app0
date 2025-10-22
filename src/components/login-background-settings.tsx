import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLoginBackground } from "@/hooks/use-login-background";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function LoginBackgroundSettings() {
  const { background, setBackground } = useLoginBackground();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Local state for preview
  const [localSettings, setLocalSettings] = useState(background);

  // Update local state when background changes from server
  useState(() => {
    setLocalSettings(background);
  });

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

      // Update local settings
      setLocalSettings({
        ...localSettings,
        type: isVideo ? 'video' : 'image',
        url: publicUrl,
        filename: fileName
      });

      toast({
        title: "Erfolgreich hochgeladen",
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
      setLocalSettings({
        type: 'gradient',
        url: null,
        filename: null,
        videoOnMobile: false,
        cardOpacity: 95,
        cardBorderBlur: 8,
        cardBorderRadius: 8,
        overlayColor: '#000000',
        overlayOpacity: 40,
        mediaBlur: 0
      });

      toast({
        title: "Hintergrund gelöscht",
        description: "Änderungen noch nicht gespeichert"
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
              <div className="flex gap-4 items-start">
                <HexColorPicker 
                  color={localSettings.overlayColor} 
                  onChange={handleOverlayColorChange}
                  style={{ width: '200px', height: '150px' }}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded border-2 border-border"
                      style={{ backgroundColor: localSettings.overlayColor }}
                    />
                    <Input
                      type="text"
                      value={localSettings.overlayColor}
                      onChange={(e) => handleOverlayColorChange(e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Farbe des Overlays über Bild/Video
                  </p>
                </div>
              </div>
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

          {/* Preview */}
          {localSettings.url && (
            <div className="space-y-2">
              <Label>Vorschau</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden border">
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
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4"
                  style={{ 
                    backgroundColor: `${localSettings.overlayColor}${Math.round((localSettings.overlayOpacity / 100) * 255).toString(16).padStart(2, '0')}`
                  }}
                >
                  {/* Login Fields Preview */}
                  <div className="w-full max-w-xs space-y-3">
                    {/* Email Input */}
                    <div 
                      className="relative overflow-hidden transition-all duration-300"
                      style={{ 
                        borderRadius: `${localSettings.cardBorderRadius}px`
                      }}
                    >
                      <div 
                        className="absolute inset-0 -z-10"
                        style={{
                          backgroundColor: `hsl(var(--background) / ${localSettings.cardOpacity / 100})`,
                          backdropFilter: `blur(${localSettings.cardBorderBlur}px)`,
                          WebkitBackdropFilter: `blur(${localSettings.cardBorderBlur}px)`,
                        }}
                      />
                      <div className="relative flex items-center gap-2 px-3 py-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-muted-foreground">E-Mail oder Benutzername</span>
                      </div>
                    </div>

                    {/* Password Input */}
                    <div 
                      className="relative overflow-hidden transition-all duration-300"
                      style={{ 
                        borderRadius: `${localSettings.cardBorderRadius}px`
                      }}
                    >
                      <div 
                        className="absolute inset-0 -z-10"
                        style={{
                          backgroundColor: `hsl(var(--background) / ${localSettings.cardOpacity / 100})`,
                          backdropFilter: `blur(${localSettings.cardBorderBlur}px)`,
                          WebkitBackdropFilter: `blur(${localSettings.cardBorderBlur}px)`,
                        }}
                      />
                      <div className="relative flex items-center gap-2 px-3 py-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xs text-muted-foreground">Passwort</span>
                      </div>
                    </div>

                    {/* Login Button */}
                    <div 
                      className="w-full bg-primary text-primary-foreground text-xs font-medium py-2 px-4 text-center shadow-lg"
                      style={{ borderRadius: `${localSettings.cardBorderRadius}px` }}
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
