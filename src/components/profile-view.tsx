import { useState, useEffect } from "react";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
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
import { DocumentUpload } from "@/components/common/document-upload";
import { UserHistoryTimeline } from "@/components/common/user-history-timeline";

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
  const { isPageSticky } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky('profile');

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
  }, [userId, roleCurrentUser?.id]); // Changed: Added roleCurrentUser?.id dependency
  
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
        username: profile.username || undefined,
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
        
        // Existing fields
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
        contactPublicInKsvl: profile.contact_public_in_ksvl === true,
        
        // New fields
        passwordChangeRequired: profile.password_change_required || false,
        twoFactorMethod: profile.two_factor_method || 'Aus',
        membershipType: profile.membership_type || undefined,
        membershipStatus: profile.membership_status || 'Aktiv',
        boardPositionStartDate: profile.board_position_start_date || undefined,
        boardPositionEndDate: profile.board_position_end_date || undefined,
        boatColor: profile.boat_color || undefined,
        berthLength: profile.berth_length || undefined,
        berthWidth: profile.berth_width || undefined,
        buoyRadius: profile.buoy_radius || undefined,
        hasDinghyBerth: profile.has_dinghy_berth || false,
        beverageChipStatus: profile.beverage_chip_status || 'Aktiv',
        statuteAccepted: profile.statute_accepted || false,
        privacyAccepted: profile.privacy_accepted || false,
        newsletterOptin: profile.newsletter_optin || false,
        emergencyContactName: profile.emergency_contact_name || undefined,
        emergencyContactPhone: profile.emergency_contact_phone || undefined,
        emergencyContactRelationship: profile.emergency_contact_relationship || undefined,
        documentBfa: profile.document_bfa || undefined,
        documentInsurance: profile.document_insurance || undefined,
        documentBerthContract: profile.document_berth_contract || undefined,
        documentMemberPhoto: profile.document_member_photo || undefined,
        membershipStatusHistory: profile.membership_status_history || [],
        boardPositionHistory: profile.board_position_history || [],
        createdBy: profile.created_by || undefined,
        modifiedBy: profile.modified_by || undefined,
        ai_info_enabled: profile.ai_info_enabled || false
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
              username: (editedUser as any).username,
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
              boatColor: (editedUser as any).boatColor,
              berthLength: (editedUser as any).berthLength,
              berthWidth: (editedUser as any).berthWidth,
              buoyRadius: (editedUser as any).buoyRadius,
              hasDinghyBerth: (editedUser as any).hasDinghyBerth,
              parkingPermitNumber: (editedUser as any).parkingPermitNumber,
              parkingPermitIssueDate: (editedUser as any).parkingPermitIssueDate,
              beverageChipNumber: (editedUser as any).beverageChipNumber,
              beverageChipIssueDate: (editedUser as any).beverageChipIssueDate,
              beverageChipStatus: (editedUser as any).beverageChipStatus,
              emergencyContact: (editedUser as any).emergencyContact,
              emergencyContactName: (editedUser as any).emergencyContactName,
              emergencyContactPhone: (editedUser as any).emergencyContactPhone,
              emergencyContactRelationship: (editedUser as any).emergencyContactRelationship,
              notes: (editedUser as any).notes,
              vorstandFunktion: (editedUser as any).vorstandFunktion,
              membershipType: (editedUser as any).membershipType,
              membershipStatus: (editedUser as any).membershipStatus,
              boardPositionStartDate: (editedUser as any).boardPositionStartDate,
              boardPositionEndDate: (editedUser as any).boardPositionEndDate,
              passwordChangeRequired: (editedUser as any).passwordChangeRequired,
              twoFactorMethod: (editedUser as any).twoFactorMethod,
              dataPublicInKsvl: (editedUser as any).dataPublicInKsvl,
              contactPublicInKsvl: (editedUser as any).contactPublicInKsvl,
              newsletterOptin: (editedUser as any).newsletterOptin,
              documentBfa: (editedUser as any).documentBfa,
              documentInsurance: (editedUser as any).documentInsurance,
              documentBerthContract: (editedUser as any).documentBerthContract,
              documentMemberPhoto: (editedUser as any).documentMemberPhoto,
              aiInfoEnabled: aiInfoEnabled
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
          boat_color: toNullIfEmpty((editedUser as any).boatColor),
          berth_length: toNullIfEmpty((editedUser as any).berthLength),
          berth_width: toNullIfEmpty((editedUser as any).berthWidth),
          buoy_radius: toNullIfEmpty((editedUser as any).buoyRadius),
          has_dinghy_berth: (editedUser as any).hasDinghyBerth === true,
          parking_permit_number: toNullIfEmpty((editedUser as any).parkingPermitNumber),
          parking_permit_issue_date: toNullIfEmpty((editedUser as any).parkingPermitIssueDate),
          beverage_chip_number: toNullIfEmpty((editedUser as any).beverageChipNumber),
          beverage_chip_issue_date: toNullIfEmpty((editedUser as any).beverageChipIssueDate),
          beverage_chip_status: toNullIfEmpty((editedUser as any).beverageChipStatus),
          emergency_contact: toNullIfEmpty((editedUser as any).emergencyContact),
          emergency_contact_name: toNullIfEmpty((editedUser as any).emergencyContactName),
          emergency_contact_phone: toNullIfEmpty((editedUser as any).emergencyContactPhone),
          emergency_contact_relationship: toNullIfEmpty((editedUser as any).emergencyContactRelationship),
          notes: toNullIfEmpty((editedUser as any).notes),
          vorstand_funktion: toNullIfEmpty((editedUser as any).vorstandFunktion),
          membership_type: toNullIfEmpty((editedUser as any).membershipType),
          membership_status: toNullIfEmpty((editedUser as any).membershipStatus),
          board_position_start_date: toNullIfEmpty((editedUser as any).boardPositionStartDate),
          board_position_end_date: toNullIfEmpty((editedUser as any).boardPositionEndDate),
          password_change_required: (editedUser as any).passwordChangeRequired === true,
          two_factor_method: toNullIfEmpty((editedUser as any).twoFactorMethod),
          data_public_in_ksvl: (editedUser as any).dataPublicInKsvl === true,
          contact_public_in_ksvl: (editedUser as any).contactPublicInKsvl === true,
          newsletter_optin: (editedUser as any).newsletterOptin === true,
          ai_info_enabled: aiInfoEnabled,
          document_bfa: toNullIfEmpty((editedUser as any).documentBfa),
          document_insurance: toNullIfEmpty((editedUser as any).documentInsurance),
          document_berth_contract: toNullIfEmpty((editedUser as any).documentBerthContract),
          document_member_photo: toNullIfEmpty((editedUser as any).documentMemberPhoto)
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

  // Don't render content if user is not loaded - PageLoader in Index handles loading state
  if (!user) {
    return null;
  }

  // Show error only if loading is done but user is still null
  if (!loading && !user) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Profil konnte nicht geladen werden.</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Hero Card - nur anzeigen wenn sticky NICHT enabled ist */}
      {!isStickyEnabled && (
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardContent className="p-6">
            {/* Mobile: Avatar rechts, Name links */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 space-y-2">
                <h1 className="text-xl md:text-3xl font-bold text-foreground">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.name}
                </h1>
                {user?.roles?.includes('vorstand') && (user as any).vorstandFunktion && (
                  <p className="text-sm text-muted-foreground">
                    {(user as any).vorstandFunktion}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {sortRoles(user.roles || []).map((role) => (
                    <Badge 
                      key={role} 
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5" 
                      style={getRoleBadgeInlineStyle(role)}
                    >
                      {ROLE_LABELS[role] || roleLabels[role]}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Avatar rechts oben */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-ocean flex items-center justify-center text-primary-foreground text-2xl md:text-3xl font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Buttons unten */}
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button 
                    onClick={() => {
                      setIsEditing(true);
                      setEditedUser(user);
                      setEditedCustomValues(customValues);
                    }} 
                    size="sm" 
                    className="h-8"
                  >
                    <Edit className="w-3 h-3 mr-1.5" />
                    Bearbeiten
                  </Button>
                  {isAdmin && (
                    <Dialog open={isManagingFields} onOpenChange={setIsManagingFields}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Settings className="w-3 h-3 mr-1.5" />
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
                              
                              {!fieldsLoading && customFields.length === 0 ? (
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
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedUser(user);
                      setEditedCustomValues(customValues);
                    }}
                  >
                    <X className="w-3 h-3 mr-1.5" />
                    Abbrechen
                  </Button>
                  <Button size="sm" className="h-8" onClick={handleSaveProfile}>
                    <Save className="w-3 h-3 mr-1.5" />
                    Speichern
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    <Key className="w-4 h-4" />
                  </Button>
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

      {/* 📎 Dokumente Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            📎 Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <DocumentUpload
              userId={user.id}
              documentType="bfa"
              label="Befähigungsnachweis (BFA Binnen)"
              currentUrl={(user as any).documentBfa}
              onUploadComplete={(url) => {
                setEditedUser(prev => prev ? { ...prev, documentBfa: url } as any : null);
                loadCurrentUser();
              }}
              disabled={!isEditing}
            />

            <DocumentUpload
              userId={user.id}
              documentType="insurance"
              label="Versicherung Nachweis"
              currentUrl={(user as any).documentInsurance}
              onUploadComplete={(url) => {
                setEditedUser(prev => prev ? { ...prev, documentInsurance: url } as any : null);
                loadCurrentUser();
              }}
              disabled={!isEditing}
            />

            <DocumentUpload
              userId={user.id}
              documentType="berth_contract"
              label="Liegeplatzvertrag"
              currentUrl={(user as any).documentBerthContract}
              onUploadComplete={(url) => {
                setEditedUser(prev => prev ? { ...prev, documentBerthContract: url } as any : null);
                loadCurrentUser();
              }}
              disabled={!isEditing}
            />

            <DocumentUpload
              userId={user.id}
              documentType="member_photo"
              label="Mitgliederfoto"
              currentUrl={(user as any).documentMemberPhoto}
              onUploadComplete={(url) => {
                setEditedUser(prev => prev ? { ...prev, documentMemberPhoto: url } as any : null);
                loadCurrentUser();
              }}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* 🗂️ Historie & Verwaltung Card - nur für Admin */}
      {isAdmin && (
        <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              🗂️ Historie & Verwaltung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserHistoryTimeline
              membershipHistory={(user as any).membershipStatusHistory}
              boardHistory={(user as any).boardPositionHistory}
              createdAt={(user as any).created_at}
              createdBy={(user as any).createdBy}
              updatedAt={(user as any).updated_at}
              modifiedBy={(user as any).modifiedBy}
            />
          </CardContent>
        </Card>
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
    </div>
  );

  if (isDialog) {
    return content;
  }

  return (
    <div className={cn(
      "container mx-auto p-4 max-w-4xl",
      isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : ""
    )}>
      {/* Sticky Header - nur im Sticky-Modus anzeigen */}
      {isStickyEnabled && (
        <div className="flex-shrink-0 relative z-10">
          {/* Hero Card wird als Header behandelt */}
          <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 space-y-2">
                  <h1 className="text-xl md:text-3xl font-bold text-foreground">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.name}
                  </h1>
                  {user?.roles?.includes('vorstand') && (user as any).vorstandFunktion && (
                    <p className="text-sm text-muted-foreground">
                      {(user as any).vorstandFunktion}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {sortRoles(user.roles || []).map((role) => (
                      <Badge 
                        key={role} 
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5" 
                        style={getRoleBadgeInlineStyle(role)}
                      >
                        {ROLE_LABELS[role] || roleLabels[role]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-ocean flex items-center justify-center text-primary-foreground text-2xl md:text-3xl font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditedUser(user);
                        setEditedCustomValues(customValues);
                      }} 
                      size="sm" 
                      className="h-8"
                    >
                      <Edit className="w-3 h-3 mr-1.5" />
                      Bearbeiten
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setIsManagingFields(true)}>
                        <Settings className="w-3 h-3 mr-1.5" />
                        Felder verwalten
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedUser(user);
                        setEditedCustomValues(customValues);
                      }}
                    >
                      <X className="w-3 h-3 mr-1.5" />
                      Abbrechen
                    </Button>
                    <Button size="sm" className="h-8" onClick={handleSaveProfile}>
                      <Save className="w-3 h-3 mr-1.5" />
                      Speichern
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scrollable Content */}
      <div className={cn(
        "space-y-6",
        isStickyEnabled ? "flex-1 overflow-y-auto pt-6 pb-12" : "pb-8"
      )}>
        {content}
      </div>
    </div>
  );
}
