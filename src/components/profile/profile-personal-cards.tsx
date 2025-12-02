import { User as UserType } from "@/types";
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
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setAiInfoEnabled: (enabled: boolean) => void;
}

export function ProfilePersonalCards({
  user,
  editedUser,
  isEditing,
  isAdmin,
  userId,
  aiInfoEnabled,
  setEditedUser,
  setAiInfoEnabled,
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
        setEditedUser={setEditedUser}
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