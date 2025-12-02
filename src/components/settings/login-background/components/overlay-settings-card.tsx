/**
 * OverlaySettingsCard Component
 * 
 * Controls for overlay color, opacity, blur, and input field styling.
 */

import { HexColorPicker } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LoginBackground } from "@/hooks";

interface OverlaySettingsCardProps {
  localSettings: LoginBackground;
  isOverlayColorOpen: boolean;
  isInputBgColorOpen: boolean;
  setIsOverlayColorOpen: (open: boolean) => void;
  setIsInputBgColorOpen: (open: boolean) => void;
  onVideoOnMobileChange: (checked: boolean) => void;
  onMediaBlurChange: (value: number[]) => void;
  onOverlayColorChange: (color: string) => void;
  onOverlayOpacityChange: (value: number[]) => void;
  onInputBgColorChange: (color: string) => void;
  onInputBgOpacityChange: (value: number[]) => void;
  hasPreview: boolean;
}

export function OverlaySettingsCard({
  localSettings,
  isOverlayColorOpen,
  isInputBgColorOpen,
  setIsOverlayColorOpen,
  setIsInputBgColorOpen,
  onVideoOnMobileChange,
  onMediaBlurChange,
  onOverlayColorChange,
  onOverlayOpacityChange,
  onInputBgColorChange,
  onInputBgOpacityChange,
  hasPreview,
}: OverlaySettingsCardProps) {
  return (
    <div className="space-y-6">
      {/* Video on Mobile Option */}
      {localSettings.type === 'video' && hasPreview && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="video-mobile"
              checked={localSettings.videoOnMobile}
              onCheckedChange={onVideoOnMobileChange}
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
      {hasPreview && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Hintergrund-Weichzeichnung</Label>
            <span className="text-sm text-muted-foreground">{localSettings.mediaBlur}px</span>
          </div>
          <Slider
            value={[localSettings.mediaBlur]}
            onValueChange={onMediaBlurChange}
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
      {hasPreview && (
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
                onChange={onOverlayColorChange}
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
      {hasPreview && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Overlay-Transparenz</Label>
            <span className="text-sm text-muted-foreground">{localSettings.overlayOpacity}%</span>
          </div>
          <Slider
            value={[localSettings.overlayOpacity]}
            onValueChange={onOverlayOpacityChange}
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
              onChange={onInputBgColorChange}
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
          onValueChange={onInputBgOpacityChange}
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
    </div>
  );
}
