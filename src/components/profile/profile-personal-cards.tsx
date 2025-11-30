import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { User as UserType, CustomField } from "@/types";
import { PasswordChangeDialog } from "./password-change-dialog";
import { CustomFieldsSection } from "./custom-fields-section";

interface ProfilePersonalCardsProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  isAdmin: boolean;
  userId?: string;
  aiInfoEnabled: boolean;
  customFields: CustomField[];
  customValues: Record<string, any>;
  editedCustomValues: Record<string, any>;
  fieldsLoading: boolean;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setAiInfoEnabled: (enabled: boolean) => void;
  setEditedCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  addCustomField: (field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteCustomField: (fieldId: string) => Promise<void>;
}

export function ProfilePersonalCards({
  user,
  editedUser,
  isEditing,
  isAdmin,
  userId,
  aiInfoEnabled,
  customFields,
  customValues,
  editedCustomValues,
  fieldsLoading,
  setEditedUser,
  setAiInfoEnabled,
  setEditedCustomValues,
  addCustomField,
  deleteCustomField,
}: ProfilePersonalCardsProps) {
  return (
    <>
      {/* 🔐 Zugangsdaten Card - nur für eigenes Profil oder Admin */}
      {(!userId || isAdmin) && (
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
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
                  <PasswordChangeDialog userId={userId} />
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, memberNumber: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, birthDate: e.target.value } as any : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, streetAddress: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, postalCode: e.target.value } : null)}
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
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, city: e.target.value } : null)}
                  placeholder="Wien"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.city || '-'}</p>
              )}
            </div>

            {/* Custom Fields Section */}
            <CustomFieldsSection
              isAdmin={isAdmin}
              customFields={customFields}
              customValues={customValues}
              editedCustomValues={editedCustomValues}
              isEditing={isEditing}
              fieldsLoading={fieldsLoading}
              onValueChange={(field, value) =>
                setEditedCustomValues((prev) => ({ ...prev, [field]: value }))
              }
              onAddField={addCustomField}
              onDeleteField={deleteCustomField}
            />
          </div>
        </CardContent>
      </Card>

      {/* 🪪 Mitgliedschaft Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
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

      {/* 🤖 AI-Assistent & Datenschutz Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🤖 AI-Assistent & Datenschutz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI-Assistent aktivieren */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ai-enabled"
                  checked={isEditing ? aiInfoEnabled : (user as any).ai_info_enabled}
                  onCheckedChange={(checked) => {
                    if (!isEditing) return;
                    setAiInfoEnabled(checked === true);
                  }}
                  disabled={!isEditing}
                />
                <label
                  htmlFor="ai-enabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  AI-Assistent aktivieren
                </label>
              </div>
            </div>

            {/* Info für AI-Assistent - nur wenn AI aktiviert */}
            {(isEditing ? aiInfoEnabled : (user as any).ai_info_enabled) && (
              <div className="space-y-2 md:col-span-2">
                <Label>Info für AI-Assistent</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedUser as any)?.notes || ""}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, notes: e.target.value } as any : null)}
                    placeholder="Zusätzliche Informationen für den AI-Assistenten..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(user as any).notes || '-'}</p>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <Separator className="my-2" />
            </div>

            {/* Daten öffentlich in KSVL anzeigen */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="data-public"
                  checked={isEditing ? (editedUser as any)?.dataPublicInKsvl : (user as any).dataPublicInKsvl}
                  onCheckedChange={(checked) => {
                    if (!isEditing || !editedUser) return;
                    setEditedUser({
                      ...editedUser,
                      dataPublicInKsvl: checked === true
                    } as any);
                  }}
                  disabled={!isEditing}
                />
                <label
                  htmlFor="data-public"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Daten öffentlich in KSVL anzeigen
                </label>
              </div>
            </div>

            {/* Kontaktdaten öffentlich in KSVL anzeigen */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contact-public"
                  checked={isEditing ? (editedUser as any)?.contactPublicInKsvl : (user as any).contactPublicInKsvl}
                  onCheckedChange={(checked) => {
                    if (!isEditing || !editedUser) return;
                    setEditedUser({
                      ...editedUser,
                      contactPublicInKsvl: checked === true
                    } as any);
                  }}
                  disabled={!isEditing}
                />
                <label
                  htmlFor="contact-public"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Kontaktdaten öffentlich in KSVL anzeigen
                </label>
              </div>
            </div>

            {/* Satzung akzeptiert - readonly */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statute-accepted"
                  checked={(user as any).statuteAccepted || false}
                  disabled
                />
                <label
                  htmlFor="statute-accepted"
                  className="text-sm font-medium leading-none text-muted-foreground"
                >
                  Satzung akzeptiert
                </label>
              </div>
            </div>

            {/* Datenschutz akzeptiert - readonly */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy-accepted"
                  checked={(user as any).privacyAccepted || false}
                  disabled
                />
                <label
                  htmlFor="privacy-accepted"
                  className="text-sm font-medium leading-none text-muted-foreground"
                >
                  Datenschutz akzeptiert
                </label>
              </div>
            </div>

            {/* Newsletter Opt-in */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter-optin"
                  checked={isEditing ? (editedUser as any)?.newsletterOptin : (user as any).newsletterOptin}
                  onCheckedChange={(checked) => {
                    if (!isEditing || !editedUser) return;
                    setEditedUser({
                      ...editedUser,
                      newsletterOptin: checked === true
                    } as any);
                  }}
                  disabled={!isEditing}
                />
                <label
                  htmlFor="newsletter-optin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Newsletter Opt-in
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🆘 Notfallkontakt & Notizen Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🆘 Notfallkontakt & Notizen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notfallkontakt Name */}
            <div className="space-y-2">
              <Label>Notfallkontakt Name</Label>
              {isEditing ? (
                <Input
                  value={(editedUser as any)?.emergencyContactName || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, emergencyContactName: e.target.value } as any : null)}
                  placeholder="Max Mustermann"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).emergencyContactName || '-'}</p>
              )}
            </div>

            {/* Notfallkontakt Telefon */}
            <div className="space-y-2">
              <Label>Notfallkontakt Telefon</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={(editedUser as any)?.emergencyContactPhone || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, emergencyContactPhone: e.target.value } as any : null)}
                  placeholder="+43 123 456789"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).emergencyContactPhone || '-'}</p>
              )}
            </div>

            {/* Notfallkontakt Beziehung */}
            <div className="space-y-2 md:col-span-2">
              <Label>Notfallkontakt Beziehung</Label>
              {isEditing ? (
                <Input
                  value={(editedUser as any)?.emergencyContactRelationship || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, emergencyContactRelationship: e.target.value } as any : null)}
                  placeholder="z.B. Ehepartner, Kind, Geschwister"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{(user as any).emergencyContactRelationship || '-'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Separator className="my-2" />
            </div>

            {/* Notizen - nur wenn AI nicht aktiviert (sonst wird es oben angezeigt) */}
            {!(isEditing ? aiInfoEnabled : (user as any).ai_info_enabled) && (
              <div className="space-y-2 md:col-span-2">
                <Label>Notizen</Label>
                {isEditing ? (
                  <Textarea
                    value={(editedUser as any)?.notes || ""}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, notes: e.target.value } as any : null)}
                    placeholder="Allgemeine Notizen..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(user as any).notes || '-'}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
