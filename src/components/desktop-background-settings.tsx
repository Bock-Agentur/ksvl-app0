import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDesktopBackground } from "@/hooks/use-desktop-background";
import { toast } from "sonner";

export function DesktopBackgroundSettings() {
  const { settings, setSettings, isLoading } = useDesktopBackground();

  const handleToggle = (enabled: boolean) => {
    setSettings({ enabled });
    toast.success(
      enabled 
        ? "Desktop-Hintergrund aktiviert" 
        : "Desktop-Hintergrund deaktiviert"
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desktop-Hintergrund</CardTitle>
          <CardDescription>Lädt...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader>
        <CardTitle>Desktop-Hintergrund</CardTitle>
        <CardDescription>
          Verwenden Sie das Login-Hintergrundbild auch auf den Desktop-Seiten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="desktop-background-enabled" className="text-base">
            Desktop-Hintergrund aktivieren
          </Label>
          <Switch
            id="desktop-background-enabled"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
        
        {settings.enabled && (
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p>
              Das in den Login-Seiten-Einstellungen konfigurierte Hintergrundbild 
              wird nun auch auf allen Desktop-Seiten (Dashboard, Kalender, etc.) angezeigt.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
