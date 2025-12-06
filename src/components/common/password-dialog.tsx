import { useState, useEffect } from "react";
import { Eye, EyeOff, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks";
import { validatePassword } from "@/lib/password-validation";
import { supabase } from "@/integrations/supabase/client";

interface PasswordDialogProps {
  // Controlled mode: extern gesteuert
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Für User-Management: Callback für Passwort-Submit
  onSubmit?: (password: string) => Promise<void>;
  
  // Für eigenes Profil: direkter API-Aufruf
  userId?: string;
  
  // Optionaler Name für Titel
  userName?: string;
  
  // Trigger-Button (optional für uncontrolled mode)
  trigger?: React.ReactNode;
}

export function PasswordDialog({
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  userId,
  userName,
  trigger
}: PasswordDialogProps) {
  // Internal state für uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  // Controlled vs Uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleChangePassword = async () => {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast({
        title: "Fehler",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChanging(true);

      // If onSubmit callback provided (User-Management), use it
      if (onSubmit) {
        await onSubmit(newPassword);
        toast({
          title: "Erfolg",
          description: "Passwort wurde erfolgreich geändert.",
        });
        setOpen(false);
        return;
      }

      // Otherwise, use Edge Function for own profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht angemeldet');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: userId || session.user.id,
          newPassword: newPassword
        })
      });

      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Passwort konnte nicht geändert werden');
      }

      toast({
        title: "Erfolg",
        description: "Passwort wurde erfolgreich geändert.",
      });
      
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <>
      {/* Trigger Button für uncontrolled mode */}
      {trigger && (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      )}
      
      {/* Default trigger wenn kein custom trigger */}
      {!trigger && !isControlled && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Key className="w-4 h-4 mr-2" />
          Passwort ändern
        </Button>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start pt-16 md:items-center md:pt-4 justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isChanging) {
              setOpen(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
          
          {/* Dialog */}
          <div className="relative z-50 w-full max-w-md mx-4 bg-background border rounded-lg shadow-lg animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  Passwort ändern
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userName 
                    ? `Neues Passwort für ${userName} setzen.`
                    : "Geben Sie ein neues Passwort ein."
                  }
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Neues Passwort */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Neues Passwort eingeben"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Passwort bestätigen */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Passwort wiederholen"
                      className={`pr-10 ${!passwordsMatch ? 'border-destructive' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {!passwordsMatch && (
                    <p className="text-xs text-destructive">Passwörter stimmen nicht überein</p>
                  )}
                </div>

                {/* Anforderungen */}
                <p className="text-xs text-muted-foreground">
                  Mind. 8 Zeichen, Groß- und Kleinbuchstaben, mindestens eine Zahl
                </p>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    disabled={isChanging}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isChanging || !newPassword || !confirmPassword || !passwordsMatch}
                  >
                    {isChanging ? "Wird geändert..." : "Passwort ändern"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
