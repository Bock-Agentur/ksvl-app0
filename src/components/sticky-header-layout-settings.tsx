import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { toast } from "sonner";

export function StickyHeaderLayoutSettings() {
  const { settings, setSettings, togglePage, isLoading } = useStickyHeaderLayout();

  const handleToggle = (enabled: boolean) => {
    setSettings({ 
      enabled,
      pages: settings.pages 
    });
    toast.success(
      enabled 
        ? "Fixierte Ansicht global aktiviert" 
        : "Fixierte Ansicht global deaktiviert"
    );
  };

  const handlePageToggle = (page: keyof typeof settings.pages, enabled: boolean) => {
    const pageNames = {
      calendar: 'Kalender',
      slotManagement: 'Slot Management',
      userManagement: 'Mitgliederverwaltung'
    };
    
    togglePage(page, enabled);
    toast.success(
      `${pageNames[page]}: Fixierung ${enabled ? 'aktiviert' : 'deaktiviert'}`
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
        {/* Master-Schalter */}
        <div className="flex items-center justify-between">
          <Label htmlFor="sticky-header-enabled" className="text-base">
            Fixierte Ansicht global aktivieren
          </Label>
          <Switch
            id="sticky-header-enabled"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {/* Pro-Seite Einstellungen (nur wenn Master aktiviert) */}
        {settings.enabled && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">
              Fixierung pro Seite aktivieren:
            </Label>
            
            {/* Kalender */}
            <div className="flex items-center justify-between">
              <Label htmlFor="sticky-calendar" className="text-sm font-normal">
                📅 Kalender-Seite
              </Label>
              <Switch
                id="sticky-calendar"
                checked={settings.pages.calendar}
                onCheckedChange={(checked) => handlePageToggle('calendar', checked)}
              />
            </div>

            {/* Slot Management */}
            <div className="flex items-center justify-between">
              <Label htmlFor="sticky-slots" className="text-sm font-normal">
                🎯 Slot Management
              </Label>
              <Switch
                id="sticky-slots"
                checked={settings.pages.slotManagement}
                onCheckedChange={(checked) => handlePageToggle('slotManagement', checked)}
              />
            </div>

            {/* Mitgliederverwaltung */}
            <div className="flex items-center justify-between">
              <Label htmlFor="sticky-users" className="text-sm font-normal">
                👥 Mitgliederverwaltung
              </Label>
              <Switch
                id="sticky-users"
                checked={settings.pages.userManagement}
                onCheckedChange={(checked) => handlePageToggle('userManagement', checked)}
              />
            </div>
          </div>
        )}

        {/* Info-Box */}
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          {settings.enabled ? (
            <>
              <p className="mb-2">
                <strong>Aktivierte Seiten:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                {settings.pages.calendar && <li>📅 Kalender-Seite</li>}
                {settings.pages.slotManagement && <li>🎯 Slot Management</li>}
                {settings.pages.userManagement && <li>👥 Mitgliederverwaltung</li>}
              </ul>
              <p className="mt-3">
                Die Header-Card bleibt auf den aktivierten Seiten oben fixiert.
              </p>
            </>
          ) : (
            <p>
              Die Seiten nutzen das Standard-Scroll-Verhalten ohne fixierten Header.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
