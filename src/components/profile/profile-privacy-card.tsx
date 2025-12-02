import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { User as UserType } from "@/types";

interface ProfilePrivacyCardProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  aiInfoEnabled: boolean;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setAiInfoEnabled: (enabled: boolean) => void;
}

export function ProfilePrivacyCard({
  user,
  editedUser,
  isEditing,
  aiInfoEnabled,
  setEditedUser,
  setAiInfoEnabled,
}: ProfilePrivacyCardProps) {
  return (
    <>
      {/* 🤖 AI-Assistent & Datenschutz Card */}
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
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
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
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
