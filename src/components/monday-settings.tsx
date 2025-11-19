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

      console.log('Saving monday_settings:', settingsData);

      if (settings?.id) {
        const { data, error } = await supabase
          .from('monday_settings')
          .update(settingsData)
          .eq('id', settings.id)
          .select();

        console.log('Update result:', { data, error });
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('monday_settings')
          .insert(settingsData)
          .select();

        console.log('Insert result:', { data, error });
        if (error) throw error;
      }

      toast.success("Einstellungen gespeichert");
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-monday', {
        body: { action: 'sync' }
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
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Monday.com Integration</CardTitle>
            </div>
            {lastSyncAt && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Letzter Sync: {new Date(lastSyncAt).toLocaleString('de-DE')}
              </Badge>
            )}
          </div>
          <CardDescription>
            Synchronisiere Mitgliedsdaten mit Monday.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!boardId && (
            <Alert>
              <AlertDescription>
                ⚠️ Board-ID fehlt. Bitte konfigurieren Sie die Board-ID, um die Synchronisierung zu ermöglichen.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              <strong>Synchronisierte Felder:</strong> Nachname, Vorname, PLZ, ORT, Telefon, eMail
              <br />
              <strong>Ziel-Board:</strong> APP_SYNC_Mitgliedsdaten
              <br />
              <strong>Hinweis:</strong> Lokale Stammdaten werden komplett mit Monday.com Daten überschrieben (One-Way-Sync)
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="boardId">Board ID</Label>
              <Input
                id="boardId"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                placeholder="z.B. 1234567890"
              />
              <p className="text-sm text-muted-foreground">
                Die ID des Monday.com Boards (optional - wenn leer, wird nach Board-Name gesucht)
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoSync">Automatische Synchronisierung</Label>
                <p className="text-sm text-muted-foreground">
                  Periodische automatische Synchronisierung aktivieren
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={autoSyncEnabled}
                onCheckedChange={setAutoSyncEnabled}
              />
            </div>

            {!autoSyncEnabled && (
              <Alert>
                <AlertDescription>
                  ℹ️ Auto-Sync ist deaktiviert. Sie können weiterhin manuelle Synchronisierungen durchführen.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              onClick={saveSettings}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                'Einstellungen speichern'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={triggerSync}
              disabled={syncing || !boardId}
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisiere...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Jetzt synchronisieren
                </>
              )}
            </Button>
          </div>

          {!boardId && (
            <p className="text-sm text-muted-foreground">
              ⚠️ Bitte speichern Sie zuerst eine Board-ID, um die manuelle Synchronisierung zu aktivieren.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}