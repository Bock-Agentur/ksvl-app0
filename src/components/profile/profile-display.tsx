import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserType, UserRole } from "@/types";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { useRoleBadgeSettings } from "@/hooks/use-role-badge-settings";
import { Edit } from "lucide-react";

interface ProfileDisplayProps {
  user: UserType;
  onEdit: () => void;
  children?: React.ReactNode;
}

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Admin",
  vorstand: "Vorstand"
};

export function ProfileDisplay({ user, onEdit, children }: ProfileDisplayProps) {
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();
  const { isPageSticky } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky('profile');

  // Don't render hero card if sticky is enabled
  if (isStickyEnabled) {
    return null;
  }

  return (
    <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
      <CardContent className="p-6">
        {/* Mobile: Avatar rechts, Name links */}
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

          {/* Avatar rechts oben */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-ocean flex items-center justify-center text-primary-foreground text-2xl md:text-3xl font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Buttons unten */}
        <div className="flex gap-2">
          <Button 
            onClick={onEdit} 
            size="sm" 
            className="h-8"
          >
            <Edit className="w-3 h-3 mr-1.5" />
            Bearbeiten
          </Button>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
