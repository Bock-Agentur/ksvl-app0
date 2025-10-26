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
import { useRoleBadgeSettings } from "@/hooks/use-role-badge-settings";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";

// ProfileViewProps is now imported from @/types

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Admin",
  vorstand: "Vorstand"
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
  const [aiInfoEnabled, setAiInfoEnabled] = useState(false);
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
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();

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
      setAiInfoEnabled(profile.ai_info_enabled === true);
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
          contact_public_in_ksvl: (editedUser as any).contactPublicInKsvl === true,
          ai_info_enabled: aiInfoEnabled
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
      {/* Hero Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Avatar + Name + Roles */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-ocean flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  {user.name}
                </h1>
                {user?.roles?.includes('vorstand') && (user as any).vorstandFunktion && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {(user as any).vorstandFunktion}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {sortRoles(user.roles || []).map((role) => (
                    <Badge key={role} className="text-xs" style={getRoleBadgeInlineStyle(role)}>
                      {ROLE_LABELS[role] || roleLabels[role]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right: Edit Button */}
            <div className="flex gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Rollen Card - Nur für Admins sichtbar */}
      {isAdmin && userId && (
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Rollen</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                {sortRoles(user.roles || []).map((role) => (
                  <Badge key={role} className="text-xs" style={getRoleBadgeInlineStyle(role)}>
                    {ROLE_LABELS[role] || roleLabels[role]}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
          
      {/* Grunddaten Card - Passwort */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Grunddaten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </CardContent>
      </Card>
          
      {/* Stammdaten Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Fields - Kontakt */}
            {!fieldsLoading && customFields.filter(f => f.group === 'Kontakt').sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}{field.required && " *"}</Label>
                {isEditing ? (
                  <>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={editedCustomValues[field.name] || ""}
                        onValueChange={(value) => setEditedCustomValues(prev => ({ ...prev, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Auswählen..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm">
                    {customValues[field.name] || "-"}
                  </span>
                )}
              </div>
            ))}
            
            {/* Custom Fields - Persönlich */}
            {!fieldsLoading && customFields.filter(f => f.group === 'Persönlich').sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}{field.required && " *"}</Label>
                {isEditing ? (
                  <>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={editedCustomValues[field.name] || ""}
                        onValueChange={(value) => setEditedCustomValues(prev => ({ ...prev, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Auswählen..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm">
                    {customValues[field.name] || "-"}
                  </span>
                )}
              </div>
            ))}
            
            {/* Custom Fields - Mitgliedschaft */}
            {!fieldsLoading && customFields.filter(f => f.group === 'Mitgliedschaft').sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}{field.required && " *"}</Label>
                {isEditing ? (
                  <>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={editedCustomValues[field.name] || ""}
                        onValueChange={(value) => setEditedCustomValues(prev => ({ ...prev, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Auswählen..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm">
                    {customValues[field.name] || "-"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI-Assistent & Datenschutz Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI-Assistent & Datenschutz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI-Assistent Einstellungen */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">AI-Assistent</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-info-enabled"
                checked={aiInfoEnabled}
                onCheckedChange={(checked) => setAiInfoEnabled(checked === true)}
              />
              <label
                htmlFor="ai-info-enabled"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                AI-Assistent Info aktivieren
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Wenn aktiviert, kann der AI-Assistent die unten eingetragenen Informationen bei Fragen über Sie verwenden.
            </p>
            
            {/* AI Agent Info Custom Field */}
            {!fieldsLoading && customFields.filter(f => f.name === 'ai_agent_info').map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}</Label>
                {isEditing ? (
                  <Textarea
                    value={editedCustomValues[field.name] || ""}
                    onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    disabled={!aiInfoEnabled}
                    className={cn(!aiInfoEnabled && "opacity-50 cursor-not-allowed")}
                    rows={4}
                  />
                ) : (
                  <span className="text-sm">
                    {aiInfoEnabled ? (customValues[field.name] || "-") : "Deaktiviert"}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Öffentliche Anzeige in KSVL */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-foreground">Öffentliche Anzeige in KSVL</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="data-public"
                  checked={editedUser?.dataPublicInKsvl || false}
                  onCheckedChange={(checked) => {
                    if (!editedUser) return;
                    setEditedUser({
                      ...editedUser,
                      dataPublicInKsvl: checked === true
                    });
                  }}
                />
                <label
                  htmlFor="data-public"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Daten öffentlich in KSVL anzeigen
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contact-public"
                  checked={editedUser?.contactPublicInKsvl || false}
                  onCheckedChange={(checked) => {
                    if (!editedUser) return;
                    setEditedUser({
                      ...editedUser,
                      contactPublicInKsvl: checked === true
                    });
                  }}
                />
                <label
                  htmlFor="contact-public"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Kontaktdaten öffentlich in KSVL anzeigen
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Diese Einstellungen steuern, welche Ihrer Informationen in der KSVL-Mitgliederliste sichtbar sind.
            </p>
          </div>
        </CardContent>
      </Card>
          
      {/* Boot & Liegeplatz Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Boot & Liegeplatz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Fields - Boot */}
            {!fieldsLoading && customFields.filter(f => f.group === 'Boot').sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}{field.required && " *"}</Label>
                {isEditing ? (
                  <>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={editedCustomValues[field.name] || ""}
                        onValueChange={(value) => setEditedCustomValues(prev => ({ ...prev, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Auswählen..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm">
                    {customValues[field.name] || "-"}
                  </span>
                )}
              </div>
            ))}
            
            {/* Custom Fields - Liegeplatz */}
            {!fieldsLoading && customFields.filter(f => f.group === 'Liegeplatz').sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}{field.required && " *"}</Label>
                {isEditing ? (
                  <>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={editedCustomValues[field.name] || ""}
                        onValueChange={(value) => setEditedCustomValues(prev => ({ ...prev, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Auswählen..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm">
                    {customValues[field.name] || "-"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
          
      {/* Parkplatz & Getränkemarke Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Parkplatz & Getränkemarke</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Fields - Sonstiges */}
            {!fieldsLoading && customFields.filter(f => f.group === 'Sonstiges').sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>{field.label}{field.required && " *"}</Label>
                {isEditing ? (
                  <>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={editedCustomValues[field.name] || ""}
                        onValueChange={(value) => setEditedCustomValues(prev => ({ ...prev, [field.name]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Auswählen..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        value={editedCustomValues[field.name] || ""}
                        onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm">
                    {customValues[field.name] || "-"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
          
      {/* Notfallkontakt & Notizen Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Notfallkontakt & Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notfallkontakt</Label>
              {isEditing ? (
                <Textarea
                  value={(editedUser as any)?.emergencyContact || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, emergencyContact: e.target.value } as any : null)}
                  placeholder="Name, Telefon, Beziehung"
                />
              ) : (
                <span className="text-sm">
                  {(user as any)?.emergencyContact || "-"}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Notizen</Label>
              {isEditing ? (
                <Textarea
                  value={(editedUser as any)?.notes || ""}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, notes: e.target.value } as any : null)}
                  placeholder="Interne Notizen"
                />
              ) : (
                <span className="text-sm">
                  {(user as any)?.notes || "-"}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setEditedUser(user);
              setEditedCustomValues(customValues);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSaveProfile}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      )}

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
            <DialogDescription>
              Bitte geben Sie ein neues Passwort ein.
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
            
            <div className="flex gap-2 justify-end">
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
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? "Wird geändert..." : "Passwort ändern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Fields Management Dialog (Admin only) */}
      {isAdmin && (
        <Dialog open={isManagingFields} onOpenChange={setIsManagingFields}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-4">
              <Settings className="w-4 h-4 mr-2" />
              Felder verwalten
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Custom Fields verwalten</DialogTitle>
              <DialogDescription>
                Verwalten Sie zusätzliche Felder für alle Benutzerprofile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Add New Field Form */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Neues Feld hinzufügen</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-name">Feldname (technisch)</Label>
                    <Input
                      id="field-name"
                      value={newField.name || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="z.B. custom_field_1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="field-label">Anzeigename</Label>
                    <Input
                      id="field-label"
                      value={newField.label || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="z.B. Zusätzliche Info"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="field-type">Feldtyp</Label>
                    <Select
                      value={newField.type || "text"}
                      onValueChange={(value) => setNewField(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Mehrzeiliger Text</SelectItem>
                        <SelectItem value="number">Zahl</SelectItem>
                        <SelectItem value="date">Datum</SelectItem>
                        <SelectItem value="select">Auswahl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="field-placeholder">Platzhalter</Label>
                    <Input
                      id="field-placeholder"
                      value={newField.placeholder || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                {newField.type === "select" && (
                  <div className="space-y-2">
                    <Label htmlFor="field-options">Auswahloptionen (kommagetrennt)</Label>
                    <Input
                      id="field-options"
                      value={newField.options?.join(", ") || ""}
                      onChange={(e) => setNewField(prev => ({ 
                        ...prev, 
                        options: e.target.value.split(",").map(o => o.trim()).filter(o => o) 
                      }))}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-required"
                    checked={newField.required || false}
                    onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked === true }))}
                  />
                  <label htmlFor="field-required" className="text-sm font-medium cursor-pointer">
                    Pflichtfeld
                  </label>
                </div>
                
                <Button onClick={handleAddCustomField}>
                  <Plus className="w-4 h-4 mr-2" />
                  Feld hinzufügen
                </Button>
              </div>

              {/* Existing Fields List */}
              <div className="space-y-4">
                <h3 className="font-semibold">Vorhandene Felder</h3>
                
                {fieldsLoading ? (
                  <p className="text-sm text-muted-foreground">Lade Felder...</p>
                ) : customFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine benutzerdefinierten Felder vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {customFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{field.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {field.name} • {field.type} {field.required && "• Pflichtfeld"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  if (isDialog) {
    return content;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {content}
    </div>
  );
}
