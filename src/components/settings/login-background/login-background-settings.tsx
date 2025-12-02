/**
 * LoginBackgroundSettings Component (Orchestrator)
 * 
 * Simplified version - removed preview, card styling, and legacy media selector.
 */

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
  CountdownSettingsCard,
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

          {/* Action Buttons */}
          <ActionButtons
            hasUnsavedChanges={form.hasUnsavedChanges}
            onSave={form.handleSave}
            onReset={form.handleResetToDefaults}
          />
        </CardContent>
      </Card>

      {/* File Selector Dialog */}
      <FileSelectorDialog
        open={form.fileSelectorOpen}
        onOpenChange={form.setFileSelectorOpen}
        onSelect={form.handleSelectFromFileManager}
      />
    </div>
  );
}
