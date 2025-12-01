import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserType } from "@/types";
import { UserHistoryTimeline } from "@/components/common/user-history-timeline";

interface ProfileAdminCardsProps {
  user: UserType;
  editedUser: UserType | null;
  isEditing: boolean;
  isAdmin: boolean;
  userId?: string;
  getRoleBadgeInlineStyle: (role: string) => React.CSSProperties;
  setEditedUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export function ProfileAdminCards({
  // Props werden beibehalten für Interface-Kompatibilität
}: ProfileAdminCardsProps) {
  // Rollen-Card entfernt - Rollen werden bereits im Header angezeigt
  // Rollenbearbeitung erfolgt jetzt über die Bearbeiten-Funktion im Header
  return null;
}

// Separate History Card Component - rendered at bottom of profile
export function ProfileHistoryCard({ user }: { user: UserType }) {
  return (
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
  );
}
