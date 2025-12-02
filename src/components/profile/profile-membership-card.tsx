import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserType } from "@/types";

interface ProfileMembershipCardProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export function ProfileMembershipCard({
  user,
  editedUser,
  isEditing,
  setEditedUser,
}: ProfileMembershipCardProps) {
  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          🪪 Mitgliedschaft
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mitgliedsnummer */}
          <div className="space-y-2">
            <Label>Mitgliedsnummer *</Label>
            <Input
              value={user.memberNumber}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Eintrittsdatum */}
          <div className="space-y-2">
            <Label>Eintrittsdatum</Label>
            {isEditing ? (
              <Input
                type="date"
                value={(editedUser as any)?.entryDate || ""}
                onChange={(e) => setEditedUser(prev => prev ? { ...prev, entryDate: e.target.value } as any : null)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {(user as any).entryDate ? new Date((user as any).entryDate).toLocaleDateString('de-DE') : '-'}
              </p>
            )}
          </div>

          {/* Mitgliedsart */}
          <div className="space-y-2">
            <Label>Mitgliedsart</Label>
            <Select
              value={(editedUser as any)?.membershipType || ''}
              onValueChange={(value) => {
                if (!isEditing || !editedUser) return;
                setEditedUser({
                  ...editedUser,
                  membershipType: value
                } as any);
              }}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wähle Mitgliedsart" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ordentlich">Ordentlich</SelectItem>
                <SelectItem value="Außerordentlich">Außerordentlich</SelectItem>
                <SelectItem value="Ehrenmitglied">Ehrenmitglied</SelectItem>
                <SelectItem value="Jugend">Jugend</SelectItem>
                <SelectItem value="Gast">Gast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vereinsstatus */}
          <div className="space-y-2">
            <Label>Vereinsstatus</Label>
            <Select
              value={(editedUser as any)?.membershipStatus || 'Aktiv'}
              onValueChange={(value) => {
                if (!isEditing || !editedUser) return;
                setEditedUser({
                  ...editedUser,
                  membershipStatus: value
                } as any);
              }}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktiv">Aktiv</SelectItem>
                <SelectItem value="Probezeit">Probezeit</SelectItem>
                <SelectItem value="Ruhend">Ruhend</SelectItem>
                <SelectItem value="Beendet (Austritt)">Beendet (Austritt)</SelectItem>
                <SelectItem value="Gestrichen">Gestrichen</SelectItem>
                <SelectItem value="Ausgeschlossen">Ausgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vorstand Funktion */}
          <div className="space-y-2">
            <Label>Vorstand Funktion</Label>
            <Select
              value={(editedUser as any)?.vorstandFunktion || 'Keine'}
              onValueChange={(value) => {
                if (!isEditing || !editedUser) return;
                setEditedUser({
                  ...editedUser,
                  vorstandFunktion: value
                } as any);
              }}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Keine">Keine</SelectItem>
                <SelectItem value="Obmann">Obmann</SelectItem>
                <SelectItem value="Obmann-Stellvertreter">Obmann-Stellvertreter</SelectItem>
                <SelectItem value="Schriftführer">Schriftführer</SelectItem>
                <SelectItem value="Kassier">Kassier</SelectItem>
                <SelectItem value="Beirat">Beirat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ÖSV-Nummer */}
          <div className="space-y-2">
            <Label>ÖSV-Nummer</Label>
            {isEditing ? (
              <Input
                value={(editedUser as any)?.oesvNumber || ""}
                onChange={(e) => setEditedUser(prev => prev ? { ...prev, oesvNumber: e.target.value } as any : null)}
                placeholder="12345"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{(user as any).oesvNumber || '-'}</p>
            )}
          </div>

          {/* Amtsbeginn - nur wenn Vorstand-Funktion != "Keine" */}
          {(editedUser as any)?.vorstandFunktion && (editedUser as any)?.vorstandFunktion !== 'Keine' && (
            <>
              <div className="space-y-2">
                <Label>Amtsbeginn</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any)?.boardPositionStartDate || ""}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, boardPositionStartDate: e.target.value } as any : null)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {(user as any).boardPositionStartDate ? new Date((user as any).boardPositionStartDate).toLocaleDateString('de-DE') : '-'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amtsende</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any)?.boardPositionEndDate || ""}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, boardPositionEndDate: e.target.value } as any : null)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {(user as any).boardPositionEndDate ? new Date((user as any).boardPositionEndDate).toLocaleDateString('de-DE') : '-'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
