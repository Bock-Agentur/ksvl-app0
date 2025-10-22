import { useState, useEffect } from "react";
import { Edit, Save, X, Plus, Trash2, User, Mail, Phone, Anchor, Settings, Key } from "lucide-react";
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
import { useRole } from "@/hooks/use-role";
import { useCustomFields, useCustomFieldValues } from "@/hooks/use-custom-fields";

// ProfileViewProps is now imported from @/types

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator",
  vorstand: "Vorstand"
};

const roleColors: Record<UserRole, string> = {
  gastmitglied: "bg-[hsl(202_85%_23%)] text-white",
  mitglied: "bg-[hsl(202_85%_23%)] text-white",
  kranfuehrer: "bg-[hsl(202_85%_23%)] text-white",
  admin: "bg-[hsl(202_85%_23%)] text-white",
  vorstand: "bg-[hsl(202_85%_23%)] text-white"
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
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingFields, setIsManagingFields] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [editedCustomValues, setEditedCustomValues] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const { currentUser: roleCurrentUser, currentRole: roleCurrentRole } = useRole();
  
  // Load custom fields from database
  const { customFields, loading: fieldsLoading, addCustomField, deleteCustomField } = useCustomFields();
  
  // Load custom field values for the user
  const targetUserId = userId || roleCurrentUser?.id;
  const { customValues, saveCustomValue, saveAllCustomValues } = useCustomFieldValues(targetUserId || '');

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
  }, [userId, roleCurrentUser]);
  
  useEffect(() => {
    if (customValues) {
      setEditedCustomValues(customValues);
    }
  }, [customValues]);
  
  const checkAdminStatus = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);
      
      // Admin or Vorstand can edit restricted fields
      setIsAdmin(roles?.some(r => r.role === 'admin' || r.role === 'vorstand') || false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      
      // If userId is provided, load that user's profile (admin view)
      // Otherwise, use the current user from RoleContext (respects role switching)
      let targetUserId: string;
      
      if (userId) {
        targetUserId = userId;
      } else if (roleCurrentUser) {
        // Use the current user from RoleContext (role switching aware)
        targetUserId = roleCurrentUser.id;
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
        notes: profile.notes || '',
        vorstandFunktion: profile.vorstand_funktion || '',
        dataPublicInKsvl: profile.data_public_in_ksvl === true,
        contactPublicInKsvl: profile.contact_public_in_ksvl === true
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      // Determine target user ID
      let targetUserId: string;
      if (userId) {
        // Admin editing another user
        targetUserId = userId;
      } else {
        // User editing their own profile
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Nicht angemeldet');
        targetUserId = authUser.id;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht angemeldet');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: targetUserId,
          newPassword: newPassword
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Passwort konnte nicht geändert werden');
      }

      toast({
        title: "Passwort geändert",
        description: "Das Passwort wurde erfolgreich aktualisiert."
      });
      
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
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
              notes: (editedUser as any).notes,
              vorstandFunktion: (editedUser as any).vorstandFunktion,
              dataPublicInKsvl: (editedUser as any).dataPublicInKsvl,
              contactPublicInKsvl: (editedUser as any).contactPublicInKsvl
            }
          })
        });

        const result = await response.json();
        if (!response.ok || result.error) {
          throw new Error(result.error || 'Benutzer konnte nicht aktualisiert werden');
        }
      } else {
        // Regular profile update without role changes
        // Helper function to convert empty strings and undefined to null
        const toNullIfEmpty = (value: any) => {
          if (value === '' || value === undefined) return null;
          return value;
        };

        const updateData: any = {
          name: editedUser.name,
          first_name: toNullIfEmpty(editedUser.firstName),
          last_name: toNullIfEmpty(editedUser.lastName),
          phone: toNullIfEmpty(editedUser.phone),
          member_number: toNullIfEmpty(editedUser.memberNumber),
          boat_name: toNullIfEmpty(editedUser.boatName),
          street_address: toNullIfEmpty(editedUser.streetAddress),
          postal_code: toNullIfEmpty(editedUser.postalCode),
          city: toNullIfEmpty(editedUser.city),
          oesv_number: toNullIfEmpty((editedUser as any).oesvNumber),
          address: toNullIfEmpty((editedUser as any).address),
          berth_number: toNullIfEmpty((editedUser as any).berthNumber),
          berth_type: toNullIfEmpty((editedUser as any).berthType),
          birth_date: toNullIfEmpty((editedUser as any).birthDate),
          entry_date: toNullIfEmpty((editedUser as any).entryDate),
          dinghy_berth_number: toNullIfEmpty((editedUser as any).dinghyBerthNumber),
          boat_type: toNullIfEmpty((editedUser as any).boatType),
          boat_length: toNullIfEmpty((editedUser as any).boatLength),
          boat_width: toNullIfEmpty((editedUser as any).boatWidth),
          parking_permit_number: toNullIfEmpty((editedUser as any).parkingPermitNumber),
          parking_permit_issue_date: toNullIfEmpty((editedUser as any).parkingPermitIssueDate),
          beverage_chip_number: toNullIfEmpty((editedUser as any).beverageChipNumber),
          beverage_chip_issue_date: toNullIfEmpty((editedUser as any).beverageChipIssueDate),
          emergency_contact: toNullIfEmpty((editedUser as any).emergencyContact),
          notes: toNullIfEmpty((editedUser as any).notes),
          vorstand_funktion: toNullIfEmpty((editedUser as any).vorstandFunktion),
          data_public_in_ksvl: (editedUser as any).dataPublicInKsvl === true,
          contact_public_in_ksvl: (editedUser as any).contactPublicInKsvl === true
        };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', targetUserId);

        if (error) throw error;
      }

      setUser(editedUser);
      
      // Save custom field values to database
      if (Object.keys(editedCustomValues).length > 0) {
        await saveAllCustomValues(customFields, editedCustomValues);
      }
      
      setIsEditing(false);
      toast({
        title: "Profil gespeichert",
        description: "Ihre Profildaten wurden erfolgreich aktualisiert.",
        userName: roleCurrentUser?.name || editedUser.name,
        userRole: roleCurrentRole
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

  const handleAddCustomField = async () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Fehler",
        description: "Name und Label sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addCustomField({
        name: newField.name!,
        label: newField.label!,
        type: newField.type || "text",
        required: newField.required || false,
        placeholder: newField.placeholder,
        options: newField.type === "select" ? newField.options : undefined
      });

      setNewField({
        name: "",
        label: "",
        type: "text",
        required: false,
        placeholder: ""
      });

      toast({
        title: "Feld hinzugefügt",
        description: `Das Feld "${newField.label}" wurde zu allen Profilen hinzugefügt.`
      });
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Fehler",
        description: "Feld konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomField = async (fieldId: string) => {
    const field = customFields.find(f => f.id === fieldId);
    
    try {
      await deleteCustomField(fieldId);

      toast({
        title: "Feld entfernt",
        description: `Das Feld "${field?.label}" wurde von allen Profilen entfernt.`
      });
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Fehler",
        description: "Feld konnte nicht entfernt werden.",
        variant: "destructive"
      });
    }
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
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-ocean flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-1">{user.name}</CardTitle>
              {user?.roles?.includes('vorstand') && (user as any).vorstandFunktion && (
                <p className="text-sm text-muted-foreground mb-2">{(user as any).vorstandFunktion}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {user.roles?.map((role) => (
                  <Badge key={role} className={cn("text-xs", roleColors[role])}>
                    {roleLabels[role]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Rollen - Nur für Admins sichtbar */}
          {isAdmin && userId && (
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Rollen</h3>
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
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Grunddaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>User-Name:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    name="username"
                    autoComplete="username"
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

              <div className="space-y-2">
                <Label>Passwort:</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">********</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordDialog(true)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  Passwort ändern
                </button>
              </div>
            </div>
          </div>
          
          {/* Stammdaten */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Stammdaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Mitgliedernummer:</Label>
                {isEditing ? (
                  <Input
                    name="member-number"
                    autoComplete="off"
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
                <Label>Vorname:</Label>
                {isEditing ? (
                  <Input
                    name="given-name"
                    autoComplete="given-name"
                    value={editedUser.firstName || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, firstName: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.firstName || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nachname:</Label>
                {isEditing ? (
                  <Input
                    name="family-name"
                    autoComplete="family-name"
                    value={editedUser.lastName || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, lastName: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.lastName || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email:</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
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
                <Label>Telefonnummer:</Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    inputMode="tel"
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
                <Label>Adresse:</Label>
                {isEditing ? (
                  <Input
                    name="street-address"
                    autoComplete="street-address"
                    value={editedUser.streetAddress || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, streetAddress: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.streetAddress || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>PLZ:</Label>
                {isEditing ? (
                  <Input
                    name="postal-code"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={editedUser.postalCode || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, postalCode: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.postalCode || '-'}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Stadt:</Label>
                {isEditing ? (
                  <Input
                    name="address-level2"
                    autoComplete="address-level2"
                    value={editedUser.city || ''}
                    onChange={(e) => setEditedUser(prev => ({ ...prev!, city: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm">{user.city || '-'}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Geburtsdatum:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    type="date"
                    name="bday"
                    autoComplete="bday"
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
                <Label>Eintrittsdatum:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    type="date"
                    name="entry-date"
                    autoComplete="off"
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
            
            {/* Öffentliche Daten im KSVL */}
            <div className="space-y-3 pt-4 mt-4 border-t">
              <h4 className="text-sm font-medium text-foreground">Öffentliche Anzeige</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="data-public"
                  checked={(editedUser as any).dataPublicInKsvl || false}
                  onCheckedChange={(checked) => 
                    setEditedUser(prev => ({ ...prev, dataPublicInKsvl: checked } as any))
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="data-public" className="text-sm font-normal cursor-pointer">
                  Meine Daten öffentlich im KSVL anzeigen (Name, Mitgliedsnummer, Boot, Liegeplatz)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contact-public"
                  checked={(editedUser as any).contactPublicInKsvl || false}
                  onCheckedChange={(checked) => 
                    setEditedUser(prev => ({ ...prev, contactPublicInKsvl: checked } as any))
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="contact-public" className="text-sm font-normal cursor-pointer">
                  Email und Telefonnummer öffentlich im KSVL anzeigen
                </Label>
              </div>
            </div>
          </div>
          
          {/* Vorstand Bereich (nur sichtbar wenn Vorstand-Rolle aktiv) */}
          {(isEditing ? editedUser.roles?.includes('vorstand') : user?.roles?.includes('vorstand')) && (
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Vorstand</h3>
              
              <div className="space-y-2">
                <Label>Funktion im Vorstand:</Label>
                {isEditing ? (
                  <Input
                    name="vorstand-funktion"
                    autoComplete="off"
                    value={(editedUser as any).vorstandFunktion || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, vorstandFunktion: e.target.value } as any))}
                    placeholder="z.B. Obmann, Kassier, Schriftführer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).vorstandFunktion || "-"}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Segeldaten */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Segeldaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>ÖSV Mitgliedsnummer:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    name="oesv-number"
                    autoComplete="off"
                    value={(editedUser as any).oesvNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, oesvNumber: e.target.value } as any))}
                    placeholder="ÖSV Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).oesvNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Liegeplatznummer:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    name="berth-number"
                    autoComplete="off"
                    value={(editedUser as any).berthNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, berthNumber: e.target.value } as any))}
                    placeholder="Liegeplatz Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).berthNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Beibootplatznummer:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    name="dinghy-berth-number"
                    autoComplete="off"
                    value={(editedUser as any).dinghyBerthNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, dinghyBerthNumber: e.target.value } as any))}
                    placeholder="Beibootplatz Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).dinghyBerthNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Liegeplatztyp:</Label>
                {isEditing ? (
                  <Select
                    name="berth-type"
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
                <Label>Bootstyp:</Label>
                {isEditing ? (
                  <Input
                    name="boat-type"
                    autoComplete="off"
                    value={(editedUser as any).boatType || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, boatType: e.target.value } as any))}
                    placeholder="z.B. Segelboot, Motorboot"
                  />
                ) : (
                  <span className="text-sm">{(user as any).boatType || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bootsname:</Label>
                {isEditing ? (
                  <Input
                    name="boat-name"
                    autoComplete="off"
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
                <Label>Bootslänge (m):</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    name="boat-length"
                    autoComplete="off"
                    inputMode="decimal"
                    value={(editedUser as any).boatLength || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, boatLength: e.target.value ? parseFloat(e.target.value) : undefined } as any))}
                    placeholder="z.B. 8.5"
                  />
                ) : (
                  <span className="text-sm">{(user as any).boatLength ? `${(user as any).boatLength} m` : "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Bootsbreite (m):</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    name="boat-width"
                    autoComplete="off"
                    inputMode="decimal"
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
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Parkplatz und Getränke</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Parkberechtigungs-Nummer:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    name="parking-permit-number"
                    autoComplete="off"
                    value={(editedUser as any).parkingPermitNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, parkingPermitNumber: e.target.value } as any))}
                    placeholder="Parkausweis Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).parkingPermitNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Ausgabedatum:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    type="date"
                    name="parking-permit-issue-date"
                    autoComplete="off"
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
                <Label>Getränkechip-Nummer:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    name="beverage-chip-number"
                    autoComplete="off"
                    value={(editedUser as any).beverageChipNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, beverageChipNumber: e.target.value } as any))}
                    placeholder="Chip Nummer"
                  />
                ) : (
                  <span className="text-sm">{(user as any).beverageChipNumber || "-"}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Ausgabedatum:</Label>
                {isEditing && isAdmin ? (
                  <Input
                    type="date"
                    name="beverage-chip-issue-date"
                    autoComplete="off"
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
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Zusätzliche Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customFields.map(field => renderCustomField(field, isEditing))}
              </div>
            </div>
          )}
          
          {/* Notfallkontakt */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Notfallkontakt</h3>
            
            <div className="space-y-2">
              <Label>Kontaktinformationen:</Label>
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
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">Notizen</h3>
            
            <div className="space-y-2">
              <Label>Zusätzliche Informationen:</Label>
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

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
            <DialogDescription>
              Geben Sie das neue Passwort zweimal ein, um es zu ändern.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={isChangingPassword}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword ? "Wird geändert..." : "Passwort ändern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
