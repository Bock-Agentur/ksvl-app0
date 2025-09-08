import { useState } from "react";
import { Database, RefreshCw, Users, Calendar, Settings, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTestData } from "@/hooks/use-test-data";

import { RoleSystemInfo } from "./role-system-info";

export function TestDataCenter() {
  const { toast } = useToast();
  const { 
    scenarios, 
    activeScenario, 
    isTestMode, 
    setTestMode, 
    activateScenario: activateScenarioContext, 
    generateRandomData: generateRandomDataContext,
    generateUsersOnly: generateUsersOnlyContext,
    generatePersonaMembers: generatePersonaMembersContext,
    generateSlotVariants: generateSlotVariantsContext,
    generatePersonaWithSlots: generatePersonaWithSlotsContext,
    generateRandomCredentials: generateRandomCredentialsContext,
    clearAllData: clearAllDataContext,
    users,
    slots
  } = useTestData();
  
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const toggleTestMode = (enabled: boolean) => {
    setTestMode(enabled);
    toast({
      title: enabled ? "Testmodus aktiviert" : "Testmodus deaktiviert",
      description: enabled 
        ? "Alle Daten sind jetzt Mock-Daten für Tests"
        : "Wechsel zu Live-Daten (in echter App)",
    });
  };

  const activateScenario = (scenarioId: string) => {
    activateScenarioContext(scenarioId);
    setLastUpdate(new Date());
    
    const scenario = scenarios.find(s => s.id === scenarioId);
    toast({
      title: "Testszenario aktiviert",
      description: `${scenario?.name}: ${scenario?.description} - ${scenario?.stats.totalSlots} Slots, ${scenario?.stats.members} Mitglieder erstellt`,
    });
  };

  const clearAllData = () => {
    clearAllDataContext();
    setLastUpdate(new Date());
    toast({
      title: "Testdaten geleert",
      description: "Alle Mock-Daten wurden zurückgesetzt",
    });
  };

  const generateRandomData = () => {
    generateRandomDataContext();
    setLastUpdate(new Date());
    
    // Wait for next tick to get updated data
    setTimeout(() => {
      toast({
        title: "Zufallsdaten generiert",
        description: `Neue Mock-Daten erstellt: ${users.length} Benutzer, ${slots.length} Slots`,
      });
    }, 100);
  };

  const generateUsersOnly = () => {
    generateUsersOnlyContext();
    setLastUpdate(new Date());
    
    setTimeout(() => {
      toast({
        title: "Test-Benutzer erstellt",
        description: "4 Test-Personas erstellt: Harald (Admin), Peter Schmidt (Kranführer), Max Mustermann & Anna Weber (Mitglieder)",
      });
    }, 100);
  };

  const generatePersonaMembers = () => {
    generatePersonaMembersContext();
    setLastUpdate(new Date());
    
    setTimeout(() => {
      toast({
        title: "Persona-Mitglieder geladen",
        description: "15 vielfältige Persona-Mitglieder erstellt mit verschiedenen Rollen und Booten",
      });
    }, 100);
  };

  const generateSlotVariants = () => {
    generateSlotVariantsContext();
    setLastUpdate(new Date());
    
    setTimeout(() => {
      toast({
        title: "Slot-Varianten erstellt",
        description: "30 unterschiedliche Slots mit verschiedenen Zeiten, Dauern und Eigenschaften generiert",
      });
    }, 100);
  };

  const generatePersonaWithSlots = () => {
    generatePersonaWithSlotsContext();
    setLastUpdate(new Date());
    
    setTimeout(() => {
      toast({
        title: "Komplettset geladen",
        description: `4 Benutzer und mindestens 40 Slots für nächste Woche erstellt`,
      });
    }, 100);
  };

  const generateRandomCredentials = () => {
    generateRandomCredentialsContext();
    setLastUpdate(new Date());
    
    setTimeout(() => {
      toast({
        title: "Zugangsdaten auf Zufall erstellt",
        description: `Zufällige Daten erstellt: ${users.length} Benutzer, ${slots.length} Slots`,
      });
    }, 100);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-deep rounded-lg p-6 text-primary-foreground shadow-elevated-maritime">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Testdaten-Zentrale</h2>
        </div>
        <p className="text-primary-foreground/90">
          Vollständige Kontrolle über alle Mock-Daten für die Entwicklung und Tests
        </p>
      </div>

      {/* Test Mode Toggle */}
      <Card className="shadow-card-maritime">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Testmodus
              </CardTitle>
              <CardDescription>
                Schaltet zwischen Mock-Daten und Live-Daten um
              </CardDescription>
            </div>
            <Switch
              checked={isTestMode}
              onCheckedChange={toggleTestMode}
            />
          </div>
        </CardHeader>
        {isTestMode && (
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">TESTMODUS AKTIV</Badge>
                <Badge variant="outline">
                  Aktualisiert: {lastUpdate.toLocaleTimeString('de-AT')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Alle Daten in der App sind aktuell Mock-Daten für Testzwecke.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {isTestMode && (
        <>
          {/* Quick Actions */}
          <Card className="shadow-card-maritime">
            <CardHeader>
              <CardTitle>Schnelle Aktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  onClick={generatePersonaWithSlots}
                  className="h-auto p-4 flex flex-col gap-2 w-full justify-start text-left"
                >
                  <Database className="h-5 w-5" />
                  <span className="text-sm font-medium">Komplettset</span>
                  <span className="text-xs opacity-70">4 Benutzer + nächste Woche</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={generateUsersOnly}
                  className="h-auto p-4 flex flex-col gap-2 w-full justify-start text-left"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Benutzer</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Button 
                  variant="ghost" 
                  onClick={generateRandomCredentials}
                  className="h-auto p-4 flex flex-col gap-2 w-full justify-start text-left"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="text-sm">Zufall</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={clearAllData}
                  className="h-auto p-4 flex flex-col gap-2 w-full justify-start text-left"
                >
                  <Database className="h-5 w-5" />
                  <span className="text-sm">Alles leeren</span>
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* Role System Information */}
          <RoleSystemInfo />

          {/* Test Personas */}
          <Card className="shadow-card-maritime">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Test-Personas
              </CardTitle>
              <CardDescription>
                Vordefinierte Benutzer für verschiedene Testfälle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Max Mustermann</p>
                    <p className="text-sm text-muted-foreground">Aktives Mitglied, Boot "Seeadler"</p>
                  </div>
                  <Badge variant="outline">Mitglied</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Anna Weber</p>
                    <p className="text-sm text-muted-foreground">Neue Mitglied, Boot "Windspiel"</p>
                  </div>
                  <Badge variant="outline">Mitglied</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Peter Schmidt</p>
                    <p className="text-sm text-muted-foreground">Erfahrener Kranführer</p>
                  </div>
                  <Badge className="bg-gradient-ocean text-primary-foreground">Kranführer</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Harald</p>
                    <p className="text-sm text-muted-foreground">Administrator mit allen Rollen (Admin, Kranführer, Mitglied)</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge className="bg-gradient-deep text-primary-foreground text-xs">Admin</Badge>
                    <Badge className="bg-gradient-ocean text-primary-foreground text-xs">Kranführer</Badge>
                    <Badge variant="outline" className="text-xs">Mitglied</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}