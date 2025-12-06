import { useState } from "react";
import { Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/password-validation";
import { logger } from "@/lib/logger";

interface PasswordChangeDialogProps {
  userId?: string;
}

export function PasswordChangeDialog({ userId }: PasswordChangeDialogProps) {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Key className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            Bitte geben Sie ein neues Passwort ein.
          </DialogDescription>
        </DialogHeader>

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

          <div className="flex gap-2 justify-end">
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
      </DialogContent>
    </Dialog>
  );
}
