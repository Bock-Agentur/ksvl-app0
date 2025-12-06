import { useState } from "react";
import { Key, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/password-validation";
import { logger } from "@/lib/logger";

interface PasswordChangeDialogProps {
  userId?: string;
}

export function PasswordChangeDialog({ userId }: PasswordChangeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      return;
    }

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

      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Nicht angemeldet");
        targetUserId = authUser.id;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht angemeldet");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "update",
            userId: targetUserId,
            password: newPassword,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Passwort konnte nicht geändert werden");
      }

      toast({
        title: "Passwort geändert",
        description: "Das Passwort wurde erfolgreich aktualisiert.",
      });

      handleClose();
    } catch (error: any) {
      logger.error('AUTH', 'Error changing password', error);
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Key className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={handleClose} />
          <div className="fixed inset-0 flex items-start md:items-center justify-center p-4 pt-16 md:pt-4 overflow-y-auto">
            <div className="bg-card rounded-2xl shadow-lg max-w-md w-full animate-scale-in">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Passwort ändern</h2>
                    <p className="text-sm text-muted-foreground">
                      Bitte geben Sie ein neues Passwort ein.
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Neues Passwort</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
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
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Passwort wiederholen"
                        className="pr-10"
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
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Mind. 8 Zeichen, Groß- und Kleinbuchstaben, mindestens eine Zahl
                  </p>
                </div>

                {/* Footer */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isChanging}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isChanging || !newPassword || !confirmPassword}
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
