import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserType, CustomField } from "@/types";
import { CustomFieldsSection } from "./custom-fields-section";

interface ProfileMasterDataCardProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  isAdmin: boolean;
  customFields: CustomField[];
  customValues: Record<string, any>;
  editedCustomValues: Record<string, any>;
  fieldsLoading: boolean;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setEditedCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  addCustomField: (field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteCustomField: (fieldId: string) => Promise<void>;
}

export function ProfileMasterDataCard({
  user,
  editedUser,
  isEditing,
  isAdmin,
  customFields,
  customValues,
  editedCustomValues,
  fieldsLoading,
  setEditedUser,
  setEditedCustomValues,
  addCustomField,
  deleteCustomField,
}: ProfileMasterDataCardProps) {
  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
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
  );
}
