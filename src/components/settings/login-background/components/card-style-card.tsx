/**
 * CardStyleCard Component
 * 
 * Controls for card border radius and opacity styling.
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { LoginBackground } from "@/hooks";

interface CardStyleCardProps {
  localSettings: LoginBackground;
  onBorderRadiusChange: (value: number[]) => void;
  onOpacityChange: (value: number[]) => void;
  onBorderBlurChange: (value: number[]) => void;
}

export function CardStyleCard({
  localSettings,
  onBorderRadiusChange,
  onOpacityChange,
  onBorderBlurChange,
}: CardStyleCardProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <Label className="text-base font-semibold">Card-Styling</Label>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Border Radius</Label>
          <span className="text-sm text-muted-foreground">{localSettings.cardBorderRadius}px</span>
        </div>
        <Slider
          value={[localSettings.cardBorderRadius]}
          onValueChange={onBorderRadiusChange}
          min={0}
          max={32}
          step={2}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Eckig</span>
          <span>Rund</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Card Transparenz</Label>
          <span className="text-sm text-muted-foreground">{localSettings.cardOpacity}%</span>
        </div>
        <Slider
          value={[localSettings.cardOpacity]}
          onValueChange={onOpacityChange}
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

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Card Border Blur</Label>
          <span className="text-sm text-muted-foreground">{localSettings.cardBorderBlur}px</span>
        </div>
        <Slider
          value={[localSettings.cardBorderBlur]}
          onValueChange={onBorderBlurChange}
          min={0}
          max={20}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Scharf</span>
          <span>Weich</span>
        </div>
      </div>
    </div>
  );
}
