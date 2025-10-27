import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Clock, Settings, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useConsecutiveSlots } from "@/hooks/use-consecutive-slots";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export function ConsecutiveSlotsSettings() {
  const { consecutiveSlotsEnabled, setConsecutiveSlotsEnabled } = useConsecutiveSlots();
  const [roleSwitchingEnabled, setRoleSwitchingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadRoleSwitchingSetting();
  }, []);

  const loadRoleSwitchingSetting = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'role_switching_enabled')
        .eq('is_global', true)
        .single();

      if (data) {
        const settingValue = data.setting_value as { enabled?: boolean };
        setRoleSwitchingEnabled(settingValue.enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading role switching setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitchingChange = async (enabled: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', 'role_switching_enabled')
        .eq('is_global', true)
        .single();

      const settingValue = { enabled };

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ setting_value: settingValue })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({
            setting_key: 'role_switching_enabled',
            setting_value: settingValue,
            is_global: true
          });

        if (error) throw error;
      }

      setRoleSwitchingEnabled(enabled);
      toast.success(enabled ? 'Rollenwechsel aktiviert' : 'Rollenwechsel deaktiviert');
    } catch (error) {
      console.error('Error saving role switching setting:', error);
      toast.error('Fehler beim Speichern der Einstellung');
    }
  };

  const regenerateRoleUsers = async () => {
    if (!confirm('Möchten Sie alle bestehenden Rollen-Nutzer löschen und neu anlegen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('regenerate-role-users');

      if (error) throw error;

      toast.success(`${data.created} Rollen-Nutzer wurden neu generiert`);
      console.log('Role users regenerated:', data);
    } catch (error) {
      console.error('Error regenerating role users:', error);
      toast.error('Fehler beim Generieren der Rollen-Nutzer');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Role Switching Setting */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Rollenwechsel-System</Label>
          <div className="flex items-center justify-between p-3 border rounded-lg transition-colors bg-card border-border">
            <div className="flex items-center gap-3">
              {roleSwitchingEnabled ? (
                <RefreshCw className="h-4 w-4 text-success" />
              ) : (
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Rollenwechsel aktivieren</p>
                <p className="text-sm text-muted-foreground">
                  Ermöglicht das Wechseln zwischen Test-Rollen-Benutzern
                </p>
              </div>
            </div>
            <Switch
              checked={roleSwitchingEnabled}
              onCheckedChange={handleRoleSwitchingChange}
              disabled={loading}
            />
          </div>
          
          <Button 
            onClick={regenerateRoleUsers} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rollen-Nutzer neu generieren
          </Button>
          
          {roleSwitchingEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Aktiviert:</strong> Beim Rollenwechsel werden automatisch Test-Benutzer geladen 
                (z.B. mitglied-rolle@ksvl.test). Diese Benutzer haben vollständige Profile 
                mit Beispieldaten und werden mit einem roten "Rolle" Label gekennzeichnet.
              </AlertDescription>
            </Alert>
          )}
        </div>

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