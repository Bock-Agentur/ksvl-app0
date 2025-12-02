/**
 * LoginBackgroundSettings Component (Orchestrator)
 * 
 * Refactored from ~1323 lines to ~200 lines.
 * Coordinates all login background settings through subcomponents.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSelectorDialog } from "@/components/file-manager";
import { supabase } from "@/integrations/supabase/client";
import type { LoginBackground } from "@/hooks";

// Subcomponents
import {
  BackgroundModeSelector,
  GradientEditor,
  MediaUploadCard,
  OverlaySettingsCard,
  LoginBlockPositionCard,
  CardStyleCard,
  CountdownSettingsCard,
  LoginPreviewCard,
  ActionButtons,
} from "./components";

// Hook
import { useLoginBackgroundForm } from "./hooks/use-login-background-form";

// Helper: Generate preview URL from storagePath or url
const getPreviewUrl = (settings: LoginBackground): string | null => {
  if (settings.url) {
    return settings.url;
  }
  if (settings.storagePath && settings.bucket) {
    const { data } = supabase.storage
      .from(settings.bucket)
      .getPublicUrl(settings.storagePath);
    return data.publicUrl;
  }
  return null;
};

// Legacy Media Selector Dialog
function LegacyMediaSelectorDialog({ 
  open, 
  onOpenChange, 
  onSelect 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSelect: (filename: string) => void;
}) {
  const [files, setFiles] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      supabase.storage.from('login-media').list()
        .then(({ data }) => {
          setFiles(data || []);
          setLoading(false);
        });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader>
          <CardTitle>Gespeicherte Dateien</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-muted-foreground">Lädt...</p>
          ) : files.length === 0 ? (
            <p className="text-muted-foreground">Keine Dateien gefunden</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => onSelect(file.name)}
                  className="p-2 border rounded hover:bg-muted text-left truncate text-sm"
                >
                  {file.name}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => onOpenChange(false)}
            className="mt-4 w-full p-2 border rounded hover:bg-muted"
          >
            Schließen
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoginBackgroundSettings() {
  const form = useLoginBackgroundForm();
  const previewUrl = getPreviewUrl(form.localSettings);
  const hasPreview = !!previewUrl;

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
          <BackgroundModeSelector
            type={form.localSettings.type}
            onChange={form.handleTypeChange}
          />

          {/* Gradient Editor */}
          {form.localSettings.type === 'gradient' && (
            <GradientEditor
              value={form.localSettings.url}
              onChange={(value) => form.setLocalSettings({ ...form.localSettings, url: value })}
            />
          )}

          {/* File Upload & File Manager */}
          {form.localSettings.type !== 'gradient' && (
            <MediaUploadCard
              localSettings={form.localSettings}
              uploading={form.uploading}
              previewUrl={previewUrl}
              onFileUpload={form.handleFileUpload}
              onOpenFileSelector={() => form.setFileSelectorOpen(true)}
              onOpenLegacySelector={() => form.setLegacyMediaSelectorOpen(true)}
            />
          )}

          {/* Overlay & Input Settings */}
          <OverlaySettingsCard
            localSettings={form.localSettings}
            isOverlayColorOpen={form.isOverlayColorOpen}
            isInputBgColorOpen={form.isInputBgColorOpen}
            setIsOverlayColorOpen={form.setIsOverlayColorOpen}
            setIsInputBgColorOpen={form.setIsInputBgColorOpen}
            onVideoOnMobileChange={form.handleVideoOnMobileChange}
            onMediaBlurChange={form.handleMediaBlurChange}
            onOverlayColorChange={form.handleOverlayColorChange}
            onOverlayOpacityChange={form.handleOverlayOpacityChange}
            onInputBgColorChange={form.handleInputBgColorChange}
            onInputBgOpacityChange={form.handleInputBgOpacityChange}
            hasPreview={hasPreview}
          />

          {/* Login Block Position */}
          <LoginBlockPositionCard
            localSettings={form.localSettings}
            onLoginBlockVerticalPositionDesktopChange={form.handleLoginBlockVerticalPositionDesktopChange}
            onLoginBlockVerticalPositionTabletChange={form.handleLoginBlockVerticalPositionTabletChange}
            onLoginBlockVerticalPositionMobileChange={form.handleLoginBlockVerticalPositionMobileChange}
            onLoginBlockWidthDesktopChange={form.handleLoginBlockWidthDesktopChange}
            onLoginBlockWidthTabletChange={form.handleLoginBlockWidthTabletChange}
            onLoginBlockWidthMobileChange={form.handleLoginBlockWidthMobileChange}
          />

          {/* Card Styling */}
          <CardStyleCard
            localSettings={form.localSettings}
            onBorderRadiusChange={form.handleBorderRadiusChange}
            onOpacityChange={form.handleOpacityChange}
            onBorderBlurChange={form.handleBorderBlurChange}
          />

          {/* Countdown Settings */}
          <CountdownSettingsCard
            localSettings={form.localSettings}
            onCountdownEnabledChange={form.handleCountdownEnabledChange}
            onCountdownEndDateChange={form.handleCountdownEndDateChange}
            onCountdownTextChange={form.handleCountdownTextChange}
            onCountdownShowDaysChange={form.handleCountdownShowDaysChange}
            onCountdownFontSizeChange={form.handleCountdownFontSizeChange}
            onCountdownFontWeightChange={form.handleCountdownFontWeightChange}
            onCountdownVerticalPositionDesktopChange={form.handleCountdownVerticalPositionDesktopChange}
            onCountdownVerticalPositionTabletChange={form.handleCountdownVerticalPositionTabletChange}
            onCountdownVerticalPositionMobileChange={form.handleCountdownVerticalPositionMobileChange}
          />

          {/* Preview */}
          <LoginPreviewCard
            localSettings={form.localSettings}
            previewUrl={previewUrl}
          />

          {/* Action Buttons */}
          <ActionButtons
            hasUnsavedChanges={form.hasUnsavedChanges}
            onSave={form.handleSave}
            onReset={form.handleResetToDefaults}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <FileSelectorDialog
        open={form.fileSelectorOpen}
        onOpenChange={form.setFileSelectorOpen}
        onSelect={form.handleSelectFromFileManager}
      />

      <LegacyMediaSelectorDialog
        open={form.legacyMediaSelectorOpen}
        onOpenChange={form.setLegacyMediaSelectorOpen}
        onSelect={form.handleSelectFromLegacyMedia}
      />
    </div>
  );
}
