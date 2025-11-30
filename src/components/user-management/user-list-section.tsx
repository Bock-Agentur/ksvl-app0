import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserCardWithCustomFields } from "@/components/user-card-with-custom-fields";
import { User } from "@/types";

interface UserListSectionProps {
  users: User[];
  searchTerm: string;
  getRoleBadgeInlineStyle: (role: string) => React.CSSProperties;
  onViewUser: (user: User) => void;
  onPasswordChange: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export function UserListSection({
  users,
  searchTerm,
  getRoleBadgeInlineStyle,
  onViewUser,
  onPasswordChange,
  onDeleteUser
}: UserListSectionProps) {
  if (users.length === 0) {
    return (
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardContent className="pt-6 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Benutzer gefunden.</p>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Versuche einen anderen Suchbegriff oder entferne die Filter.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserCardWithCustomFields
          key={user.id}
          user={user}
          getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
          onViewUser={onViewUser}
          onPasswordChange={(userId) => onPasswordChange(userId)}
          onDeleteUser={onDeleteUser}
        />
      ))}
    </div>
  );
}
