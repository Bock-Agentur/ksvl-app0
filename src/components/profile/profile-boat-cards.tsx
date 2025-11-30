import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User as UserType } from "@/types";

interface ProfileBoatCardsProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export function ProfileBoatCards({
  user,
  editedUser,
  isEditing,
  setEditedUser,
}: ProfileBoatCardsProps) {
  return (
    <>
      {/* ⛵ Boot & Liegeplatz Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            ⛵ Boot & Liegeplatz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bootsname */}
            <div className="space-y-2">
              <Label>Bootsname</Label>
              {isEditing ? (
                <Input
                  value={editedUser?.boatName || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, boatName: e.target.value } : null)}
                  placeholder="Mein Boot"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.boatName || '-'}</p>
              )}
            </div>

            {/* Bootstyp */}
            <div className="space-y-2">
              <Label>Bootstyp</Label>
              <Select
                value={(editedUser as any)?.boatType || ''}
                onValueChange={(value) => {
                  if (!isEditing || !editedUser) return;
                  setEditedUser({
                    ...editedUser,
                    boatType: value
                  } as any);
                }}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle Bootstyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jolle">Jolle</SelectItem>
                  <SelectItem value="Kielboot">Kielboot</SelectItem>
                  <SelectItem value="Yacht">Yacht</SelectItem>
                  <SelectItem value="Katamaran">Katamaran</SelectItem>
                  <SelectItem value="Surfer/SUP">Surfer/SUP</SelectItem>
                  <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bootfarbe */}
            <div className="space-y-2">
              <Label>Bootfarbe</Label>
              {isEditing ? (
                <Input
                  value={(editedUser as any)?.boatColor || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, boatColor: e.target.value } as any : null)}
                  placeholder="z.B. Weiß"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).boatColor || '-'}</p>
              )}
            </div>

            {/* Bootslänge */}
            <div className="space-y-2">
              <Label>Bootslänge (m)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.1"
                  value={(editedUser as any)?.boatLength || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, boatLength: parseFloat(e.target.value) || null } as any : null)}
                  placeholder="z.B. 8.5"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).boatLength || '-'}</p>
              )}
            </div>

            {/* Bootsbreite */}
            <div className="space-y-2">
              <Label>Bootsbreite (m)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.1"
                  value={(editedUser as any)?.boatWidth || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, boatWidth: parseFloat(e.target.value) || null } as any : null)}
                  placeholder="z.B. 3.0"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).boatWidth || '-'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Separator className="my-2" />
            </div>

            {/* Liegeplatz Typ */}
            <div className="space-y-2">
              <Label>Liegeplatz Typ</Label>
              <Select
                value={(editedUser as any)?.berthType || ''}
                onValueChange={(value) => {
                  if (!isEditing || !editedUser) return;
                  setEditedUser({
                    ...editedUser,
                    berthType: value
                  } as any);
                }}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle Liegeplatz Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Steg">Steg</SelectItem>
                  <SelectItem value="Boje">Boje</SelectItem>
                  <SelectItem value="Trailer/Slip">Trailer/Slip</SelectItem>
                  <SelectItem value="Winterlager">Winterlager</SelectItem>
                  <SelectItem value="Gast">Gast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liegeplatz Nummer */}
            <div className="space-y-2">
              <Label>Liegeplatz Nummer</Label>
              {isEditing ? (
                <Input
                  value={(editedUser as any)?.berthNumber || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, berthNumber: e.target.value } as any : null)}
                  placeholder="A12"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).berthNumber || '-'}</p>
              )}
            </div>

            {/* Liegeplatz Länge */}
            <div className="space-y-2">
              <Label>Liegeplatz Länge (m)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.1"
                  value={(editedUser as any)?.berthLength || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, berthLength: parseFloat(e.target.value) || null } as any : null)}
                  placeholder="z.B. 9.0"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).berthLength || '-'}</p>
              )}
            </div>

            {/* Liegeplatz Breite */}
            <div className="space-y-2">
              <Label>Liegeplatz Breite (m)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.1"
                  value={(editedUser as any)?.berthWidth || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, berthWidth: parseFloat(e.target.value) || null } as any : null)}
                  placeholder="z.B. 3.5"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).berthWidth || '-'}</p>
              )}
            </div>

            {/* Bojenradius - nur wenn Liegeplatz Typ = "Boje" */}
            {(editedUser as any)?.berthType === 'Boje' && (
              <div className="space-y-2">
                <Label>Bojenradius (m)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    value={(editedUser as any)?.buoyRadius || ""}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, buoyRadius: parseFloat(e.target.value) || null } as any : null)}
                    placeholder="z.B. 5.0"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{(user as any).buoyRadius || '-'}</p>
                )}
              </div>
            )}

            {/* Dingi Liegeplatz */}
            <div className="space-y-2">
              <Label>Dingi Liegeplatz</Label>
              <Select
                value={(editedUser as any)?.hasDinghyBerth ? 'Ja' : 'Nein'}
                onValueChange={(value) => {
                  if (!isEditing || !editedUser) return;
                  setEditedUser({
                    ...editedUser,
                    hasDinghyBerth: value === 'Ja'
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

            {/* Dingi Liegeplatz Nummer - nur wenn Dingi vorhanden */}
            {(editedUser as any)?.hasDinghyBerth && (
              <div className="space-y-2">
                <Label>Dingi Liegeplatz Nummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any)?.dinghyBerthNumber || ""}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, dinghyBerthNumber: e.target.value } as any : null)}
                    placeholder="D5"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{(user as any).dinghyBerthNumber || '-'}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🚗 Parkplatz & Getränkechip Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🚗 Parkplatz & Getränkechip
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parkausweis Nummer */}
            <div className="space-y-2">
              <Label>Parkausweis Nummer</Label>
              {isEditing ? (
                <Input
                  value={(editedUser as any)?.parkingPermitNumber || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, parkingPermitNumber: e.target.value } as any : null)}
                  placeholder="P-123"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).parkingPermitNumber || '-'}</p>
              )}
            </div>

            {/* Parkausweis Ausstellungsdatum */}
            <div className="space-y-2">
              <Label>Parkausweis Ausstellungsdatum</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={(editedUser as any)?.parkingPermitIssueDate || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, parkingPermitIssueDate: e.target.value } as any : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {(user as any).parkingPermitIssueDate ? new Date((user as any).parkingPermitIssueDate).toLocaleDateString('de-DE') : '-'}
                </p>
              )}
            </div>

            {/* Getränkechip Nummer */}
            <div className="space-y-2">
              <Label>Getränkechip Nummer</Label>
              {isEditing ? (
                <Input
                  value={(editedUser as any)?.beverageChipNumber || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, beverageChipNumber: e.target.value } as any : null)}
                  placeholder="C-456"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).beverageChipNumber || '-'}</p>
              )}
            </div>

            {/* Getränkechip Ausstellungsdatum */}
            <div className="space-y-2">
              <Label>Getränkechip Ausstellungsdatum</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={(editedUser as any)?.beverageChipIssueDate || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, beverageChipIssueDate: e.target.value } as any : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {(user as any).beverageChipIssueDate ? new Date((user as any).beverageChipIssueDate).toLocaleDateString('de-DE') : '-'}
                </p>
              )}
            </div>

            {/* Getränkechip Status */}
            <div className="space-y-2">
              <Label>Getränkechip Status</Label>
              <Select
                value={(editedUser as any)?.beverageChipStatus || 'Aktiv'}
                onValueChange={(value) => {
                  if (!isEditing || !editedUser) return;
                  setEditedUser({
                    ...editedUser,
                    beverageChipStatus: value
                  } as any);
                }}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktiv">Aktiv</SelectItem>
                  <SelectItem value="Gesperrt">Gesperrt</SelectItem>
                  <SelectItem value="Verlust">Verlust</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
