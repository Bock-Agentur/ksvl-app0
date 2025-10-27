import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Key, Trash2 } from "lucide-react";
import { User } from "@/types";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";

interface UserCardProps {
  user: User;
  getRoleBadgeInlineStyle: (role: string) => any;
  onViewUser: (user: User) => void;
  onPasswordChange: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export function UserCardWithCustomFields({
  user,
  getRoleBadgeInlineStyle,
  onViewUser,
  onPasswordChange,
  onDeleteUser
}: UserCardProps) {
  // Get all data directly from user object
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
  const username = user.username || null;
  const memberNumber = user.memberNumber || null;
  const email = user.email;
  const phone = user.phone || null;

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0 transition-colors hover:bg-muted/50">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          {/* User Info Section */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* 1. Vorname Nachname - groß oben */}
            <h3 className="font-semibold text-lg">{fullName}</h3>
            
            {/* 2. Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Role Badges */}
              {sortRoles(user.roles || []).map((role) => {
                const label = role === 'admin' ? 'Admin' :
                             role === 'vorstand' ? 'Vorstand' :
                             role === 'mitglied' ? 'Mitglied' :
                             role === 'gastmitglied' ? 'Gast' :
                             role === 'kranfuehrer' ? 'Kran' :
                             ROLE_LABELS[role] || role;
                
                return (
                  <Badge 
                    key={role} 
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5" 
                    style={getRoleBadgeInlineStyle(role)}
                  >
                    {label}
                  </Badge>
                );
              })}
              
              {/* Status Badge */}
              {user.status === "active" && (
                <Badge 
                  variant="default"
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                >
                  Aktiv
                </Badge>
              )}
            </div>
            
            {/* 3. Username, Mitgliedsnummer, E-Mail, Telefon (from Custom Fields) */}
            <div className="space-y-1 text-sm text-muted-foreground">
              {username && (
                <div>Username: {username}</div>
              )}
              
              {memberNumber && (
                <div>Mitgliedsnummer: {memberNumber}</div>
              )}
              
              <div>E-Mail: {email}</div>
              
              {phone && (
                <div>Telefon: {phone}</div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 sm:ml-4 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewUser(user)}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
              <span className="sr-only">Ansehen</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPasswordChange(user.id)}
              className="h-8 w-8 p-0"
            >
              <Key className="w-4 h-4" />
              <span className="sr-only">Passwort ändern</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteUser(user.id)}
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Löschen</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
