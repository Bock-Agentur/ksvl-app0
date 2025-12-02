import { User as UserType } from "@/types";
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
  getRoleBadgeInlineStyle: (role: string) => React.CSSProperties;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  setAiInfoEnabled: (enabled: boolean) => void;
}

export function ProfileFormCards({
  user,
  editedUser,
  isEditing,
  isAdmin,
  userId,
  aiInfoEnabled,
  getRoleBadgeInlineStyle,
  setEditedUser,
  setAiInfoEnabled,
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
        setEditedUser={setEditedUser}
        setAiInfoEnabled={setAiInfoEnabled}
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