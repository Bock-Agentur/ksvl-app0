import { useState } from "react";
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Anchor, Filter, Download, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsers, DatabaseUser } from "@/hooks/use-users";
import { useSearchFilter, useCommonFilters } from "@/hooks/use-search-filter";
import { useFormHandler, useCommonFieldConfigs } from "@/hooks/use-form-handler";
import { User, UserRole, generateRolesFromPrimary } from "@/types";
import { UserRoleSelector } from "./user-role-selector";
import { 
  getRoleLabel, 
  calculateUserStats, 
  convertToCSV, 
  downloadCSV, 
  generateMemberNumber 
} from "@/lib/business-logic";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Benutzer-Verwaltung mit Supabase Datenbank
 */
export function UserManagementRefactored() {
  const { users: dbUsers, loading, deleteUser: deleteDbUser, refreshUsers } = useUsers();
  const { toast } = useToast();
  
  // Convert DatabaseUser to User format for compatibility
  const users: User[] = dbUsers.map(u => ({
    id: u.id,
    name: u.name || '',
    email: u.email,
    phone: u.phone || '',
    boatName: u.boat_name || u.boatName || '',
    memberNumber: u.member_number || u.memberNumber || '',
    roles: u.roles as UserRole[],
    role: u.role as UserRole,
    status: (u.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    joinDate: u.joinDate || '',
    joinedAt: u.joinDate || '',
    isActive: u.isActive || false,
    // Additional fields from database
    oesvNumber: (u as any).oesv_number || '',
    address: (u as any).address || '',
    berthNumber: (u as any).berth_number || '',
    berthType: (u as any).berth_type || '',
    birthDate: (u as any).birth_date || '',
    entryDate: (u as any).entry_date || ''
  } as any));

  // Such- und Filter-Funktionalität mit wiederverwendbarem Hook
  const { userRoleFilter, statusFilter } = useCommonFilters();
  
  const searchFilter = useSearchFilter(users, {
    searchFields: ['name', 'email', 'memberNumber', 'phone'],
    filters: {
      role: {
        field: 'role',
        ...userRoleFilter
      },
      status: {
        field: 'status', 
        ...statusFilter
      }
    }
  });

  // Form handling mit wiederverwendbarem Hook
  const { nameField, emailField, phoneField, memberNumberField, roleField } = useCommonFieldConfigs();
  
  const userForm = useFormHandler<User>({
    fields: [
      nameField,
      emailField,
      phoneField,
      memberNumberField,
      roleField,
      {
        name: 'boatName',
        label: 'Boot Name',
        type: 'text',
        placeholder: 'Name des Bootes'
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'active', label: 'Aktiv' },
          { value: 'inactive', label: 'Inaktiv' }
        ]
      }
    ],
    initialValues: {
      name: '',
      email: '',
      phone: '',
      memberNumber: '',
      boatName: '',
      role: 'mitglied',
      roles: ['mitglied'],
      status: 'active',
      oesvNumber: '',
      address: '',
      berthNumber: '',
      berthType: '',
      birthDate: '',
      entryDate: ''
    } as any,
    onSubmit: async (data) => {
      try {
        const memberNumber = data.memberNumber || generateMemberNumber(users);
        
        if (editingUserId) {
          console.log('Updating user:', editingUserId, data);
          
          // Update existing user
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: data.name,
              phone: data.phone || null,
              member_number: memberNumber,
              boat_name: data.boatName || null,
              status: data.status,
              oesv_number: (data as any).oesvNumber || null,
              address: (data as any).address || null,
              berth_number: (data as any).berthNumber || null,
              berth_type: (data as any).berthType || null,
              birth_date: (data as any).birthDate || null,
              entry_date: (data as any).entryDate || null
            })
            .eq('id', editingUserId);

          if (profileError) {
            console.error('Profile update error:', profileError);
            throw profileError;
          }

          // Update roles - delete old ones first
          const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', editingUserId);

          if (deleteError) {
            console.error('Role delete error:', deleteError);
            throw deleteError;
          }
          
          const rolesToInsert = data.roles || generateRolesFromPrimary(data.role);
          console.log('Inserting roles:', rolesToInsert);
          
          for (const role of rolesToInsert) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: editingUserId, role });
            
            if (roleError) {
              console.error('Role insert error:', roleError);
              throw roleError;
            }
          }

          toast({ title: "Erfolg", description: "Benutzer wurde aktualisiert." });
          refreshUsers();
          return true;
        } else {
          console.log('Creating new user:', data);
          
          // Create new user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: 'changeme123', // Temporary password
            options: {
              data: { name: data.name }
            }
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error("User creation failed");

          // Update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: data.name,
              phone: data.phone || null,
              member_number: memberNumber,
              boat_name: data.boatName || null,
              status: data.status
            })
            .eq('id', authData.user.id);

          if (profileError) throw profileError;

          // Add additional roles
          const rolesToInsert = data.roles || generateRolesFromPrimary(data.role);
          for (const role of rolesToInsert) {
            if (role !== 'mitglied') { // mitglied is added by trigger
              await supabase.from('user_roles').insert({ user_id: authData.user.id, role });
            }
          }

          toast({ title: "Erfolg", description: `Benutzer ${data.name} wurde erstellt.` });
          refreshUsers();
          return true;
        }
      } catch (error: any) {
        console.error('Form submission error:', error);
        toast({
          title: "Fehler",
          description: error.message || "Benutzer konnte nicht gespeichert werden.",
          variant: "destructive"
        });
        return false;
      }
    }
  });

  // UI State
  const [showDialog, setShowDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  
  // Statistiken mit Business Logic
  const stats = calculateUserStats(users);

  // Event handlers
  const handleAddUser = () => {
    setEditingUserId(null);
    userForm.reset();
    setShowDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    userForm.setValues({
      ...user,
      roles: user.roles || generateRolesFromPrimary(user.role) // Fallback für bestehende Nutzer
    });
    setShowDialog(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Benutzer wirklich löschen?")) {
      await deleteDbUser(userId);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const data = userForm.values;
      const memberNumber = data.memberNumber || generateMemberNumber(users);
      
      if (editingUserId) {
        console.log('Updating user:', editingUserId, data);
        
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            phone: data.phone || null,
            member_number: memberNumber,
            boat_name: data.boatName || null,
            status: data.status
          })
          .eq('id', editingUserId);

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw profileError;
        }

        // Update roles - delete old ones first
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUserId);

        if (deleteError) {
          console.error('Role delete error:', deleteError);
          throw deleteError;
        }
        
        const rolesToInsert = data.roles || generateRolesFromPrimary(data.role);
        console.log('Inserting roles:', rolesToInsert);
        
        for (const role of rolesToInsert) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: editingUserId, role });
          
          if (roleError) {
            console.error('Role insert error:', roleError);
            throw roleError;
          }
        }

        toast({ title: "Erfolg", description: "Benutzer wurde aktualisiert." });
      } else {
        console.log('Creating new user:', data);
        
        if (!password) {
          toast({
            title: "Fehler",
            description: "Bitte geben Sie ein Passwort ein.",
            variant: "destructive"
          });
          return;
        }

        // Create new user with password via edge function
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            action: 'create',
            email: data.email,
            password: password,
            name: data.name
          })
        });

        const result = await response.json();
        if (!response.ok || result.error) {
          throw new Error(result.error || 'Benutzer konnte nicht erstellt werden');
        }

        const userId = result.user.id;

        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            phone: data.phone || null,
            member_number: memberNumber,
            boat_name: data.boatName || null,
            status: data.status,
            oesv_number: (data as any).oesvNumber || null,
            address: (data as any).address || null,
            berth_number: (data as any).berthNumber || null,
            berth_type: (data as any).berthType || null,
            birth_date: (data as any).birthDate || null,
            entry_date: (data as any).entryDate || null
          })
          .eq('id', userId);

        if (profileError) throw profileError;

        // Add additional roles
        const rolesToInsert = data.roles || generateRolesFromPrimary(data.role);
        for (const role of rolesToInsert) {
          if (role !== 'mitglied') {
            await supabase.from('user_roles').insert({ user_id: userId, role });
          }
        }

        toast({ title: "Erfolg", description: `Benutzer ${data.name} wurde erstellt.` });
        setPassword("");
      }

      refreshUsers();
      setShowDialog(false);
      setEditingUserId(null);
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Benutzer konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordUserId || !password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie ein Passwort ein.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'update',
          userId: passwordUserId,
          password: password
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Passwort konnte nicht aktualisiert werden');
      }

      toast({ title: "Erfolg", description: "Passwort wurde erfolgreich geändert." });
      setShowPasswordDialog(false);
      setPasswordUserId(null);
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden.",
        variant: "destructive"
      });
    }
  };

  // Export functionality
  const handleExport = () => {
    const csvHeaders = [
      { key: 'name' as keyof User, label: 'Name' },
      { key: 'email' as keyof User, label: 'E-Mail' },
      { key: 'phone' as keyof User, label: 'Telefon' },
      { key: 'memberNumber' as keyof User, label: 'Mitgliedsnummer' },
      { key: 'role' as keyof User, label: 'Rolle' },
      { key: 'status' as keyof User, label: 'Status' },
      { key: 'joinDate' as keyof User, label: 'Beitrittsdatum' }
    ];
    
    const csvContent = convertToCSV(searchFilter.filteredData, csvHeaders);
    downloadCSV(csvContent, `benutzer-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) {
    return <div className="p-4">Lädt Benutzer...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header mit Statistiken */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mitgliederverwaltung</h1>
          <p className="text-muted-foreground">
            {stats.total} Mitglieder • {stats.active} aktiv • {stats.byRole.admin || 0} Admins • {stats.activeRate}% Aktivitätsrate
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAddUser}>
            <Plus className="w-4 h-4 mr-2" />
            Benutzer hinzufügen
          </Button>
        </div>
      </div>

      {/* Statistiken Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.byRole.mitglied || 0}</div>
            <p className="text-xs text-muted-foreground">Mitglieder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
             <div className="text-2xl font-bold text-purple-600">{stats.byRole.kranfuehrer + stats.byRole.admin || 0}</div>
             <p className="text-xs text-muted-foreground">Kranführer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.byRole.admin || 0}</div>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Such- und Filter-Bereich */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Suche & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nach Name, E-Mail, Telefon oder Mitgliedsnummer suchen..."
                  value={searchFilter.searchTerm}
                  onChange={(e) => searchFilter.setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label>Rolle</Label>
              <Select 
                value={searchFilter.filters.role || "all"} 
                onValueChange={(value) => searchFilter.setFilter('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRoleFilter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-48">
              <Label>Status</Label>
              <Select 
                value={searchFilter.filters.status || "all"} 
                onValueChange={(value) => searchFilter.setFilter('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchFilter.searchTerm || Object.values(searchFilter.filters).some(v => v && v !== 'all')) && (
              <div className="flex items-end">
                <Button variant="outline" onClick={searchFilter.clearAll}>
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {searchFilter.stats.filtered} von {searchFilter.stats.total} Benutzern angezeigt
          </div>
        </CardContent>
      </Card>

      {/* Benutzerliste */}
      <div className="space-y-3">
        {searchFilter.filteredData.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Benutzer gefunden.</p>
              {searchFilter.searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Versuche einen anderen Suchbegriff oder entferne die Filter.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          searchFilter.filteredData.map((user) => (
            <Card key={user.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                  {/* User Info Section */}
                  <div className="flex-1 min-w-0 space-y-2 sm:space-y-1">
                    {/* Name and Badges Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-medium text-base sm:text-sm">{user.name}</h3>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Role Badges */}
                        <div className="flex gap-1 flex-wrap">
                          {user.roles?.map((role) => (
                            <Badge 
                              key={role}
                              variant="outline" 
                              className="text-xs px-2 py-0.5 h-5"
                            >
                              {getRoleLabel(role)}
                            </Badge>
                          )) || (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                              {getRoleLabel(user.role)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <Badge 
                          variant={user.status === "active" ? "default" : "secondary"}
                          className="text-xs px-2 py-0.5 h-5"
                        >
                          {user.status === "active" ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{user.email}</span>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{user.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Anchor className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">{user.memberNumber}</span>
                      </div>
                      {user.boatName && (
                        <span className="text-xs sm:text-sm">Boot: {user.boatName}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:ml-4 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sr-only">Bearbeiten</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPasswordUserId(user.id);
                        setShowPasswordDialog(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Key className="w-4 h-4" />
                      <span className="sr-only">Passwort ändern</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(user.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Löschen</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUserId ? "Benutzer bearbeiten" : "Neuer Benutzer"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingUserId ? "Bearbeiten Sie die Benutzerdaten" : "Erstellen Sie einen neuen Benutzer"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={userForm.values.name || ""}
                  onChange={(e) => userForm.setValue('name', e.target.value)}
                  placeholder="Vollständiger Name"
                  className={userForm.errors.name ? "border-destructive" : ""}
                />
                {userForm.errors.name && (
                  <p className="text-xs text-destructive mt-1">{userForm.errors.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.values.email || ""}
                  onChange={(e) => userForm.setValue('email', e.target.value)}
                  placeholder="beispiel@email.com"
                  className={userForm.errors.email ? "border-destructive" : ""}
                />
                {userForm.errors.email && (
                  <p className="text-xs text-destructive mt-1">{userForm.errors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={userForm.values.phone || ""}
                  onChange={(e) => userForm.setValue('phone', e.target.value)}
                  placeholder="+43 664 123 4567"
                />
              </div>
              
              <div>
                <Label htmlFor="memberNumber">Mitgliedsnummer</Label>
                <Input
                  id="memberNumber"
                  value={userForm.values.memberNumber || ""}
                  onChange={(e) => userForm.setValue('memberNumber', e.target.value)}
                  placeholder="KSVL001"
                />
              </div>
              
              <div>
                <Label htmlFor="boatName">Boot Name</Label>
                <Input
                  id="boatName"
                  value={userForm.values.boatName || ""}
                  onChange={(e) => userForm.setValue('boatName', e.target.value)}
                  placeholder="Name des Bootes"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={userForm.values.role}
                  onValueChange={(value: UserRole) => {
                    userForm.setValue('role', value);
                    userForm.setValue('roles', generateRolesFromPrimary(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mitglied">Mitglied</SelectItem>
                    <SelectItem value="kranfuehrer">Kranführer</SelectItem>
                    <SelectItem value="gastmitglied">Gastmitglied</SelectItem>
                    <SelectItem value="vorstand">Vorstand</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={userForm.values.status}
                  onValueChange={(value) => userForm.setValue('status', value as "active" | "inactive")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zusätzliche Informationen */}
              <div className="col-span-2">
                <h3 className="text-sm font-medium mt-2 mb-2 border-b pb-2">Zusätzliche Informationen</h3>
              </div>

              <div>
                <Label htmlFor="oesvNumber">OESV Nummer</Label>
                <Input
                  id="oesvNumber"
                  value={(userForm.values as any).oesvNumber || ""}
                  onChange={(e) => userForm.setValue('oesvNumber' as any, e.target.value)}
                  placeholder="OESV Mitgliedsnummer"
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={(userForm.values as any).address || ""}
                  onChange={(e) => userForm.setValue('address' as any, e.target.value)}
                  placeholder="Ihre Adresse"
                />
              </div>

              <div>
                <Label htmlFor="berthNumber">Liegeplatz Nummer</Label>
                <Input
                  id="berthNumber"
                  value={(userForm.values as any).berthNumber || ""}
                  onChange={(e) => userForm.setValue('berthNumber' as any, e.target.value)}
                  placeholder="Liegeplatz Nummer"
                />
              </div>

              <div>
                <Label htmlFor="berthType">Liegeplatz Typ</Label>
                <Select
                  value={(userForm.values as any).berthType || ""}
                  onValueChange={(value) => userForm.setValue('berthType' as any, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schwimmsteg">Schwimmsteg</SelectItem>
                    <SelectItem value="festliegeplatz">Festliegeplatz</SelectItem>
                    <SelectItem value="bojenplatz">Bojenplatz</SelectItem>
                    <SelectItem value="trockenplatz">Trockenplatz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birthDate">Geburtsdatum</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={(userForm.values as any).birthDate || ""}
                  onChange={(e) => userForm.setValue('birthDate' as any, e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="entryDate">Eintrittsdatum</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={(userForm.values as any).entryDate || ""}
                  onChange={(e) => userForm.setValue('entryDate' as any, e.target.value)}
                />
              </div>
            </div>

            {!editingUserId && (
              <div>
                <Label htmlFor="password">Passwort *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
            )}
            
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={handleFormSubmit}
                disabled={userForm.isSubmitting || !userForm.values.name || !userForm.values.email}
              >
                {userForm.isSubmitting 
                  ? "Speichert..." 
                  : editingUserId ? "Aktualisieren" : "Erstellen"
                }
              </Button>
            </div>
            
            {userForm.isDirty && (
              <p className="text-xs text-muted-foreground">
                * Nicht gespeicherte Änderungen
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
            <DialogDescription>
              Geben Sie ein neues Passwort für den Benutzer ein.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword("");
                  setPasswordUserId(null);
                }}
              >
                Abbrechen
              </Button>
              <Button onClick={handlePasswordChange}>
                Passwort ändern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}