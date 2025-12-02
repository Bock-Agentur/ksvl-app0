/**
 * MediaUploadCard Component
 * 
 * Handles file upload and file manager selection for login background media.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Eye, FolderOpen } from "lucide-react";
import type { LoginBackground } from "@/hooks";

interface MediaUploadCardProps {
  localSettings: LoginBackground;
  uploading: boolean;
  previewUrl: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFileSelector: () => void;
  onOpenLegacySelector: () => void;
}

export function MediaUploadCard({
  localSettings,
  uploading,
  previewUrl,
  onFileUpload,
  onOpenFileSelector,
  onOpenLegacySelector,
}: MediaUploadCardProps) {
  return (
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
            onChange={onFileUpload}
            disabled={uploading}
            className="flex-1"
          />
          {previewUrl && (
            <div className="relative w-20 h-20 rounded border overflow-hidden flex-shrink-0">
              {localSettings.type === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={previewUrl}
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
          onClick={onOpenLegacySelector}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Gespeicherte Dateien durchsuchen
        </Button>
        {localSettings.filename && previewUrl && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Ausgewählte Datei:</p>
            <p className="text-xs text-muted-foreground truncate mt-1">{localSettings.filename}</p>
            <div className="relative w-full h-40 rounded border overflow-hidden mt-2">
              {localSettings.type === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Vorschau"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="file-manager" className="mt-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onOpenFileSelector}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Aus Dateimanager auswählen
        </Button>
        {localSettings.filename && previewUrl && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Ausgewählte Datei:</p>
            <p className="text-xs text-muted-foreground truncate mt-1">{localSettings.filename}</p>
            <div className="relative w-full h-40 rounded border overflow-hidden mt-2">
              {localSettings.type === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Vorschau"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
