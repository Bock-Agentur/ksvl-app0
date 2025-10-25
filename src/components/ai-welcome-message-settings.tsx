import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAIWelcomeMessage } from "@/hooks/use-ai-welcome-message";
import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";

const TEMPLATES = [
  {
    label: "Regatta-Erinnerung",
    message: "📅 Erinnerung: Die Regatta findet am [Datum] statt. Bitte rechtzeitig erscheinen!"
  },
  {
    label: "Vorstandssitzung",
    message: "🏛️ Vorstandssitzung am [Datum] um [Uhrzeit]. Alle Vorstandsmitglieder sind herzlich eingeladen."
  },
  {
    label: "Krantermin",
    message: "🚢 Wichtig: Gebuchte Krantermine diese Woche beachten. Bei Fragen bitte melden!"
  },
  {
    label: "Hafenarbeiten",
    message: "⚓ Achtung: Hafenarbeiten am [Datum] - Eingeschränkter Betrieb. Bitte Aushänge beachten."
  }
];

export function AIWelcomeMessageSettings() {
  const { enabled, message, updateSettings, isLoading } = useAIWelcomeMessage();
  const [localMessage, setLocalMessage] = useState(message);

  const handleSave = () => {
    updateSettings({ enabled, message: localMessage });
  };

  const handleTemplateClick = (templateMessage: string) => {
    setLocalMessage(templateMessage);
  };

  const handleToggle = (checked: boolean) => {
    updateSettings({ enabled: checked, message: localMessage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aktivierung */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle>Automatische Nachricht</CardTitle>
          <CardDescription>
            Aktivieren oder deaktivieren Sie die automatische Startnachricht.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="welcome-enabled"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="welcome-enabled">
              Automatische Nachricht aktivieren
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Nachrichteninhalt */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle>Nachrichteninhalt</CardTitle>
          <CardDescription>
            Diese Nachricht wird allen Mitgliedern beim Dashboard-Start im AI-Chat angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Nachricht</Label>
            <Textarea
              id="welcome-message"
              placeholder="z.B. 'Willkommen! Vergiss nicht die Regatta am kommenden Samstag.'"
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Quick Templates */}
          <div className="space-y-2">
            <Label>Schnellvorlagen</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => (
                <Button
                  key={template.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(template.message)}
                  className="justify-start text-left h-auto py-2"
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">{template.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Nachricht speichern
          </Button>
        </CardContent>
      </Card>

      {/* Vorschau */}
      {localMessage && (
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
            <CardDescription>
              So wird die Nachricht im Chat angezeigt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 border border-border">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">AI-Assistent</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {localMessage}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
