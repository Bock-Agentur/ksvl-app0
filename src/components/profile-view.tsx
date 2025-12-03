/**
 * Profile View Component
 * 
 * Refactored: Uses useProfileLoader hook and userService for all updates.
 * Simplified: Removed sticky header feature and custom fields.
 */
import { useState, useEffect } from "react";
import { useToast, useRole, useRoleBadgeSettings } from "@/hooks";
import { ProfileDocumentsSection } from "@/components/profile/profile-documents-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFormCards } from "@/components/profile/profile-form-cards";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User as UserType, UserRole } from "@/types";
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
  const { toast } = useToast();
  const { currentUser: roleCurrentUser, currentRole: roleCurrentRole } = useRole();
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();

  // Sync editedUser with user
  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
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

      // Build update data from editedUser
      const updateData = {
        id: targetId,
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
      };

      // If admin is editing another user (with potential role changes), use updateUser (Edge Function)
      // Otherwise, use updateProfile (direct DB update for own profile)
      if (isAdmin && userId) {
        await userService.updateUser(updateData);
      } else {
        await userService.updateProfile(updateData);
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
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedUser(user);
  };

  const content = (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        isEditing={isEditing}
        getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
        onEdit={handleStartEditing}
        onSave={handleSaveProfile}
        onCancel={handleCancelEditing}
        onBack={onBack}
      />

      <ProfileFormCards
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        isAdmin={isAdmin}
        userId={userId}
        aiInfoEnabled={aiInfoEnabled}
        getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
        setEditedUser={setEditedUser}
        setAiInfoEnabled={setAiInfoEnabled}
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
    <div className="container mx-auto p-4 max-w-4xl pb-8">
      {content}
    </div>
  );
}
