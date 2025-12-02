/**
 * CountdownSettingsCard Component
 * 
 * Controls for countdown timer configuration.
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { LoginBackground } from "@/hooks";

interface CountdownSettingsCardProps {
  localSettings: LoginBackground;
  onCountdownEnabledChange: (checked: boolean) => void;
  onCountdownEndDateChange: (date: string) => void;
  onCountdownTextChange: (text: string) => void;
  onCountdownShowDaysChange: (checked: boolean) => void;
  onCountdownFontSizeChange: (value: number[]) => void;
  onCountdownFontWeightChange: (value: number[]) => void;
  onCountdownVerticalPositionDesktopChange: (value: number[]) => void;
  onCountdownVerticalPositionTabletChange: (value: number[]) => void;
  onCountdownVerticalPositionMobileChange: (value: number[]) => void;
}

export function CountdownSettingsCard({
  localSettings,
  onCountdownEnabledChange,
  onCountdownEndDateChange,
  onCountdownTextChange,
  onCountdownShowDaysChange,
  onCountdownFontSizeChange,
  onCountdownFontWeightChange,
  onCountdownVerticalPositionDesktopChange,
  onCountdownVerticalPositionTabletChange,
  onCountdownVerticalPositionMobileChange,
}: CountdownSettingsCardProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Countdown</Label>
        <Switch
          checked={localSettings.countdownEnabled}
          onCheckedChange={onCountdownEnabledChange}
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
              onChange={(e) => onCountdownEndDateChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countdown-text">Text unter dem Countdown</Label>
            <Input
              id="countdown-text"
              value={localSettings.countdownText}
              onChange={(e) => onCountdownTextChange(e.target.value)}
              placeholder="z.B. bis zum Saisonstart"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="countdown-show-days">Tage anzeigen</Label>
            <Switch
              id="countdown-show-days"
              checked={localSettings.countdownShowDays !== false}
              onCheckedChange={onCountdownShowDaysChange}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Schriftgröße</Label>
              <span className="text-sm text-muted-foreground">{localSettings.countdownFontSize || 48}px</span>
            </div>
            <Slider
              value={[localSettings.countdownFontSize || 48]}
              onValueChange={onCountdownFontSizeChange}
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
              onValueChange={onCountdownFontWeightChange}
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
              onValueChange={onCountdownVerticalPositionDesktopChange}
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
              onValueChange={onCountdownVerticalPositionTabletChange}
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
              onValueChange={onCountdownVerticalPositionMobileChange}
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
  );
}
