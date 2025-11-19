import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Database, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MondaySettings() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [boardId, setBoardId] = useState("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monday_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setBoardId(data.board_id || "");
        setAutoSyncEnabled(data.auto_sync_enabled || false);
        setLastSyncAt(data.last_sync_at);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setLoading(true);

      const settingsData = {
        board_id: boardId || null,
        auto_sync_enabled: autoSyncEnabled,
        updated_at: new Date().toISOString()
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('monday_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('monday_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success("Einstellungen gespeichert");
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-monday', {
        body: { action: 'manual_sync' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || "Synchronisierung erfolgreich");
        if (data.stats) {
          toast.info(`${data.stats.synced} von ${data.stats.total} Einträgen synchronisiert`);
        }
        await loadSettings();
      } else {
        throw new Error(data?.error || "Synchronisierung fehlgeschlagen");
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error instanceof Error ? error.message : "Fehler bei der Synchronisierung");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Monday.com Integration
              </CardTitle>
              <CardDescription>
                Synchronisiere Mitgliedsdaten mit Monday.com
              </CardDescription>
            </div>
            {lastSyncAt && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Letzte Sync: {new Date(lastSyncAt).toLocaleString('de-DE')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Die Integration verwendet den Board "APP_SYNC_Mitgliedsdaten" und synchronisiert folgende Felder:
              Vorname, Nachname, PLZ, ORT, Telefon, eMail
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-id">Board-ID (optional)</Label>
              <Input
                id="board-id"
                placeholder="Leer lassen für automatische Erkennung"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Wenn leer, wird nach dem Board-Namen "APP_SYNC_Mitgliedsdaten" gesucht
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync">Automatische Synchronisierung</Label>
                <p className="text-sm text-muted-foreground">
                  Aktiviere automatische Synchronisierung bei Änderungen
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button onClick={saveSettings} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Einstellungen speichern
            </Button>
            
            <Button 
              onClick={triggerSync} 
              disabled={syncing || !autoSyncEnabled}
              variant="outline"
            >
              {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!syncing && <RefreshCw className="mr-2 h-4 w-4" />}
              Jetzt synchronisieren
            </Button>
          </div>

          {!autoSyncEnabled && (
            <Alert>
              <AlertDescription>
                Automatische Synchronisierung ist deaktiviert. Aktiviere sie, um Daten zu synchronisieren.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}