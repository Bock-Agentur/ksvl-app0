import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks";
import { validatePassword } from "@/lib/password-validation";

interface UserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<void>;
  userName?: string;
}

export function UserPasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  userName
}: UserPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePassword(password);
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
      await onSubmit(password);
      handleClose();
    } catch (error) {
      // Error handling done by parent
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            {userName 
              ? `Neues Passwort für ${userName} setzen.`
              : "Geben Sie ein neues Passwort für den Benutzer ein."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
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
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isChanging}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isChanging || !password || !confirmPassword}
            >
              {isChanging ? "Wird geändert..." : "Passwort ändern"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
