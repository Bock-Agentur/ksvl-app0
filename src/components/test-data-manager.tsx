import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TestDataManager() {
  const { toast } = useToast();
  const [craneOperatorCount, setCraneOperatorCount] = useState(3);
  const [memberCount, setMemberCount] = useState(10);
  const [slotCount, setSlotCount] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hideTestData, setHideTestData] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load hideTestData setting
  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'hide_test_data')
        .eq('is_global', true)
        .maybeSingle();

      if (data?.setting_value) {
        setHideTestData((data.setting_value as { enabled: boolean }).enabled || false);
      }
      setIsLoadingSettings(false);
    };

    loadSettings();
  }, []);

  // Save hideTestData setting
  const handleHideTestDataChange = async (checked: boolean) => {
    setHideTestData(checked);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        setting_key: 'hide_test_data',
        setting_value: { enabled: checked },
        is_global: true
      });

    if (error) {
      console.error('Error saving hide_test_data setting:', error);
      toast({
        title: "Fehler",
        description: "Einstellung konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } else {
      toast({
        title: checked ? "Testdaten ausgeblendet" : "Testdaten eingeblendet",
        description: checked 
          ? "Testdaten werden in der Anwendung nicht mehr angezeigt." 
          : "Testdaten werden wieder angezeigt."
      });
    }
  };

  const generateTestUsers = async () => {
    setIsGenerating(true);
    try {
      console.log('Calling create-test-users function...');
      
      const { data, error } = await supabase.functions.invoke('create-test-users', {
        body: {
          craneOperatorCount,
          memberCount
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Test users created:', data);

      toast({
        title: "Test-Benutzer erstellt",
        description: `${data.created} Test-Benutzer wurden erfolgreich angelegt.`
      });

    } catch (error) {
      console.error('Error generating test users:', error);
      toast({
        title: "Fehler",
        description: "Test-Benutzer konnten nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTestSlots = async () => {
    setIsGenerating(true);
    try {
      // Get test crane operators (only users with kranfuehrer role)
      const { data: craneOperatorRoles, error: operatorsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'kranfuehrer');

      if (operatorsError) throw operatorsError;

      if (!craneOperatorRoles || craneOperatorRoles.length === 0) {
        toast({
          title: "Keine Kranführer",
          description: "Bitte erstellen Sie zuerst Test-Kranführer.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }

      // Get profiles for these crane operators that are test data
      const { data: craneOperators, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', craneOperatorRoles.map(r => r.user_id))
        .eq('is_test_data', true);

      if (profilesError) throw profilesError;

      if (!craneOperators || craneOperators.length === 0) {
        toast({
          title: "Keine Kranführer",
          description: "Bitte erstellen Sie zuerst Test-Kranführer.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }

      // Get test members for bookings
      const { data: memberRoles, error: memberRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'mitglied');

      if (memberRolesError) throw memberRolesError;

      const { data: testMembers, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', memberRoles?.map(r => r.user_id) || [])
        .eq('is_test_data', true);

      if (membersError) throw membersError;

      // Generate slots for next 7 days
      const today = new Date();
      const testSlots = [];

      for (let i = 0; i < slotCount; i++) {
        const daysOffset = Math.floor(i / 10); // Spread across week
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + daysOffset);

        const hour = 6 + (i % 15); // Hours 6-20
        const time = `${hour.toString().padStart(2, '0')}:00`;

        const randomOperator = craneOperators[Math.floor(Math.random() * craneOperators.length)];
        
        // 30% chance to be booked if we have test members
        const shouldBook = testMembers && testMembers.length > 0 && Math.random() > 0.7;
        const randomMember = shouldBook ? testMembers[Math.floor(Math.random() * testMembers.length)] : null;

        testSlots.push({
          date: slotDate.toISOString().split('T')[0],
          time,
          duration: 60,
          crane_operator_id: randomOperator.id,
          is_booked: shouldBook,
          member_id: randomMember?.id || null,
          is_test_data: true,
          notes: shouldBook ? `Test-Buchung für ${randomMember?.name}` : null
        });
      }

      const { error: insertError } = await supabase
        .from('slots')
        .insert(testSlots);

      if (insertError) throw insertError;

      toast({
        title: "Test-Slots erstellt",
        description: `${slotCount} Test-Termine wurden angelegt (ca. ${Math.floor(slotCount * 0.3)} gebucht).`
      });

    } catch (error) {
      console.error('Error generating test slots:', error);
      toast({
        title: "Fehler",
        description: "Test-Slots konnten nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTestData = async () => {
    if (!confirm('Möchten Sie wirklich alle Testdaten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Calling delete-test-data function...');
      
      const { data, error } = await supabase.functions.invoke('delete-test-data');

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Test data deleted:', data);

      toast({
        title: "Testdaten gelöscht",
        description: `${data.deleted} Test-Benutzer und alle zugehörigen Slots wurden entfernt.`
      });

    } catch (error) {
      console.error('Error deleting test data:', error);
      toast({
        title: "Fehler",
        description: "Testdaten konnten nicht gelöscht werden.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-[hsl(348_77%_67%)] text-white border-[hsl(348_77%_67%)]">
        <AlertTriangle className="h-4 w-4 text-white" />
        <AlertDescription className="text-white">
          Dies ist ein Testsystem. Mit dieser Funktion können Sie Test-Benutzer und Test-Termine in der echten Datenbank anlegen.
          Alle Testdaten werden mit dem Flag `is_test_data: true` versehen und können jederzeit vollständig gelöscht werden.
        </AlertDescription>
      </Alert>

      {/* Test Users Generation */}
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Test-Benutzer generieren
          </CardTitle>
          <CardDescription>
            Erstellen Sie automatisch Test-Kranführer und Test-Mitglieder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="craneOperators">
                <UserCheck className="h-4 w-4 inline mr-2" />
                Anzahl Kranführer
              </Label>
              <Input
                id="craneOperators"
                type="number"
                min="1"
                max="20"
                value={craneOperatorCount}
                onChange={(e) => setCraneOperatorCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="members">
                <Users className="h-4 w-4 inline mr-2" />
                Anzahl Mitglieder
              </Label>
              <Input
                id="members"
                type="number"
                min="1"
                max="50"
                value={memberCount}
                onChange={(e) => setMemberCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <Button
            onClick={generateTestUsers}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generiere..." : "Test-Benutzer erstellen"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Login: kranfuehrer1@test.hafen.com / Test1234!1 (usw.)
          </p>
        </CardContent>
      </Card>

      {/* Test Slots Generation */}
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Test-Slots generieren
          </CardTitle>
          <CardDescription>
            Erstellen Sie automatisch Test-Krantermine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slots">
              <Calendar className="h-4 w-4 inline mr-2" />
              Anzahl Slots
            </Label>
            <Input
              id="slots"
              type="number"
              min="1"
              max="100"
              value={slotCount}
              onChange={(e) => setSlotCount(parseInt(e.target.value) || 1)}
            />
          </div>
          <Button
            onClick={generateTestSlots}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generiere..." : "Test-Slots erstellen"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Slots werden über die nächsten 7 Tage verteilt, ca. 30% sind bereits von Test-Mitgliedern gebucht.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Test Data Management */}
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Test-Datenverwaltung
          </CardTitle>
          <CardDescription>
            Verwalten Sie alle Testdaten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hideTestData">Testdaten ausblenden</Label>
              <p className="text-sm text-muted-foreground">
                Testdaten werden in allen Listen und Übersichten ausgeblendet
              </p>
            </div>
            <Switch
              id="hideTestData"
              checked={hideTestData}
              onCheckedChange={handleHideTestDataChange}
              disabled={isLoadingSettings}
            />
          </div>

          <Separator />

          <Button
            onClick={deleteTestData}
            disabled={isDeleting}
            variant="destructive"
            className="w-full"
          >
            {isDeleting ? "Lösche..." : "Alle Testdaten löschen"}
          </Button>
          <p className="text-sm text-muted-foreground">
            ⚠️ Löscht alle Test-Benutzer und Test-Slots (mit is_test_data: true). Echte Daten bleiben erhalten.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
