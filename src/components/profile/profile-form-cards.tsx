import { User as UserType, CustomField } from "@/types";
import { ProfilePersonalCards } from "./profile-personal-cards";
import { ProfileBoatCards } from "./profile-boat-cards";
import { ProfileAdminCards, ProfileHistoryCard } from "./profile-admin-cards";

interface ProfileFormCardsProps {
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
  getRoleBadgeInlineStyle: (role: string) => React.CSSProperties;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setAiInfoEnabled: (enabled: boolean) => void;
  setEditedCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  addCustomField: (field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteCustomField: (fieldId: string) => Promise<void>;
}

export function ProfileFormCards({
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
  getRoleBadgeInlineStyle,
  setEditedUser,
  setAiInfoEnabled,
  setEditedCustomValues,
  addCustomField,
  deleteCustomField,
}: ProfileFormCardsProps) {
  return (
    <>
      <ProfileAdminCards
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        isAdmin={isAdmin}
        userId={userId}
        getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
        setEditedUser={setEditedUser}
      />

      <ProfilePersonalCards
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
        setEditedUser={setEditedUser}
        setAiInfoEnabled={setAiInfoEnabled}
        setEditedCustomValues={setEditedCustomValues}
        addCustomField={addCustomField}
        deleteCustomField={deleteCustomField}
      />

      <ProfileBoatCards
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        setEditedUser={setEditedUser}
      />

      {/* Historie & Verwaltung - ganz unten, nur für Admins */}
      {isAdmin && <ProfileHistoryCard user={user} />}
    </>
  );
}
