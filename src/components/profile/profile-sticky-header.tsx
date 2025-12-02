/**
 * ProfileStickyHeader Component
 * 
 * Displays a condensed sticky header for the profile view.
 * Shows user info with edit/save/cancel actions.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, ArrowLeft } from "lucide-react";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";
import { User as UserType, UserRole } from "@/types";

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Admin",
  vorstand: "Vorstand"
};

interface ProfileStickyHeaderProps {
  user: UserType;
  isEditing: boolean;
  customValues: Record<string, any>;
  getRoleBadgeInlineStyle: (role: string) => React.CSSProperties;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onBack?: () => void;
}

export function ProfileStickyHeader({
  user,
  isEditing,
  customValues,
  getRoleBadgeInlineStyle,
  onEdit,
  onSave,
  onCancel,
  onBack,
}: ProfileStickyHeaderProps) {
  return (
    <div className="flex-shrink-0 relative z-10">
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardContent className="p-6">
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

            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-ocean flex items-center justify-center text-primary-foreground text-2xl md:text-3xl font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button onClick={onEdit} size="sm" className="h-8">
                  <Edit className="w-3 h-3 mr-1.5" />
                  Bearbeiten
                </Button>
                {onBack && (
                  <Button variant="outline" onClick={onBack} size="sm" className="h-8">
                    <ArrowLeft className="w-3 h-3 mr-1.5" />
                    Zurück
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="h-8" onClick={onCancel}>
                  <X className="w-3 h-3 mr-1.5" />
                  Abbrechen
                </Button>
                <Button size="sm" className="h-8" onClick={onSave}>
                  <Save className="w-3 h-3 mr-1.5" />
                  Speichern
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}