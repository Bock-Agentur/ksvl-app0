import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAIAssistantSettings } from "@/hooks/use-ai-assistant-settings";
import { TONALITY_LABELS, TONALITY_DESCRIPTIONS, RESPONSE_LENGTH_LABELS, RESPONSE_LENGTH_DESCRIPTIONS, Tonality, ResponseLength } from "@/types/ai-assistant";
import { ROLE_LABELS } from "@/lib/role-order";
import { UserRole } from "@/types/user";
import { Loader2 } from "lucide-react";

export function AIAssistantSettings() {
  const { settings, updateTonality, updateResponseLength, updateSystemPrompt, isLoading } = useAIAssistantSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const roles: UserRole[] = ['gastmitglied', 'mitglied', 'kranfuehrer', 'vorstand', 'admin'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI-Assistent Einstellungen</h2>
        <p className="text-muted-foreground">
          Passen Sie das Verhalten des AI-Assistenten an verschiedene Benutzerrollen an.
        </p>
      </div>

      {/* Tonalität pro Rolle */}
      <Card>
        <CardHeader>
          <CardTitle>Tonalität pro Rolle</CardTitle>
          <CardDescription>
            Definieren Sie, wie der Assistent mit unterschiedlichen Rollen spricht.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={roles[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {roles.map(role => (
                <TabsTrigger key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </TabsTrigger>
              ))}
            </TabsList>
            {roles.map(role => (
              <TabsContent key={role} value={role} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`tonality-${role}`}>
                    Tonalität für {ROLE_LABELS[role] || role}
                  </Label>
                  <Select
                    value={settings.tonality[role]}
                    onValueChange={(value) => updateTonality(role, value as Tonality)}
                  >
                    <SelectTrigger id={`tonality-${role}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TONALITY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {TONALITY_DESCRIPTIONS[key as Tonality]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {TONALITY_DESCRIPTIONS[settings.tonality[role]]}
                  </p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Antwortlänge */}
      <Card>
        <CardHeader>
          <CardTitle>Antwortlänge</CardTitle>
          <CardDescription>
            Legen Sie die maximale Länge der Antworten fest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="response-length">Maximale Antwortlänge</Label>
            <Select
              value={settings.responseLength}
              onValueChange={(value) => updateResponseLength(value as ResponseLength)}
            >
              <SelectTrigger id="response-length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESPONSE_LENGTH_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {RESPONSE_LENGTH_DESCRIPTIONS[key as ResponseLength]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Eigener System-Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Eigener System-Prompt</CardTitle>
          <CardDescription>
            Fügen Sie zusätzliche Anweisungen oder Beispiele für den Assistenten hinzu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Zusätzliche Anweisungen</Label>
              <Textarea
                id="custom-prompt"
                placeholder="z.B. 'Verwende maritime Begriffe' oder 'Erwähne immer die Sicherheitsregeln beim Kranbetrieb'"
                value={settings.customSystemPrompt || ''}
                onChange={(e) => updateSystemPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Diese Anweisungen werden dem Standard-Prompt hinzugefügt und gelten für alle Rollen.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => updateSystemPrompt('')}
              disabled={!settings.customSystemPrompt}
            >
              Zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
