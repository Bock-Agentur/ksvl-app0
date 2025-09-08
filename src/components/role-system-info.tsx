import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Shield, Settings, Info } from "lucide-react";

export function RoleSystemInfo() {
  return (
    <Card className="shadow-card-maritime">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Rollensystem Übersicht
        </CardTitle>
        <CardDescription>
          Verstehen Sie das neue Multi-Rollen-System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Das neue Rollensystem erlaubt mehrere Rollen pro Nutzer. Admins haben automatisch alle Rechte.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                👤 Mitglied
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              • Kann Slots buchen und verwalten<br/>
              • Grundlegende Benutzerrechte<br/>
              • Automatisch bei allen anderen Rollen enthalten
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-ocean-gradient/10">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradient-ocean text-primary-foreground text-xs">
                ⚓ Kranführer
              </Badge>
              <Badge variant="outline" className="text-xs">
                + Mitglied
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              • Kann Slots erstellen und verwalten<br/>
              • Zugriff auf Kranführer-spezifische Funktionen<br/>
              • Hat automatisch auch Mitglieder-Rechte
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-deep-gradient/10">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradient-deep text-primary-foreground text-xs">
                🔧 Administrator
              </Badge>
              <Badge className="bg-gradient-ocean text-primary-foreground text-xs">
                + Kranführer
              </Badge>
              <Badge variant="outline" className="text-xs">
                + Mitglied
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              • Vollzugriff auf alle Systemfunktionen<br/>
              • Benutzerverwaltung und Systemkonfiguration<br/>
              • Hat automatisch alle anderen Rollen und deren Rechte
            </p>
          </div>
        </div>

        <div className="pt-3 border-t">
          <h4 className="font-medium mb-2 text-sm">Auswirkungen der Änderungen:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Flexibilität:</strong> Nutzer können mehrere Rollen gleichzeitig haben</li>
            <li>• <strong>Automatische Rechte:</strong> Admins erhalten automatisch alle Rollen</li>
            <li>• <strong>Vereinfachte Verwaltung:</strong> Keine manuellen Rollenzuweisungen für Admins</li>
            <li>• <strong>Bessere UX:</strong> Klarere Darstellung aller Nutzerberechtigungen</li>
            <li>• <strong>Sicherheit:</strong> Hierarchische Rechtevergabe verhindert Fehler</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}