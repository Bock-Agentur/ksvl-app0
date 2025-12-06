import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserType } from "@/types";
import { PasswordDialog } from "@/components/common/password-dialog";
interface ProfileLoginCardProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  isAdmin: boolean;
  userId?: string;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export function ProfileLoginCard({
  user,
  editedUser,
  isEditing,
  isAdmin,
  userId,
  setEditedUser,
}: ProfileLoginCardProps) {
  // Nur für eigenes Profil oder Admin anzeigen
  if (userId && !isAdmin) {
    return null;
  }

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          🔐 Zugangsdaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benutzername - nur Admin kann ändern */}
          <div className="space-y-2">
            <Label>Benutzername</Label>
            {isEditing && isAdmin ? (
              <Input
                value={(editedUser as any)?.username || ""}
                onChange={(e) => setEditedUser(prev => prev ? { ...prev, username: e.target.value } as any : null)}
              />
            ) : (
              <Input
                value={(user as any).username || user.email}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          {/* Passwort */}
          <div className="space-y-2">
            <Label>Passwort</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value="********"
                disabled
                className="bg-muted flex-1"
              />
              <PasswordDialog userId={userId} />
            </div>
          </div>

          {/* Passwort ändern erforderlich - nur Admin */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Passwort ändern erforderlich</Label>
              <Select
                value={(editedUser as any)?.passwordChangeRequired ? 'Ja' : 'Nein'}
                onValueChange={(value) => {
                  if (!isEditing || !editedUser) return;
                  setEditedUser({
                    ...editedUser,
                    passwordChangeRequired: value === 'Ja'
                  } as any);
                }}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ja">Ja</SelectItem>
                  <SelectItem value="Nein">Nein</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 2FA-Methode */}
          <div className="space-y-2">
            <Label>2FA-Methode</Label>
            <Select
              value={(editedUser as any)?.twoFactorMethod || 'Aus'}
              onValueChange={(value) => {
                if (!isEditing || !editedUser) return;
                setEditedUser({
                  ...editedUser,
                  twoFactorMethod: value as any
                } as any);
              }}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aus">Aus</SelectItem>
                <SelectItem value="TOTP">TOTP</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
