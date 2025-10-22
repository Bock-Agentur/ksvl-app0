import { useState } from "react";
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
      if (background.filename) {
        await supabase.storage
          .from('login-media')
          .remove([background.filename]);
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

      // Save to settings
      await setBackground({
        ...background,
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
      if (background.filename) {
        await supabase.storage
          .from('login-media')
          .remove([background.filename]);
      }

      // Reset to gradient
      await setBackground({
        type: 'gradient',
        url: null,
        filename: null,
        videoOnMobile: false,
        cardOpacity: 95
      });

      toast({
        title: "Hintergrund gelöscht",
        description: "Gradient ist jetzt aktiv"
      });
    } catch (error: any) {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTypeChange = async (type: 'gradient' | 'image' | 'video') => {
    if (type === 'gradient') {
      await handleDelete();
    } else {
      await setBackground({ ...background, type });
    }
  };

  const handleVideoOnMobileChange = async (checked: boolean) => {
    await setBackground({ ...background, videoOnMobile: checked });
    toast({
      title: "Einstellung gespeichert",
      description: `Video wird ${checked ? 'auch' : 'nicht'} auf Mobile abgespielt`
    });
  };

  const handleOpacityChange = async (value: number[]) => {
    await setBackground({ ...background, cardOpacity: value[0] });
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
                variant={background.type === 'gradient' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('gradient')}
                className="flex-1"
              >
                Gradient
              </Button>
              <Button
                variant={background.type === 'image' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('image')}
                className="flex-1"
              >
                Bild
              </Button>
              <Button
                variant={background.type === 'video' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('video')}
                className="flex-1"
              >
                Video
              </Button>
            </div>
          </div>

          {/* File Upload */}
          {background.type !== 'gradient' && (
            <div className="space-y-3">
              <Label htmlFor="file-upload">
                {background.type === 'video' ? 'Video hochladen' : 'Bild hochladen'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept={background.type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {background.url && (
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
                {background.type === 'video' 
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
          {background.type === 'video' && background.url && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="video-mobile"
                  checked={background.videoOnMobile}
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

          {/* Card Transparency Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Card-Transparenz</Label>
              <span className="text-sm text-muted-foreground">{background.cardOpacity}%</span>
            </div>
            <Slider
              value={[background.cardOpacity]}
              onValueChange={handleOpacityChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Transparent</span>
              <span>Undurchsichtig</span>
            </div>
            {background.cardOpacity < 80 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Bei niedriger Transparenz kann die Lesbarkeit beeinträchtigt sein
              </p>
            )}
          </div>

          {/* Preview */}
          {background.url && (
            <div className="space-y-2">
              <Label>Vorschau</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                {background.type === 'video' ? (
                  <video
                    src={background.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={background.url}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div 
                    className="bg-background rounded-lg p-6 shadow-lg backdrop-blur-sm"
                    style={{ opacity: background.cardOpacity / 100 }}
                  >
                    <p className="text-sm font-medium">Login-Card Vorschau</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
