import { useState, useEffect, useCallback } from "react";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { Edit, Save, X } from "lucide-react";
import { ProfileDocumentsSection } from "@/components/profile/profile-documents-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFormCards } from "@/components/profile/profile-form-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [editedCustomValues, setEditedCustomValues] = useState<Record<string, any>>({});
  const [aiInfoEnabled, setAiInfoEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Function definitions BEFORE useEffect to avoid Temporal Dead Zone
  const checkAdminStatus = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);
      
      // Admin or Vorstand can edit restricted fields
      setIsAdmin(roles?.some(r => r.role === 'admin' || r.role === 'vorstand') || false);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
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
  }, [userId, roleCurrentUser?.id, toast]);

  useEffect(() => {
    loadCurrentUser();
    checkAdminStatus();
  }, [loadCurrentUser, checkAdminStatus]);
  
  useEffect(() => {
    if (customValues) {
      setEditedCustomValues(customValues);
    }
  }, [customValues]);
  
  if (loading) {
    return (
      <div className={cn(
        "p-4 max-w-7xl mx-auto",
        isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-6"
      )}>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }


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
      {/* Hero Card - nur anzeigen wenn sticky NICHT enabled ist */}
      {!isStickyEnabled && (
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
          onEdit={() => {
            setIsEditing(true);
            setEditedUser(user);
            setEditedCustomValues(customValues);
          }}
          onSave={handleSaveProfile}
          onCancel={() => {
            setIsEditing(false);
            setEditedUser(user);
            setEditedCustomValues(customValues);
          }}
        />
      )}

      <ProfileFormCards
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        isAdmin={isAdmin}
        userId={userId}
        aiInfoEnabled={aiInfoEnabled}
        customFields={customFields}
        customValues={customValues}
        editedCustomValues={editedCustomValues}
        fieldsLoading={fieldsLoading}
        getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
        setEditedUser={setEditedUser}
        setAiInfoEnabled={setAiInfoEnabled}
        setEditedCustomValues={setEditedCustomValues}
        addCustomField={addCustomField}
        deleteCustomField={deleteCustomField}
      />

      <ProfileDocumentsSection
        userId={user.id}
        user={user}
        isEditing={isEditing}
        onDocumentUpload={(field, url) => {
          setEditedUser(prev => prev ? { ...prev, [field]: url } as any : null);
          loadCurrentUser();
        }}
      />
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
