/**
 * Profile View Component
 * 
 * Refactored: Uses useProfileLoader hook and ProfileStickyHeader subcomponent.
 * Reduced from ~600 lines to ~300 lines.
 */
import { useState, useEffect } from "react";
import { useStickyHeaderLayout, useToast, useRole, useCustomFields, useCustomFieldValues, useRoleBadgeSettings } from "@/hooks";
import { ProfileDocumentsSection } from "@/components/profile/profile-documents-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFormCards } from "@/components/profile/profile-form-cards";
import { ProfileStickyHeader } from "@/components/profile/profile-sticky-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User as UserType, UserRole, ProfileViewProps } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { userLogger } from "@/lib/logger";
import { userService } from "@/lib/services/user-service";
import { useProfileLoader } from "@/components/profile/hooks/use-profile-loader";

interface ProfileComponentProps {
  currentRole?: UserRole;
  userId?: string;
  onUpdate?: () => void;
  isDialog?: boolean;
  onBack?: () => void;
}

export function ProfileView({ currentRole, userId, onUpdate, isDialog = false, onBack }: ProfileComponentProps = {}) {
  const { user, loading, isAdmin, aiInfoEnabled, setAiInfoEnabled, reload } = useProfileLoader({ userId });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [editedCustomValues, setEditedCustomValues] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const { currentUser: roleCurrentUser, currentRole: roleCurrentRole } = useRole();
  
  const { customFields, loading: fieldsLoading, addCustomField, deleteCustomField } = useCustomFields();
  const targetUserId = userId || roleCurrentUser?.id;
  const { customValues, saveCustomValue, saveAllCustomValues } = useCustomFieldValues(targetUserId || '');
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();
  const { isPageSticky } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky('profile');

  // Sync editedUser with user
  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

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

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Profil konnte nicht geladen werden.</p>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!editedUser) return;
    
    try {
      let targetId: string;
      if (userId) {
        targetId = userId;
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Nicht angemeldet');
        targetId = authUser.id;
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
            userId: targetId,
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
        // Regular profile update - use service layer
        await userService.updateProfile({
          id: targetId,
          name: editedUser.name,
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          phone: editedUser.phone,
          memberNumber: editedUser.memberNumber,
          boatName: editedUser.boatName,
          streetAddress: editedUser.streetAddress,
          postalCode: editedUser.postalCode,
          city: editedUser.city,
          oesvNumber: (editedUser as any).oesvNumber,
          address: (editedUser as any).address,
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
          aiInfoEnabled: aiInfoEnabled,
          documentBfa: (editedUser as any).documentBfa,
          documentInsurance: (editedUser as any).documentInsurance,
          documentBerthContract: (editedUser as any).documentBerthContract,
          documentMemberPhoto: (editedUser as any).documentMemberPhoto
        });
      }

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
      
      reload();
      onUpdate?.();
    } catch (error: any) {
      userLogger.error('Error saving profile', error);
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditedUser(user);
    setEditedCustomValues(customValues);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedUser(user);
    setEditedCustomValues(customValues);
  };

  const content = (
    <div className="space-y-6">
      {/* Hero Card - nur anzeigen wenn sticky NICHT enabled ist */}
      {!isStickyEnabled && (
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
          onEdit={handleStartEditing}
          onSave={handleSaveProfile}
          onCancel={handleCancelEditing}
          onBack={onBack}
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
          reload();
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
        <ProfileStickyHeader
          user={user}
          isEditing={isEditing}
          customValues={customValues}
          getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
          onEdit={handleStartEditing}
          onSave={handleSaveProfile}
          onCancel={handleCancelEditing}
          onBack={onBack}
        />
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
