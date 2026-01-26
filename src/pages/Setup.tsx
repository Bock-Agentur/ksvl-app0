import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Anchor, 
  Database, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  AlertTriangle,
  Rocket,
  RotateCcw,
  Save,
  Clock
} from "lucide-react";

interface StepResult {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  details?: string;
}

interface SetupResponse {
  success: boolean;
  message: string;
  steps: StepResult[];
  nextSteps: string[];
  error?: string;
  details?: string;
}

interface SavedSetupState {
  supabaseUrl: string;
  anonKey: string;
  adminEmail: string;
  adminName: string;
  steps: StepResult[];
  setupComplete: boolean;
  savedAt: string;
}

const STORAGE_KEY = 'ksvl-setup-wizard-state';

export function Setup() {
  const navigate = useNavigate();
  
  // Form state
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [serviceRoleKey, setServiceRoleKey] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [adminName, setAdminName] = useState("");
  
  // UI state
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSavedState, setHasSavedState] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: SavedSetupState = JSON.parse(savedState);
        setSupabaseUrl(parsed.supabaseUrl || "");
        setAnonKey(parsed.anonKey || "");
        setAdminEmail(parsed.adminEmail || "");
        setAdminName(parsed.adminName || "");
        setSteps(parsed.steps || []);
        setSetupComplete(parsed.setupComplete || false);
        setSavedAt(parsed.savedAt);
        setHasSavedState(true);
        toast.info("Gespeicherter Fortschritt geladen");
      } catch (e) {
        console.error("Failed to parse saved state:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state whenever relevant fields change
  const saveState = () => {
    const state: SavedSetupState = {
      supabaseUrl,
      anonKey,
      adminEmail,
      adminName,
      steps,
      setupComplete,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedAt(state.savedAt);
    setHasSavedState(true);
    toast.success("Fortschritt gespeichert");
  };

  // Clear saved state
  const clearSavedState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSupabaseUrl("");
    setAnonKey("");
    setServiceRoleKey("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminPasswordConfirm("");
    setAdminName("");
    setSteps([]);
    setSetupComplete(false);
    setErrorMessage(null);
    setHasSavedState(false);
    setSavedAt(null);
    toast.success("Fortschritt zurückgesetzt");
  };

  // Validation
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.includes('supabase.co') || url.includes('supabase.in');
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isPasswordStrong = (password: string) => {
    return password.length >= 8 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /[0-9]/.test(password);
  };

  const canSubmit = 
    isValidUrl(supabaseUrl) &&
    anonKey.length > 50 &&
    serviceRoleKey.length > 50 &&
    isValidEmail(adminEmail) &&
    isPasswordStrong(adminPassword) &&
    adminPassword === adminPasswordConfirm &&
    adminName.length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsRunning(true);
    setErrorMessage(null);
    const initialSteps: StepResult[] = [
      { step: 1, name: 'Enum erstellen', status: 'pending' },
      { step: 2, name: '16 Tabellen erstellen', status: 'pending' },
      { step: 3, name: '6 DB-Funktionen erstellen', status: 'pending' },
      { step: 4, name: '50+ RLS Policies aktivieren', status: 'pending' },
      { step: 5, name: 'Seed-Daten einfügen', status: 'pending' },
      { step: 6, name: '3 Storage Buckets erstellen', status: 'pending' },
      { step: 7, name: 'Storage RLS Policies erstellen', status: 'pending' },
      { step: 8, name: 'Auth-Trigger + Admin-User erstellen', status: 'pending' },
    ];
    setSteps(initialSteps);

    try {
      const { data, error } = await supabase.functions.invoke<SetupResponse>('setup-wizard', {
        body: {
          supabaseUrl,
          serviceRoleKey,
          adminEmail,
          adminPassword,
          adminName
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        setSteps(data.steps);
        
        if (data.success) {
          setSetupComplete(true);
          // Save final state
          const state: SavedSetupState = {
            supabaseUrl,
            anonKey,
            adminEmail,
            adminName,
            steps: data.steps,
            setupComplete: true,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          toast.success("Migration erfolgreich!");
        } else {
          // Save partial state so user can continue later
          const state: SavedSetupState = {
            supabaseUrl,
            anonKey,
            adminEmail,
            adminName,
            steps: data.steps,
            setupComplete: false,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          setHasSavedState(true);
          setSavedAt(state.savedAt);
          setErrorMessage(data.message || data.error || 'Unbekannter Fehler');
          toast.warning("Migration mit Warnungen - Fortschritt gespeichert");
        }
      }
    } catch (err) {
      console.error('Setup error:', err);
      // Save state even on error
      const state: SavedSetupState = {
        supabaseUrl,
        anonKey,
        adminEmail,
        adminName,
        steps: steps.map(s => s.status === 'running' ? { ...s, status: 'error' as const } : s),
        setupComplete: false,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setHasSavedState(true);
      setSavedAt(state.savedAt);
      setErrorMessage(err instanceof Error ? err.message : 'Setup fehlgeschlagen');
      toast.error("Setup fehlgeschlagen - Fortschritt gespeichert");
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const getStatusIcon = (status: StepResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const formatSavedAt = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Anchor className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">KSVL Setup-Wizard</h1>
          <p className="text-muted-foreground">
            Automatisierte Migration für neue Supabase-Projekte
          </p>
        </div>

        {/* Saved State Info */}
        {hasSavedState && !setupComplete && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Gespeicherter Fortschritt</p>
                    {savedAt && (
                      <p className="text-xs text-muted-foreground">
                        Zuletzt gespeichert: {formatSavedAt(savedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={saveState}
                    disabled={isRunning}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Speichern
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearSavedState}
                    disabled={isRunning}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Zurücksetzen
                  </Button>
                </div>
              </div>
              {completedSteps > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{completedSteps} von 8 Schritten abgeschlossen</span>
                    <Progress value={progress} className="flex-1 h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!setupComplete ? (
          <>
            {/* Supabase Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Supabase Credentials
                </CardTitle>
                <CardDescription>
                  Erstelle ein neues Supabase-Projekt und kopiere die Credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supabaseUrl">Supabase URL</Label>
                  <Input
                    id="supabaseUrl"
                    placeholder="https://xxx.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    disabled={isRunning}
                  />
                  {supabaseUrl && !isValidUrl(supabaseUrl) && (
                    <p className="text-sm text-destructive">Ungültige Supabase URL</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anonKey">Anon Key (für .env)</Label>
                  <Input
                    id="anonKey"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceRoleKey">Service Role Key (nur für Setup)</Label>
                  <div className="relative">
                    <Input
                      id="serviceRoleKey"
                      type={showServiceKey ? "text" : "password"}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={serviceRoleKey}
                      onChange={(e) => setServiceRoleKey(e.target.value)}
                      disabled={isRunning}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowServiceKey(!showServiceKey)}
                    >
                      {showServiceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Der Service Role Key wird nur für das Setup verwendet und nicht gespeichert
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admin User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Administrator
                </CardTitle>
                <CardDescription>
                  Erstelle den ersten Admin-Benutzer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">E-Mail</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@ksvl.at"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      disabled={isRunning}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Name</Label>
                    <Input
                      id="adminName"
                      placeholder="Administrator"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="adminPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mind. 8 Zeichen, Groß/Klein, Zahl"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        disabled={isRunning}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {adminPassword && !isPasswordStrong(adminPassword) && (
                      <p className="text-xs text-destructive">Passwort zu schwach</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPasswordConfirm">Passwort bestätigen</Label>
                    <Input
                      id="adminPasswordConfirm"
                      type="password"
                      placeholder="Passwort wiederholen"
                      value={adminPasswordConfirm}
                      onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                      disabled={isRunning}
                    />
                    {adminPasswordConfirm && adminPassword !== adminPasswordConfirm && (
                      <p className="text-xs text-destructive">Passwörter stimmen nicht überein</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            {steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fortschritt</CardTitle>
                  <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.step} className="flex items-start gap-3">
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            {step.status === 'completed' && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Fertig
                              </Badge>
                            )}
                            {step.status === 'error' && (
                              <Badge variant="destructive">Fehler</Badge>
                            )}
                          </div>
                          {step.message && (
                            <p className="text-sm text-muted-foreground">{step.message}</p>
                          )}
                          {step.details && (
                            <p className="text-xs text-muted-foreground">{step.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {errorMessage && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">Fehler aufgetreten</p>
                      <p className="text-sm text-muted-foreground">{errorMessage}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Dein Fortschritt wurde gespeichert. Du kannst später fortfahren.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 text-lg"
                onClick={handleSubmit}
                disabled={!canSubmit || isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Migration läuft...
                  </>
                ) : completedSteps > 0 ? (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Migration fortsetzen
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Migration starten
                  </>
                )}
              </Button>
              {!isRunning && (supabaseUrl || anonKey || adminEmail) && (
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={saveState}
                >
                  <Save className="h-5 w-5" />
                </Button>
              )}
            </div>
          </>
        ) : (
          /* Success State */
          <Card className="border-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle className="text-green-600">Migration abgeschlossen!</CardTitle>
                  <CardDescription>
                    Die Datenbank wurde erfolgreich initialisiert
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* .env values */}
              <div className="space-y-3">
                <h4 className="font-medium">Für deine .env Datei:</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span>VITE_SUPABASE_URL={supabaseUrl}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(`VITE_SUPABASE_URL=${supabaseUrl}`, 'URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VITE_SUPABASE_PUBLISHABLE_KEY={anonKey.slice(0, 30)}...</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(`VITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}`, 'Anon Key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Next Steps */}
              <div className="space-y-3">
                <h4 className="font-medium">Nächste Schritte:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">1.</span>
                    <span>SQL-Dump im SQL-Editor ausführen (docs/database/ksvl_database_dump_2026-01-23.sql)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">2.</span>
                    <span>Edge Functions mit Supabase CLI deployen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">3.</span>
                    <span>Secrets konfigurieren: GOOGLE_API_KEY, ADMIN_PASSWORD_RESET_KEY</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">4.</span>
                    <span>.env-Datei mit den neuen Credentials aktualisieren</span>
                  </li>
                </ul>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => navigate('/auth')}>
                  Zur App
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Supabase Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearSavedState}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          KSVL Slot Manager • Setup-Wizard v1.1
        </p>
      </div>
    </div>
  );
}
