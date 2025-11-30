import { useState } from "react";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/password-validation";

interface PasswordChangeDialogProps {
  userId?: string;
}

export function PasswordChangeDialog({ userId }: PasswordChangeDialogProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive"
      });
      return;
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast({
        title: "Fehler",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Nicht angemeldet');
        targetUserId = authUser.id;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht angemeldet');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update',
          userId: targetUserId,
          password: newPassword
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Passwort konnte nicht geändert werden');
      }

      toast({
        title: "Passwort geändert",
        description: "Das Passwort wurde erfolgreich aktualisiert."
      });
      
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Key className="w-3 h-3 mr-1.5" />
          Passwort ändern
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            Geben Sie ein neues Passwort ein. Das Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Passwort bestätigen</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Wird geändert..." : "Passwort ändern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
