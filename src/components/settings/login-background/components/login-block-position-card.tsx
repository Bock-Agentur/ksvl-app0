/**
 * LoginBlockPositionCard Component
 * 
 * Controls for login block vertical position and width across different devices.
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LoginBackground } from "@/hooks";

interface LoginBlockPositionCardProps {
  localSettings: LoginBackground;
  onLoginBlockVerticalPositionDesktopChange: (value: number[]) => void;
  onLoginBlockVerticalPositionTabletChange: (value: number[]) => void;
  onLoginBlockVerticalPositionMobileChange: (value: number[]) => void;
  onLoginBlockWidthDesktopChange: (value: number[]) => void;
  onLoginBlockWidthTabletChange: (value: number[]) => void;
  onLoginBlockWidthMobileChange: (value: number[]) => void;
}

export function LoginBlockPositionCard({
  localSettings,
  onLoginBlockVerticalPositionDesktopChange,
  onLoginBlockVerticalPositionTabletChange,
  onLoginBlockVerticalPositionMobileChange,
  onLoginBlockWidthDesktopChange,
  onLoginBlockWidthTabletChange,
  onLoginBlockWidthMobileChange,
}: LoginBlockPositionCardProps) {
  return (
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
              onValueChange={onLoginBlockVerticalPositionDesktopChange}
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
              onValueChange={onLoginBlockWidthDesktopChange}
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
              onValueChange={onLoginBlockVerticalPositionTabletChange}
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
              onValueChange={onLoginBlockWidthTabletChange}
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
              onValueChange={onLoginBlockVerticalPositionMobileChange}
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
              onValueChange={onLoginBlockWidthMobileChange}
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
  );
}
