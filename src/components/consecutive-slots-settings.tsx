import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Settings, Eye, EyeOff } from "lucide-react";
import { useConsecutiveSlots } from "@/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks";

export function ConsecutiveSlotsSettings() {
  const { consecutiveSlotsEnabled, setConsecutiveSlotsEnabled } = useConsecutiveSlots();
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
    <Card className={cn(
      isMobile ? "rounded-none border-x-0" : "bg-white rounded-[2rem] card-shadow-soft border-0"
    )}>
      <CardHeader className={isMobile ? "px-4 py-3" : ""}>
        <CardTitle className={cn(
          "flex items-center gap-2 font-bold",
          isMobile ? "text-lg" : "text-2xl"
        )}>
          <Settings className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
          System-Einstellungen
        </CardTitle>
        {!isMobile && (
          <CardDescription>
            Systemweite Konfiguration für Slot-Buchungen und Betriebsverhalten
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(
        "space-y-6",
        isMobile && "px-4 pb-4"
      )}>
        {/* Consecutive Slots Setting */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Buchungsrichtlinien</Label>
          <div className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-card border-border">
            <div className="flex items-center gap-3">
              {consecutiveSlotsEnabled ? (
                <Eye className="h-4 w-4 text-success" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Zusammenhängende Slots erzwingen</p>
                <p className="text-sm text-muted-foreground">
                  Slots können nur lückenlos nacheinander gebucht werden
                </p>
              </div>
            </div>
            <Switch
              checked={consecutiveSlotsEnabled}
              onCheckedChange={setConsecutiveSlotsEnabled}
            />
          </div>
        </div>
        
        {/* Info Section */}
        <div className="space-y-4">
          {consecutiveSlotsEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Aktiviert:</strong> Slots können nur lückenlos nacheinander gebucht werden. 
                Dies verhindert Wartezeiten und optimiert die Kranführer-Auslastung.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <Label className="text-base font-medium mb-3 block">Funktionsweise</Label>
            <div className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Neue Slots müssen direkt an bestehende Slots anschließen</li>
                <li>Keine Lücken zwischen den Buchungszeiten eines Kranführers</li>
                <li>Gilt nur für Slots am selben Tag und desselben Kranführers</li>
                <li>Erste Slots eines Tages können frei gewählt werden</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
