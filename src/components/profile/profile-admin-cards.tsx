import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User as UserType, UserRole } from "@/types";
import { UserHistoryTimeline } from "@/components/common/user-history-timeline";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Admin",
  vorstand: "Vorstand",
};

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
  user,
  editedUser,
  isEditing,
  isAdmin,
  userId,
  getRoleBadgeInlineStyle,
  setEditedUser,
}: ProfileAdminCardsProps) {
  if (!isAdmin) return null;

  return (
    <>
      {/* Rollen Card - Nur für Admins sichtbar */}
      {userId && (
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

    </>
  );
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
