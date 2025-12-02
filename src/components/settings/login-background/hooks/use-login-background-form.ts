/**
 * useLoginBackgroundForm Hook
 * 
 * Manages all form state and handlers for login background settings.
 * Simplified version - removed card styling and legacy media handlers.
 */

import { useState, useEffect } from "react";
import { useToast, useLoginBackground } from "@/hooks";
import type { LoginBackground } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function useLoginBackgroundForm() {
  const { background, setBackground } = useLoginBackground();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localSettings, setLocalSettings] = useState(background);
  const [isOverlayColorOpen, setIsOverlayColorOpen] = useState(false);
  const [isInputBgColorOpen, setIsInputBgColorOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);

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
      if (localSettings.filename) {
        await supabase.storage.from('login-media').remove([localSettings.filename]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `background-${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('login-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('login-media').getPublicUrl(data.path);
      const newSettings = {
        ...localSettings,
        type: (isVideo ? 'video' : 'image') as 'video' | 'image',
        bucket: 'login-media' as const,
        storagePath: data.path,
        url: urlData.publicUrl,
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

  // Simple handlers
  const handleTypeChange = (type: 'gradient' | 'image' | 'video') => {
    setLocalSettings({ ...localSettings, type });
  };

  const handleVideoOnMobileChange = (checked: boolean) => {
    setLocalSettings({ ...localSettings, videoOnMobile: checked });
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

  const handleSelectFromFileManager = async (file: any) => {
    const isVideo = file.mime_type?.startsWith('video/');
    
    // Files from file manager are in 'documents' bucket (private)
    // For login backgrounds, we need public access, so copy to 'login-media' bucket
    try {
      // Download the file from documents bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(file.storage_path);
      
      if (downloadError || !fileData) {
        toast({
          title: "Fehler beim Laden",
          description: "Die Datei konnte nicht geladen werden.",
          variant: "destructive"
        });
        return;
      }
      
      // Upload to login-media bucket (public)
      const newFileName = `background-${Date.now()}-${file.filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('login-media')
        .upload(newFileName, fileData, {
          contentType: file.mime_type,
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        toast({
          title: "Fehler beim Kopieren",
          description: "Die Datei konnte nicht in den öffentlichen Bereich kopiert werden.",
          variant: "destructive"
        });
        return;
      }
      
      const newSettings = {
        ...localSettings,
        type: isVideo ? 'video' as const : 'image' as const,
        bucket: 'login-media' as const,
        storagePath: uploadData.path,
        filename: newFileName,
        url: null
      };
      setLocalSettings(newSettings);
      setFileSelectorOpen(false);
      toast({
        title: "Datei ausgewählt",
        description: `${file.filename} wurde in den öffentlichen Bereich kopiert. Klicke auf "Speichern" um die Änderungen zu übernehmen.`
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    }
  };

  return {
    // State
    localSettings,
    setLocalSettings,
    uploading,
    uploadProgress,
    hasUnsavedChanges,
    isOverlayColorOpen,
    setIsOverlayColorOpen,
    isInputBgColorOpen,
    setIsInputBgColorOpen,
    fileSelectorOpen,
    setFileSelectorOpen,
    
    // Handlers
    handleFileUpload,
    handleResetToDefaults,
    handleSave,
    handleTypeChange,
    handleVideoOnMobileChange,
    handleOverlayColorChange,
    handleOverlayOpacityChange,
    handleMediaBlurChange,
    handleInputBgColorChange,
    handleInputBgOpacityChange,
    handleLoginBlockVerticalPositionDesktopChange,
    handleLoginBlockVerticalPositionTabletChange,
    handleLoginBlockVerticalPositionMobileChange,
    handleCountdownEnabledChange,
    handleCountdownEndDateChange,
    handleCountdownTextChange,
    handleCountdownVerticalPositionDesktopChange,
    handleCountdownVerticalPositionTabletChange,
    handleCountdownVerticalPositionMobileChange,
    handleLoginBlockWidthDesktopChange,
    handleLoginBlockWidthTabletChange,
    handleLoginBlockWidthMobileChange,
    handleCountdownShowDaysChange,
    handleCountdownFontSizeChange,
    handleCountdownFontWeightChange,
    handleSelectFromFileManager,
  };
}
