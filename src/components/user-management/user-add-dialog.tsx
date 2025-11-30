import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoleSelector } from "@/components/user-role-selector";
import { UserRole } from "@/types";

interface FormValues {
  name: string;
  email: string;
  memberNumber: string;
  phone: string;
  boatName: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  streetAddress?: string;
  postalCode?: string;
  city?: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

interface UserAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formValues: FormValues;
  onFormValueChange: (field: string, value: any) => void;
  formErrors: FormErrors;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function UserAddDialog({
  open,
  onOpenChange,
  formValues,
  onFormValueChange,
  formErrors,
  password,
  onPasswordChange,
  onSubmit
}: UserAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Benutzer hinzufügen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Benutzer mit allen erforderlichen Informationen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basis</TabsTrigger>
              <TabsTrigger value="contact">Kontakt & Boot</TabsTrigger>
              <TabsTrigger value="roles">Rollen & Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Max Mustermann"
                    value={formValues.name || ''}
                    onChange={(e) => onFormValueChange('name', e.target.value)}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="max@beispiel.de"
                    value={formValues.email || ''}
                    onChange={(e) => onFormValueChange('email', e.target.value)}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Passwort *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memberNumber">Mitgliedsnummer</Label>
                <Input
                  id="memberNumber"
                  placeholder="Automatisch generiert, falls leer"
                  value={formValues.memberNumber || ''}
                  onChange={(e) => onFormValueChange('memberNumber', e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    placeholder="+43 123 456789"
                    value={formValues.phone || ''}
                    onChange={(e) => onFormValueChange('phone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="boatName">Bootsname</Label>
                  <Input
                    id="boatName"
                    placeholder="Name des Bootes"
                    value={formValues.boatName || ''}
                    onChange={(e) => onFormValueChange('boatName', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="streetAddress">Straße</Label>
                  <Input
                    id="streetAddress"
                    placeholder="Musterstraße 123"
                    value={formValues.streetAddress || ''}
                    onChange={(e) => onFormValueChange('streetAddress', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    placeholder="1234"
                    value={formValues.postalCode || ''}
                    onChange={(e) => onFormValueChange('postalCode', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ort</Label>
                <Input
                  id="city"
                  placeholder="Wien"
                  value={formValues.city || ''}
                  onChange={(e) => onFormValueChange('city', e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="roles" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Rollen</Label>
                <UserRoleSelector
                  selectedRoles={formValues.roles || []}
                  onRolesChange={(roles) => onFormValueChange('roles', roles)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formValues.status || 'active'}
                  onValueChange={(value) => onFormValueChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={onSubmit}>
              Benutzer erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
