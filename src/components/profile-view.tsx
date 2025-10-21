import { useState, useEffect } from "react";
import { Edit, Save, X, Plus, Trash2, User, Mail, Phone, Anchor, Settings, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { User as UserType, UserRole, CustomField, ProfileViewProps, generateRolesFromPrimary } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Mock current users based on role
const mockCurrentUsers: Record<UserRole, UserType> = {
  gastmitglied: {
    id: "0",
    name: "Gast User",
    email: "gast@email.com",
    phone: "+43 664 000 0000",
    boatName: "Gast Boot",
    memberNumber: "KSVL000",
    role: "gastmitglied",
    roles: generateRolesFromPrimary("gastmitglied"),
    status: "active",
    joinDate: "2024-01-01",
    joinedAt: "2024-01-01",
    isActive: true
  },
  mitglied: {
    id: "1",
    name: "Hans Müller",
    email: "hans.mueller@email.com",
    phone: "+43 664 123 4567",
    boatName: "Seeadler",
    memberNumber: "KSVL001",
    role: "mitglied",
    roles: generateRolesFromPrimary("mitglied"),
    status: "active",
    joinDate: "2023-01-15",
    joinedAt: "2023-01-15",
    isActive: true
  },
  kranfuehrer: {
    id: "3",
    name: "Franz Weber",
    email: "f.weber@email.com",
    phone: "+43 664 345 6789",
    memberNumber: "KSVL003",
    role: "kranfuehrer",
    roles: generateRolesFromPrimary("kranfuehrer"),
    status: "active",
    joinDate: "2022-05-10",
    joinedAt: "2022-05-10",
    isActive: true
  },
  admin: {
    id: "4",
    name: "Anna Bauer",
    email: "anna.bauer@email.com",
    phone: "+43 664 456 7890",
    memberNumber: "KSVL004",
    role: "admin",
    roles: generateRolesFromPrimary("admin"),
    status: "active",
    joinDate: "2022-01-01",
    joinedAt: "2022-01-01",
    isActive: true
  },
  vorstand: {
    id: "5",
    name: "Dr. Vorstand",
    email: "vorstand@email.com",
    phone: "+43 664 555 5555",
    memberNumber: "KSVL005",
    role: "vorstand",
    roles: generateRolesFromPrimary("vorstand"),
    status: "active",
    joinDate: "2021-01-01",
    joinedAt: "2021-01-01",
    isActive: true
  }
};

// Mock custom fields (globally defined by admin)
const initialCustomFields: CustomField[] = [
  {
    id: "emergency_contact",
    name: "emergencyContact",
    label: "Notfallkontakt",
    type: "text",
    required: false,
    placeholder: "Name und Telefonnummer"
  },
  {
    id: "sailing_experience",
    name: "sailingExperience",
    label: "Segelerfahrung",
    type: "select",
    required: false,
    options: ["Anfänger", "Fortgeschritten", "Profi", "Instructor"]
  },
  {
    id: "notes",
    name: "notes",
    label: "Notizen",
    type: "textarea",
    required: false,
    placeholder: "Zusätzliche Informationen..."
  }
];

// ProfileViewProps is now imported from @/types

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator",
  vorstand: "Vorstand"
};

const roleColors: Record<UserRole, string> = {
  gastmitglied: "bg-muted text-muted-foreground",
  mitglied: "bg-accent text-accent-foreground",
  kranfuehrer: "bg-gradient-ocean text-primary-foreground",
  admin: "bg-gradient-deep text-primary-foreground",
  vorstand: "bg-gradient-deep text-primary-foreground"
};

interface ProfileComponentProps {
  currentRole?: UserRole;
  userId?: string; // Optional: Wenn gesetzt, zeigt es das Profil eines anderen Benutzers (für Admin)
  onUpdate?: () => void; // Optional: Callback nach Update
  isDialog?: boolean; // Optional: Zeigt an, ob es in einem Dialog angezeigt wird
  onBack?: () => void; // Optional: Callback zum Zurück-Button
}

