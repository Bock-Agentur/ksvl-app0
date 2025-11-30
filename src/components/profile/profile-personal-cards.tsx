import { User as UserType, CustomField } from "@/types";
import { ProfileLoginCard } from "./profile-login-card";
import { ProfileMasterDataCard } from "./profile-master-data-card";
import { ProfileMembershipCard } from "./profile-membership-card";
import { ProfilePrivacyCard } from "./profile-privacy-card";

interface ProfilePersonalCardsProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  isAdmin: boolean;
  userId?: string;
  aiInfoEnabled: boolean;
  customFields: CustomField[];
  customValues: Record<string, any>;
  editedCustomValues: Record<string, any>;
  fieldsLoading: boolean;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setAiInfoEnabled: (enabled: boolean) => void;
  setEditedCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  addCustomField: (field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteCustomField: (fieldId: string) => Promise<void>;
}

export function ProfilePersonalCards({
  user,
  editedUser,
  isEditing,
  isAdmin,
  userId,
  aiInfoEnabled,
  customFields,
  customValues,
  editedCustomValues,
  fieldsLoading,
  setEditedUser,
  setAiInfoEnabled,
  setEditedCustomValues,
  addCustomField,
  deleteCustomField,
}: ProfilePersonalCardsProps) {
  return (
    <>
      <ProfileLoginCard
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        isAdmin={isAdmin}
        userId={userId}
        setEditedUser={setEditedUser}
      />

      <ProfileMasterDataCard
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        isAdmin={isAdmin}
        customFields={customFields}
        customValues={customValues}
        editedCustomValues={editedCustomValues}
        fieldsLoading={fieldsLoading}
        setEditedUser={setEditedUser}
        setEditedCustomValues={setEditedCustomValues}
        addCustomField={addCustomField}
        deleteCustomField={deleteCustomField}
      />

      <ProfileMembershipCard
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        setEditedUser={setEditedUser}
      />

      <ProfilePrivacyCard
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        aiInfoEnabled={aiInfoEnabled}
        setEditedUser={setEditedUser}
        setAiInfoEnabled={setAiInfoEnabled}
      />
    </>
  );
}
