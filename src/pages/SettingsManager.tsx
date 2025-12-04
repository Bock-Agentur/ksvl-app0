/**
 * Settings Manager (Admin UI)
 * Pattern A: PageLoader + AnimatedPage + UnifiedFooter
 */

import { useState, useEffect } from "react";
import { useSettingsBatch, useRole, useFooterMenuSettings } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { UnifiedFooter } from "@/components/common/unified-footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingEntry {
  id: string;
  setting_key: string;
  setting_value: any;
  is_global: boolean;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const KNOWN_SETTINGS = [
  'login_background',
  'header-message',
  'sticky_header_layout',
  'marina-menu-settings-template',
  'footer-settings-template-admin',
  'footer-settings-template-vorstand',
  'footer-settings-template-kranfuehrer',
  'footer-settings-template-mitglied',
  'footer-settings-template-gastmitglied',
  'dashboard-settings-template-admin',
  'dashboard-settings-template-vorstand',
  'dashboard-settings-template-kranfuehrer',
  'dashboard-settings-template-mitglied',
  'dashboard-settings-template-gastmitglied',
  'slot-design-settings',
  'aiAssistantSettings',
  'aiWelcomeMessage',
  'consecutiveSlotsEnabled',
  'roleWelcomeMessages',
  'footerMenuActiveRole',
  'page-transition-settings',
];

export default function SettingsManager() {
  const { isLoading: roleLoading, currentRole, currentUser } = useRole();
  const { isLoading: footerLoading } = useFooterMenuSettings(currentRole || 'mitglied');
  const { settingsMap, isLoading: settingsLoading, refetch } = useSettingsBatch({ loadAll: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SettingEntry | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isReady = !roleLoading && !footerLoading && !settingsLoading && !!currentUser;

  const allSettings = Array.from(settingsMap.values());
  const filteredSettings = allSettings.filter(s => 
    s.setting_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize settings
  const knownSettings = filteredSettings.filter(s => KNOWN_SETTINGS.includes(s.setting_key));
  const unknownSettings = filteredSettings.filter(s => !KNOWN_SETTINGS.includes(s.setting_key));
  const duplicateSettings = filteredSettings.filter(s => {
    const sameKey = allSettings.filter(x => x.setting_key === s.setting_key);
    return sameKey.length > 1;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast.success(`Setting "${deleteTarget.setting_key}" gelöscht`);
      refetch();
    } catch (error) {
      logger.error('SETTINGS', 'Error deleting setting', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Settings neu geladen');
  };

  const getRiskBadge = (settingKey: string) => {
    if (settingKey === 'login_background') {
      return <Badge variant="destructive" className="ml-2"><AlertTriangle className="h-3 w-3 mr-1" />HIGH</Badge>;
    }
    if (settingKey.startsWith('dashboard-settings')) {
      return <Badge variant="secondary" className="ml-2"><Info className="h-3 w-3 mr-1" />MID</Badge>;
    }
    return <Badge variant="outline" className="ml-2"><CheckCircle2 className="h-3 w-3 mr-1" />LOW</Badge>;
  };

  const SettingCard = ({ setting }: { setting: SettingEntry }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center">
              {setting.setting_key}
              {getRiskBadge(setting.setting_key)}
              {setting.is_global ? (
                <Badge variant="outline" className="ml-2">Global</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">User-specific</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              ID: {setting.id} • Created: {new Date(setting.created_at || '').toLocaleDateString()}
              {setting.updated_at && ` • Updated: ${new Date(setting.updated_at).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(setting)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 p-3 rounded-md">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(setting.setting_value, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );

  // PageLoader während Auth/Role/Footer/Settings laden
  if (!isReady) {
    return <PageLoader />;
  }

  return (
    <>
      <AnimatedPage>
        <PageLayout>
          <div className="min-h-screen pb-20 bg-background">
            <div className="container mx-auto p-6 max-w-6xl">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Settings Manager</h1>
                <p className="text-muted-foreground">
                  Verwaltung aller App-Settings • {allSettings.length} Einträge
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Settings durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Neu laden
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allSettings.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bekannte Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{knownSettings.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Unbekannte Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{unknownSettings.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Duplikate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{duplicateSettings.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Alle ({filteredSettings.length})</TabsTrigger>
                  <TabsTrigger value="known">Bekannt ({knownSettings.length})</TabsTrigger>
                  <TabsTrigger value="unknown">Unbekannt ({unknownSettings.length})</TabsTrigger>
                  <TabsTrigger value="duplicates">Duplikate ({duplicateSettings.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  {filteredSettings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Keine Settings gefunden
                      </CardContent>
                    </Card>
                  ) : (
                    filteredSettings.map(setting => <SettingCard key={setting.id} setting={setting} />)
                  )}
                </TabsContent>

                <TabsContent value="known" className="mt-6">
                  {knownSettings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Keine bekannten Settings gefunden
                      </CardContent>
                    </Card>
                  ) : (
                    knownSettings.map(setting => <SettingCard key={setting.id} setting={setting} />)
                  )}
                </TabsContent>

                <TabsContent value="unknown" className="mt-6">
                  {unknownSettings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Keine unbekannten Settings gefunden ✅
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                              Unbekannte Settings gefunden
                            </h3>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                              Diese Settings sind nicht in der offiziellen Registry dokumentiert. 
                              Sie könnten veraltet sein oder von alten Features stammen.
                            </p>
                          </div>
                        </div>
                      </div>
                      {unknownSettings.map(setting => <SettingCard key={setting.id} setting={setting} />)}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="duplicates" className="mt-6">
                  {duplicateSettings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Keine Duplikate gefunden ✅
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-red-900 dark:text-red-100">
                              Doppelte Settings gefunden
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Mehrere Einträge mit demselben Key können zu unerwartetem Verhalten führen.
                              Bitte nur einen Eintrag pro Key behalten (idealerweise den globalen).
                            </p>
                          </div>
                        </div>
                      </div>
                      {duplicateSettings.map(setting => <SettingCard key={setting.id} setting={setting} />)}
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Setting löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Möchten Sie das Setting "{deleteTarget?.setting_key}" wirklich löschen?
                      Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </PageLayout>
      </AnimatedPage>
      
      {/* Footer AUSSERHALB AnimatedPage - sofort sichtbar und sticky */}
      <UnifiedFooter
        currentRole={currentRole}
        currentUser={currentUser}
      />
    </>
  );
}
