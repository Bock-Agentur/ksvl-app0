import { Users, UserCheck, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/use-users";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";

export function UserListDatabase() {
  const { users, loading, deleteUser, refreshUsers } = useUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "mitglied" as "mitglied" | "kranfuehrer" | "admin"
  });
  const { toast } = useToast();

  const createUser = async () => {
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Update profile with name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: newUser.name })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Add additional roles if needed
      if (newUser.role === 'kranfuehrer') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'kranfuehrer' });
        if (roleError) throw roleError;
      } else if (newUser.role === 'admin') {
        const { error: role1Error } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'kranfuehrer' });
        const { error: role2Error } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'admin' });
        if (role1Error || role2Error) throw role1Error || role2Error;
      }

      toast({
        title: "Benutzer erstellt",
        description: `${newUser.name} wurde erfolgreich angelegt.`
      });

      setIsCreateDialogOpen(false);
      setNewUser({ email: "", password: "", name: "", role: "mitglied" });
      refreshUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Fehler",
        description: error.message || "Benutzer konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

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
          {user.is_role_user && (
            <Badge variant="destructive" className="text-xs">Rolle</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {user.phone && (
          <p className="text-sm text-muted-foreground">{user.phone}</p>
        )}
        <div className="flex gap-1 mt-2">
          {sortRoles(user.roles).map(role => (
            <Badge key={role} variant="secondary" className="text-xs">
              {ROLE_LABELS[role] || role}
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
      <Card className="card-maritime-hero">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Benutzer aus Datenbank ({users.length})
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Neuer Benutzer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="max@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mitglied">Mitglied</SelectItem>
                        <SelectItem value="kranfuehrer">Kranführer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={createUser} 
                    className="w-full"
                    disabled={!newUser.email || !newUser.password || !newUser.name}
                  >
                    Benutzer erstellen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {admins.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Admins ({admins.length})
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