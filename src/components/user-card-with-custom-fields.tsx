import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Key, Trash2, Mail, Phone, Anchor, Users } from "lucide-react";
import { User, UserRole } from "@/types";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";
import { supabase } from "@/integrations/supabase/client";
import { CustomField } from "@/types";

interface UserCardProps {
  user: User;
  customFields: CustomField[];
  getRoleBadgeInlineStyle: (role: string) => any;
  onViewUser: (user: User) => void;
  onPasswordChange: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export function UserCardWithCustomFields({
  user,
  customFields,
  getRoleBadgeInlineStyle,
  onViewUser,
  onPasswordChange,
  onDeleteUser
}: UserCardProps) {
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomValues = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_field_values')
          .select('*, custom_fields(*)')
          .eq('user_id', user.id);

        if (error) throw error;

        const values: Record<string, any> = {};
        data?.forEach(item => {
          if (item.custom_fields) {
            values[(item.custom_fields as any).name] = item.value;
          }
        });

        setCustomValues(values);
      } catch (error) {
        console.error('Error fetching custom values:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomValues();
  }, [user.id]);

  // Get specific custom fields for display
  const memberNumberField = customFields.find(f => f.name === 'member_number' || f.name === 'mitgliedsnummer');
  const usernameField = customFields.find(f => f.name === 'username');
  const emailField = customFields.find(f => f.name === 'email');
  const phoneField = customFields.find(f => f.name === 'phone' || f.name === 'telefon');

  const memberNumber = memberNumberField ? customValues[memberNumberField.name] : user.memberNumber;
  const username = usernameField ? customValues[usernameField.name] : null;
  const email = emailField ? customValues[emailField.name] : user.email;
  const phone = phoneField ? customValues[phoneField.name] : user.phone;

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          {/* User Info Section */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* 1. Vorname Nachname - groß oben */}
            <h3 className="font-semibold text-lg">{user.name}</h3>
            
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
            
            {/* 3. Mitgliedsnummer, Username, Email, Telefon (from Custom Fields) */}
            <div className="space-y-1 text-sm text-muted-foreground">
              {memberNumber && (
                <div>Mitgliedsnummer: {memberNumber}</div>
              )}
              
              {username && (
                <div>Username: {username}</div>
              )}
              
              <div>Email: {email}</div>
              
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
