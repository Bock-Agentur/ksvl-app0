import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Type } from "lucide-react";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useRole } from "@/hooks/use-role";

export function HeaderMessageSettings() {
  const { currentRole } = useRole();
  const { settings, saveSettings } = useDashboardSettings(currentRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Header-Nachricht
        </CardTitle>
        <CardDescription>
          Passen Sie die Headline in der Header-Card an
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Modus</Label>
          <Select
            value={settings.headlineMode}
            onValueChange={(value: "manual" | "automatic") => saveSettings({ headlineMode: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">Automatisch (basierend auf Tageszeit/Saison)</SelectItem>
              <SelectItem value="manual">Manuell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.headlineMode === "manual" && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Eigene Nachricht</Label>
              <Textarea
                placeholder="Where do you want to sail?"
                value={settings.customHeadline || ""}
                onChange={(e) => saveSettings({ customHeadline: e.target.value })}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tipp: Verwenden Sie Zeilenumbrüche für mehrzeilige Nachrichten
              </p>
            </div>
          </>
        )}

        {settings.headlineMode === "automatic" && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Automatische Nachrichten:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ändern sich nach Tageszeit (Morgen, Mittag, Abend, Nacht)</li>
              <li>• Passen sich der Jahreszeit an (Frühling, Sommer, Herbst, Winter)</li>
              <li>• Spezielle Nachrichten für Feiertage (Weihnachten, Ostern, etc.)</li>
              <li>• Lustige und motivierende Texte</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