export function ProfileView({ currentRole, userId, onUpdate, isDialog = false, onBack }: ProfileComponentProps = {}) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>(initialCustomFields);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingFields, setIsManagingFields] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [editedCustomValues, setEditedCustomValues] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  // New custom field form
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: ""
  });

  useEffect(() => {
    loadCurrentUser();
    checkAdminStatus();
  }, [userId]);
  
  const checkAdminStatus = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);
      
      setIsAdmin(roles?.some(r => r.role === 'admin') || false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      
      // If userId is provided, load that user's profile (admin view)
      // Otherwise, load the current authenticated user's profile
      let targetUserId: string;
      
      if (userId) {
        targetUserId = userId;
      } else {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          throw new Error('Nicht angemeldet');
        }
        targetUserId = authUser.id;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId);

      if (rolesError) throw rolesError;

      const roles = userRoles?.map(r => r.role as UserRole) || [];
      const primaryRole = roles.find(r => r !== 'mitglied') || roles[0] || 'mitglied';

      const userData: UserType = {
        id: profile.id,
        name: profile.name || '',
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        email: profile.email,
        phone: profile.phone || '',
        boatName: profile.boat_name || '',
        memberNumber: profile.member_number || '',
        streetAddress: profile.street_address || undefined,
        postalCode: profile.postal_code || undefined,
        city: profile.city || undefined,
        roles: roles,
        role: primaryRole as UserRole,
        status: (profile.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        joinDate: profile.entry_date || profile.created_at || '',
        joinedAt: profile.entry_date || profile.created_at || '',
        isActive: profile.status === 'active',
        oesvNumber: profile.oesv_number || '',
        address: profile.address || '',
        berthNumber: profile.berth_number || '',
        berthType: profile.berth_type || '',
        birthDate: profile.birth_date || '',
        entryDate: profile.entry_date || '',
        dinghyBerthNumber: profile.dinghy_berth_number || '',
        boatType: profile.boat_type || '',
        boatLength: profile.boat_length || undefined,
        boatWidth: profile.boat_width || undefined,
        parkingPermitNumber: profile.parking_permit_number || '',
        parkingPermitIssueDate: profile.parking_permit_issue_date || '',
        beverageChipNumber: profile.beverage_chip_number || '',
        beverageChipIssueDate: profile.beverage_chip_issue_date || '',
        emergencyContact: profile.emergency_contact || '',
        notes: profile.notes || ''
      } as any;

      setUser(userData);
      setEditedUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedUser) return;
    
    try {
      // Use userId if provided (admin mode), otherwise use current user
      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Nicht angemeldet');
        targetUserId = authUser.id;
      }

      // If admin is editing another user and roles changed, use manage-user function
      if (isAdmin && userId && editedUser.roles) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Nicht angemeldet');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'update',
            userId: targetUserId,
            userData: {
              name: editedUser.name,
              firstName: editedUser.firstName,
              lastName: editedUser.lastName,
              phone: editedUser.phone,
              memberNumber: editedUser.memberNumber,
              boatName: editedUser.boatName,
              roles: editedUser.roles,
              oesvNumber: (editedUser as any).oesvNumber,
              address: (editedUser as any).address,
              streetAddress: editedUser.streetAddress,
              postalCode: editedUser.postalCode,
              city: editedUser.city,
              berthNumber: (editedUser as any).berthNumber,
              berthType: (editedUser as any).berthType,
              birthDate: (editedUser as any).birthDate,
              entryDate: (editedUser as any).entryDate,
              dinghyBerthNumber: (editedUser as any).dinghyBerthNumber,
              boatType: (editedUser as any).boatType,
              boatLength: (editedUser as any).boatLength,
              boatWidth: (editedUser as any).boatWidth,
              parkingPermitNumber: (editedUser as any).parkingPermitNumber,
              parkingPermitIssueDate: (editedUser as any).parkingPermitIssueDate,
              beverageChipNumber: (editedUser as any).beverageChipNumber,
              beverageChipIssueDate: (editedUser as any).beverageChipIssueDate,
              emergencyContact: (editedUser as any).emergencyContact,
              notes: (editedUser as any).notes
            }
          })
        });

        const result = await response.json();
        if (!response.ok || result.error) {
          throw new Error(result.error || 'Benutzer konnte nicht aktualisiert werden');
        }
      } else {
        // Regular profile update without role changes
        const { error } = await supabase
          .from('profiles')
          .update({
            name: editedUser.name,
            first_name: editedUser.firstName || null,
            last_name: editedUser.lastName || null,
            phone: editedUser.phone || null,
            member_number: editedUser.memberNumber || null,
            boat_name: editedUser.boatName || null,
            street_address: editedUser.streetAddress || null,
            postal_code: editedUser.postalCode || null,
            city: editedUser.city || null,
            oesv_number: (editedUser as any).oesvNumber || null,
            address: (editedUser as any).address || null,
            berth_number: (editedUser as any).berthNumber || null,
            berth_type: (editedUser as any).berthType || null,
            birth_date: (editedUser as any).birthDate || null,
            entry_date: (editedUser as any).entryDate || null,
            dinghy_berth_number: (editedUser as any).dinghyBerthNumber || null,
            boat_type: (editedUser as any).boatType || null,
            boat_length: (editedUser as any).boatLength || null,
            boat_width: (editedUser as any).boatWidth || null,
            parking_permit_number: (editedUser as any).parkingPermitNumber || null,
            parking_permit_issue_date: (editedUser as any).parkingPermitIssueDate || null,
            beverage_chip_number: (editedUser as any).beverageChipNumber || null,
            beverage_chip_issue_date: (editedUser as any).beverageChipIssueDate || null,
            emergency_contact: (editedUser as any).emergencyContact || null,
            notes: (editedUser as any).notes || null
          })
          .eq('id', targetUserId);

        if (error) throw error;
      }

      setUser(editedUser);
      setCustomValues(editedCustomValues);
      setIsEditing(false);
      toast({
        title: "Profil gespeichert",
        description: "Ihre Profildaten wurden erfolgreich aktualisiert."
      });
      
      loadCurrentUser(); // Reload to ensure fresh data
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleAddCustomField = () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Fehler",
        description: "Name und Label sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    const field: CustomField = {
      id: Date.now().toString(),
      name: newField.name,
      label: newField.label,
      type: newField.type || "text",
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.type === "select" ? newField.options : undefined
    };

    setCustomFields(prev => [...prev, field]);
    setNewField({
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: ""
    });

    toast({
      title: "Feld hinzugefügt",
      description: `Das Feld "${field.label}" wurde zu allen Profilen hinzugefügt.`
    });
  };

  const handleDeleteCustomField = (fieldId: string) => {
    const field = customFields.find(f => f.id === fieldId);
    setCustomFields(prev => prev.filter(f => f.id !== fieldId));
    
    // Remove values for this field
    setCustomValues(prev => {
      const newValues = { ...prev };
      delete newValues[field?.name || ""];
      return newValues;
    });

    toast({
      title: "Feld entfernt",
      description: `Das Feld "${field?.label}" wurde von allen Profilen entfernt.`
    });
  };

  const renderCustomField = (field: CustomField, isEditing: boolean) => {
    const value = isEditing ? editedCustomValues[field.name] : customValues[field.name];
    
    if (!isEditing) {
      if (!value) return null;
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
      );
    }

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ""}
              onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </div>
        );
      
      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(newValue) => setEditedCustomValues(prev => ({ ...prev, [field.name]: newValue }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Auswählen..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={value || ""}
              onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Lade Profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Profil konnte nicht geladen werden.</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {userId ? "Benutzerprofil" : "Mein Profil"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {userId ? "Benutzerdaten ansehen und bearbeiten" : "Verwalten Sie Ihre Kontoinformationen"}
          </p>
        </div>
        
        {!isEditing && (
          <Button onClick={() => {
            setIsEditing(true);
            setEditedUser(user);
            setEditedCustomValues(customValues);
          }}>
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                  {user.status === "active" ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Rollen - Nur für Admins sichtbar */}
          {isAdmin && userId && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b pb-2">Rollen</h3>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Reihenfolge: Admin, Vorstand, Kranführer, Mitglied, Gastmitglied */}
                  {(['admin', 'vorstand', 'kranfuehrer', 'mitglied', 'gastmitglied'] as UserRole[]).map((role) => {
                    const isChecked = editedUser?.roles?.includes(role) || false;
                    
                    return (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (!editedUser) return;
                            const currentRoles = editedUser.roles || [];
                            let newRoles: UserRole[];
                            
                            if (checked) {
                              newRoles = [...currentRoles, role];
                            } else {
                              newRoles = currentRoles.filter(r => r !== role);
                            }
                            
                            // Update primary role if needed
                            const primaryRole = newRoles.find(r => r === 'vorstand') 
                              || newRoles.find(r => r === 'admin') 
                              || newRoles.find(r => r === 'kranfuehrer') 
                              || newRoles.find(r => r === 'mitglied') 
                              || 'gastmitglied';
                            
                            setEditedUser({
                              ...editedUser,
                              roles: newRoles,
                              role: primaryRole
                            });
                          }}
                        />
                          <label
                            htmlFor={`role-${role}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {roleLabels[role]}
                          </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* Reihenfolge: Admin, Vorstand, Kranführer, Mitglied, Gastmitglied */}
                  {(['admin', 'vorstand', 'kranfuehrer', 'mitglied', 'gastmitglied'] as UserRole[])
                    .filter(role => user.roles?.includes(role))
                    .map((role) => (
                      <Badge key={role} className={cn("text-xs", roleColors[role])}>
                        {roleLabels[role]}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          )}
          
          {/* Grunddaten - User-Name und Passwort */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Grunddaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User-Name</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.name}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, name: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.name}</span>
                  </div>
                )}
              </div>

              {isAdmin && userId && (
                <div className="space-y-2">
                  <Label>Passwort</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Neues Passwort eingeben..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">********</span>
                  )}
                </div>
              )}
            </div>
            
            {isAdmin && userId && isEditing && newPassword && (
              <p className="text-sm text-muted-foreground">
                Das Passwort wird beim Speichern geändert
              </p>
            )}
          </div>
          
          {/* Stammdaten */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Stammdaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mitgliedernummer</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.memberNumber || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, memberNumber: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                    {user.memberNumber || '-'}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Vorname</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.firstName || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, firstName: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.firstName || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nachname</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.lastName || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, lastName: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.lastName || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Telefonnummer</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone || '-'}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Adresse</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.streetAddress || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, streetAddress: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.streetAddress || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>PLZ</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.postalCode || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, postalCode: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.postalCode || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Stadt</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.city || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, city: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.city || '-'}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Geburtsdatum</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any).birthDate || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, birthDate: e.target.value } as any))}
                  />
                ) : (
                  <span className="text-sm">
                    {(user as any).birthDate ? new Date((user as any).birthDate).toLocaleDateString('de-AT') : "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Eintrittsdatum</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any).entryDate || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, entryDate: e.target.value } as any))}
                  />
                ) : (
                  <span className="text-sm">
                    {(user as any).entryDate ? new Date((user as any).entryDate).toLocaleDateString('de-AT') : "-"}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Segeldaten */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Segeldaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ÖSV Mitgliedsnummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).oesvNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, oesvNumber: e.target.value } as any))}
                    placeholder="ÖSV Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).oesvNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Liegeplatznummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).berthNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, berthNumber: e.target.value } as any))}
                    placeholder="Liegeplatz Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).berthNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Beibootplatznummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).dinghyBerthNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, dinghyBerthNumber: e.target.value } as any))}
                    placeholder="Beibootplatz Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).dinghyBerthNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Liegeplatztyp</Label>
                {isEditing ? (
                  <Select
                    value={(editedUser as any).berthType || ""}
                    onValueChange={(value) => setEditedUser(prev => ({ ...prev, berthType: value } as any))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Typ auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schwimmsteg">Schwimmsteg</SelectItem>
                      <SelectItem value="festliegeplatz">Festliegeplatz</SelectItem>
                      <SelectItem value="bojenplatz">Bojenplatz</SelectItem>
                      <SelectItem value="trockenplatz">Trockenplatz</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm">{(user as any).berthType || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bootstyp</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).boatType || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, boatType: e.target.value } as any))}
                    placeholder="z.B. Segelboot, Motorboot"
                  />
                ) : (
                  <span className="text-sm">{(user as any).boatType || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bootsname</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.boatName || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, boatName: e.target.value }))}
                    placeholder="Name Ihres Bootes"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.boatName || '-'}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bootslänge (m)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={(editedUser as any).boatLength || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, boatLength: e.target.value ? parseFloat(e.target.value) : undefined } as any))}
                    placeholder="z.B. 8.5"
                  />
                ) : (
                  <span className="text-sm">{(user as any).boatLength ? `${(user as any).boatLength} m` : "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bootsbreite (m)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={(editedUser as any).boatWidth || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, boatWidth: e.target.value ? parseFloat(e.target.value) : undefined } as any))}
                    placeholder="z.B. 2.8"
                  />
                ) : (
                  <span className="text-sm">{(user as any).boatWidth ? `${(user as any).boatWidth} m` : "-"}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Parkplatz und Getränke */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Parkplatz und Getränke</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parkberechtigungs-Nummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).parkingPermitNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, parkingPermitNumber: e.target.value } as any))}
                    placeholder="Parkausweis Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).parkingPermitNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Ausgabedatum</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any).parkingPermitIssueDate || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, parkingPermitIssueDate: e.target.value } as any))}
                  />
                ) : (
                  <span className="text-sm">
                    {(user as any).parkingPermitIssueDate ? new Date((user as any).parkingPermitIssueDate).toLocaleDateString('de-AT') : "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Getränkechip-Nummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).beverageChipNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, beverageChipNumber: e.target.value } as any))}
                    placeholder="Chip Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).beverageChipNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Ausgabedatum</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any).beverageChipIssueDate || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, beverageChipIssueDate: e.target.value } as any))}
                  />
                ) : (
                  <span className="text-sm">
                    {(user as any).beverageChipIssueDate ? new Date((user as any).beverageChipIssueDate).toLocaleDateString('de-AT') : "-"}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Zusätzliche Informationen (Custom Fields) */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b pb-2">Zusätzliche Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map(field => renderCustomField(field, isEditing))}
              </div>
            </div>
          )}
          
          {/* Notfallkontakt */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Notfallkontakt</h3>
            
            <div className="space-y-2">
              {isEditing ? (
                <Textarea
                  value={(editedUser as any).emergencyContact || ""}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, emergencyContact: e.target.value } as any))}
                  placeholder="Name, Telefonnummer und Beziehung"
                  rows={3}
                />
              ) : (
                <p className="text-sm">{(user as any).emergencyContact || "-"}</p>
              )}
            </div>
          </div>
          
          {/* Notizen */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Notizen</h3>
            
            <div className="space-y-2">
              {isEditing ? (
                <Textarea
                  value={(editedUser as any).notes || ""}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, notes: e.target.value } as any))}
                  placeholder="Zusätzliche Notizen..."
                  rows={4}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{(user as any).notes || "-"}</p>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="pt-6 border-t">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditedUser(user);
                  setEditedCustomValues(customValues);
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Abbrechen
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Field Management - Bottom Section */}
      {currentRole === "admin" && (
        <div className="flex justify-center">
          <Dialog open={isManagingFields} onOpenChange={setIsManagingFields}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Felder verwalten
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Benutzerdefinierte Felder verwalten</DialogTitle>
                <DialogDescription className="sr-only">
                  Verwalten Sie benutzerdefinierte Felder für Ihr Profil
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Existing Fields */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vorhandene Felder</Label>
                  {customFields.map(field => (
                    <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.type}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCustomField(field.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Add New Field */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Neues Feld hinzufügen</Label>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Feld-Name (z.B. emergencyContact)"
                      value={newField.name || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Anzeige-Label (z.B. Notfallkontakt)"
                      value={newField.label || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                    />
                    <Select
                      value={newField.type}
                      onValueChange={(value: CustomField["type"]) => setNewField(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Textbereich</SelectItem>
                        <SelectItem value="select">Auswahl</SelectItem>
                        <SelectItem value="number">Zahl</SelectItem>
                        <SelectItem value="date">Datum</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {newField.type === "select" && (
                      <Input
                        placeholder="Optionen (kommagetrennt)"
                        onChange={(e) => setNewField(prev => ({ 
                          ...prev, 
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                      />
                    )}
                    
                    <Input
                      placeholder="Platzhalter-Text (optional)"
                      value={newField.placeholder || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                    />
                  </div>
                  
                  <Button onClick={handleAddCustomField} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Feld hinzufügen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );

  if (isDialog) {
    return content;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          ← Zurück zur Übersicht
        </Button>
      )}
      {content}
    </div>
  );
}
