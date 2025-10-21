import { Users, UserCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/use-users";

export function UserListDatabase() {
  const { users, loading, deleteUser } = useUsers();

  if (loading) {
    return <div>Lädt Benutzer...</div>;
  }

  // Group users by role
  const kranfuehrers = users.filter(u => u.roles.includes('kranfuehrer'));
  const admins = users.filter(u => u.roles.includes('admin'));
  const regularMembers = users.filter(u => 
    !u.roles.includes('kranfuehrer') && !u.roles.includes('admin')
  );

  const UserCard = ({ user }: { user: typeof users[0] }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{user.name || user.email}</p>
          {user.is_test_data && (
            <Badge variant="outline" className="text-xs">Test</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {user.phone && (
          <p className="text-sm text-muted-foreground">{user.phone}</p>
        )}
        <div className="flex gap-1 mt-2">
          {user.roles.map(role => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role === 'kranfuehrer' ? 'Kranführer' : 
               role === 'admin' ? 'Admin' : 
               'Mitglied'}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (confirm(`Benutzer ${user.name || user.email} wirklich löschen?`)) {
            deleteUser(user.id);
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzer aus Datenbank ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {admins.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Administratoren ({admins.length})
              </h3>
              <div className="space-y-2">
                {admins.map(user => <UserCard key={user.id} user={user} />)}
              </div>
            </div>
          )}

          {kranfuehrers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Kranführer ({kranfuehrers.length})
              </h3>
              <div className="space-y-2">
                {kranfuehrers.map(user => <UserCard key={user.id} user={user} />)}
              </div>
            </div>
          )}

          {regularMembers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">
                Mitglieder ({regularMembers.length})
              </h3>
              <div className="space-y-2">
                {regularMembers.map(user => <UserCard key={user.id} user={user} />)}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Keine Benutzer gefunden
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}