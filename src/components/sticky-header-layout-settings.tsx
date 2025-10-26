import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { toast } from "sonner";

export function StickyHeaderLayoutSettings() {
  const { settings, setSettings, isLoading } = useStickyHeaderLayout();

  const handleToggle = (enabled: boolean) => {
    setSettings({ enabled });
    toast.success(
      enabled 
        ? "Fixierte Ansicht aktiviert" 
        : "Fixierte Ansicht deaktiviert"
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fixierte Ansicht</CardTitle>
          <CardDescription>Lädt...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
      <CardHeader>
        <CardTitle>Fixierte Ansicht</CardTitle>
        <CardDescription>
          Header-Cards bleiben oben fixiert, während der Content darunter scrollt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="sticky-header-enabled" className="text-base">
            Fixierte Ansicht aktivieren
          </Label>
          <Switch
            id="sticky-header-enabled"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
        
        {settings.enabled && (
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="mb-2">
              <strong>Aktiviert für:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kalender-Seite</li>
              <li>Slot Management</li>
              <li>Mitgliederverwaltung</li>
            </ul>
            <p className="mt-3">
              Die Header-Card bleibt oben fixiert, während der Content darunter scrollbar ist.
            </p>
          </div>
        )}
        
        {!settings.enabled && (
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p>
              Die Seiten nutzen das Standard-Scroll-Verhalten ohne fixierten Header.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
