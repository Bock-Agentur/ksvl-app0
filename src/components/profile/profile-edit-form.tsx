import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { User as UserType, UserRole } from "@/types";
import { CustomFieldsSection } from "./custom-fields-section";

interface ProfileEditFormProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  isAdmin: boolean;
  aiInfoEnabled: boolean;
  customValues: Record<string, any>;
  editedCustomValues: Record<string, any>;
  onUserChange: (updater: (prev: UserType | null) => UserType | null) => void;
  onAiInfoChange: (enabled: boolean) => void;
  onCustomValueChange: (fieldName: string, value: any) => void;
}

export function ProfileEditForm({
  user,
  editedUser,
  isEditing,
  isAdmin,
  aiInfoEnabled,
  customValues,
  editedCustomValues,
  onUserChange,
  onAiInfoChange,
  onCustomValueChange
}: ProfileEditFormProps) {
  const toNullIfEmpty = (value: any) => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  return (
    <>
      {/* 🔑 Sicherheit Card - nur für Admin */}
      {isAdmin && (
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              🔑 Sicherheit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rollen - nur Admin kann ändern */}
              <div className="space-y-2 md:col-span-2">
                <Label>Rollen</Label>
                {isEditing && isAdmin ? (
                  <div className="flex flex-wrap gap-2">
                    {(['gastmitglied', 'mitglied', 'kranfuehrer', 'vorstand', 'admin'] as UserRole[]).map((role) => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={editedUser?.roles?.includes(role) || false}
                          onCheckedChange={(checked) => {
                            if (!editedUser) return;
                            const currentRoles = editedUser.roles || [];
                            const newRoles = checked
                              ? [...currentRoles, role]
                              : currentRoles.filter(r => r !== role);
                            onUserChange(prev => prev ? { ...prev, roles: newRoles } as any : null);
                          }}
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.roles?.map(role => (
                      <span key={role} className="text-sm px-2 py-1 bg-muted rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Passwort ändern erforderlich - nur Admin */}
              <div className="space-y-2">
                <Label>Passwort ändern erforderlich</Label>
                <Select
                  value={(editedUser as any)?.passwordChangeRequired ? 'Ja' : 'Nein'}
                  onValueChange={(value) => {
                    if (!isEditing || !editedUser) return;
                    onUserChange(prev => prev ? {
                      ...prev,
                      passwordChangeRequired: value === 'Ja'
                    } as any : null);
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

              {/* 2FA-Methode */}
              <div className="space-y-2">
                <Label>2FA-Methode</Label>
                <Select
                  value={(editedUser as any)?.twoFactorMethod || 'Aus'}
                  onValueChange={(value) => {
                    if (!isEditing || !editedUser) return;
                    onUserChange(prev => prev ? {
                      ...prev,
                      twoFactorMethod: value as any
                    } as any : null);
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
      )}

      {/* 👤 Stammdaten Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            👤 Stammdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mitgliedsnummer - nur Admin kann ändern */}
            <div className="space-y-2">
              <Label>Mitgliedsnummer</Label>
              {isEditing && isAdmin ? (
                <Input
                  value={editedUser?.memberNumber || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, memberNumber: e.target.value } : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.memberNumber || '-'}</p>
              )}
            </div>

            {/* Vorname */}
            <div className="space-y-2">
              <Label>Vorname *</Label>
              {isEditing ? (
                <Input
                  value={editedUser?.firstName || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.firstName || '-'}</p>
              )}
            </div>

            {/* Nachname */}
            <div className="space-y-2">
              <Label>Nachname *</Label>
              {isEditing ? (
                <Input
                  value={editedUser?.lastName || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.lastName || '-'}</p>
              )}
            </div>

            {/* Geburtsdatum */}
            <div className="space-y-2">
              <Label>Geburtsdatum</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={(editedUser as any)?.birthDate || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, birthDate: e.target.value } as any : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {(user as any).birthDate ? new Date((user as any).birthDate).toLocaleDateString('de-DE') : '-'}
                </p>
              )}
            </div>

            {/* E-Mail */}
            <div className="space-y-2">
              <Label>E-Mail *</Label>
              {isEditing && isAdmin ? (
                <Input
                  type="email"
                  value={editedUser?.email || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <Label>Telefon</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editedUser?.phone || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.phone || '-'}</p>
              )}
            </div>

            {/* Straße & Hausnummer */}
            <div className="space-y-2 md:col-span-2">
              <Label>Straße & Hausnummer</Label>
              {isEditing ? (
                <Input
                  value={editedUser?.streetAddress || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, streetAddress: e.target.value } : null)}
                  placeholder="Musterstraße 123"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.streetAddress || '-'}</p>
              )}
            </div>

            {/* PLZ */}
            <div className="space-y-2">
              <Label>PLZ</Label>
              {isEditing ? (
                <Input
                  value={editedUser?.postalCode || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, postalCode: e.target.value } : null)}
                  placeholder="1234"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.postalCode || '-'}</p>
              )}
            </div>

            {/* Stadt */}
            <div className="space-y-2">
              <Label>Stadt</Label>
              {isEditing ? (
                <Input
                  value={editedUser?.city || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, city: e.target.value } : null)}
                  placeholder="Wien"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.city || '-'}</p>
              )}
            </div>
          </div>

          {/* Custom Fields Section */}
          <CustomFieldsSection
            isAdmin={isAdmin}
            customValues={customValues}
            editedCustomValues={editedCustomValues}
            isEditing={isEditing}
            onValueChange={onCustomValueChange}
          />
        </CardContent>
      </Card>

      {/* 🤖 KI Info Card - nur sichtbar, wenn aiInfoEnabled */}
      {aiInfoEnabled && (
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              🤖 KI Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>KI generierte Beschreibung</Label>
              {isEditing ? (
                <Textarea
                  placeholder="KI generierte Beschreibung"
                  value={(editedUser as any)?.aiDescription || ""}
                  onChange={(e) => onUserChange(prev => prev ? { ...prev, aiDescription: e.target.value } as any : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).aiDescription || '-'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ⚙️ Einstellungen Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            ⚙️ Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>KI Info aktiviert</Label>
            <Checkbox
              checked={aiInfoEnabled}
              onCheckedChange={(checked) => {
                onAiInfoChange(checked);
              }}
              disabled={isEditing}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
