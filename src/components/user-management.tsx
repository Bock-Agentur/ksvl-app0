import { useState } from "react";
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Anchor, Filter, Download, Key, Eye, LayoutGrid, List } from "lucide-react";
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
import { ProfileView } from "./profile-view";
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
      // Validation only, actual submission in handleFormSubmit
      return true;
    }
  });

  // UI State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  // Statistiken mit Business Logic
  const stats = calculateUserStats(users);

  // Event handlers
  const handleAddUser = () => {
    userForm.reset();
    setPassword("");
    setShowAddDialog(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUserId(user.id);
  };
  
  const handleBackToList = () => {
    setSelectedUserId(null);
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht angemeldet');
      }

      // Always create mode in add dialog
      console.log('Creating new user:', data);
        
      if (!password) {
        toast({
          title: "Fehler",
          description: "Bitte geben Sie ein Passwort ein.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'create',
          userData: {
            email: data.email,
            password: password,
            name: data.name,
            phone: data.phone,
            memberNumber: memberNumber,
            boatName: data.boatName,
            status: data.status,
            roles: data.roles || generateRolesFromPrimary(data.role),
            oesvNumber: (data as any).oesvNumber,
            address: (data as any).address,
            berthNumber: (data as any).berthNumber,
            berthType: (data as any).berthType,
            birthDate: (data as any).birthDate,
            entryDate: (data as any).entryDate
          }
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Benutzer konnte nicht erstellt werden');
      }

      toast({ title: "Erfolg", description: `Benutzer ${data.name} wurde erstellt.` });
      setPassword("");

      refreshUsers();
      setShowAddDialog(false);
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

  // Show user profile view if selected
  if (selectedUserId) {
    return (
      <ProfileView
        userId={selectedUserId}
        currentRole="admin"
        isDialog={false}
        onBack={handleBackToList}
      />
    );
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-primary">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-green-600">{stats.active}</div>
            <p className="text-[10px] text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-blue-600">{stats.byRole.mitglied || 0}</div>
            <p className="text-[10px] text-muted-foreground">Mitglieder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
             <div className="text-lg font-bold text-purple-600">{stats.kranfuehrer || 0}</div>
             <p className="text-[10px] text-muted-foreground">Kranführer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-red-600">{stats.byRole.admin || 0}</div>
            <p className="text-[10px] text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Such- und Filter-Bereich */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Suche & Filter
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                        onClick={() => handleViewUser(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="sr-only">Ansehen</span>
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
      ) : (
        <Card>
          <CardContent className="p-0">
            {searchFilter.filteredData.length === 0 ? (
              <div className="pt-6 pb-6 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keine Benutzer gefunden.</p>
                {searchFilter.searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Versuche einen anderen Suchbegriff oder entferne die Filter.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium">Name</th>
                      <th className="text-left p-3 text-xs font-medium">E-Mail</th>
                      <th className="text-left p-3 text-xs font-medium">Telefon</th>
                      <th className="text-left p-3 text-xs font-medium">Mitgl.-Nr.</th>
                      <th className="text-left p-3 text-xs font-medium">Rollen</th>
                      <th className="text-left p-3 text-xs font-medium">Status</th>
                      <th className="text-right p-3 text-xs font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchFilter.filteredData.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-sm font-medium">{user.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-3 text-sm text-muted-foreground">{user.phone || '-'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{user.memberNumber}</td>
                        <td className="p-3">
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
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={user.status === "active" ? "default" : "secondary"}
                            className="text-xs px-2 py-0.5 h-5"
                          >
                            {user.status === "active" ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="sr-only">Ansehen</span>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benutzer Hinzufügen Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuen Benutzer hinzufügen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Benutzer mit allen erforderlichen Informationen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basis</TabsTrigger>
                <TabsTrigger value="contact">Kontakt & Boot</TabsTrigger>
                <TabsTrigger value="roles">Rollen & Status</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Max Mustermann"
                      value={userForm.values.name || ''}
                      onChange={(e) => userForm.setValue('name', e.target.value)}
                    />
                    {userForm.errors.name && (
                      <p className="text-sm text-destructive">{userForm.errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="max@beispiel.de"
                      value={userForm.values.email || ''}
                      onChange={(e) => userForm.setValue('email', e.target.value)}
                    />
                    {userForm.errors.email && (
                      <p className="text-sm text-destructive">{userForm.errors.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memberNumber">Mitgliedsnummer</Label>
                  <Input
                    id="memberNumber"
                    placeholder="Automatisch generiert, falls leer"
                      value={userForm.values.memberNumber || ''}
                      onChange={(e) => userForm.setValue('memberNumber', e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      placeholder="+43 123 456789"
                      value={userForm.values.phone || ''}
                      onChange={(e) => userForm.setValue('phone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="boatName">Bootsname</Label>
                    <Input
                      id="boatName"
                      placeholder="Name des Bootes"
                      value={userForm.values.boatName || ''}
                      onChange={(e) => userForm.setValue('boatName', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="streetAddress">Straße</Label>
                    <Input
                      id="streetAddress"
                      placeholder="Musterstraße 123"
                      value={(userForm.values as any).streetAddress || ''}
                      onChange={(e) => userForm.setValue('streetAddress' as any, e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">PLZ</Label>
                    <Input
                      id="postalCode"
                      placeholder="1234"
                      value={(userForm.values as any).postalCode || ''}
                      onChange={(e) => userForm.setValue('postalCode' as any, e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Ort</Label>
                  <Input
                    id="city"
                    placeholder="Wien"
                    value={(userForm.values as any).city || ''}
                    onChange={(e) => userForm.setValue('city' as any, e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="roles" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Rollen</Label>
                  <UserRoleSelector
                    selectedRoles={userForm.values.roles || []}
                    onRolesChange={(roles) => userForm.setValue('roles', roles)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={userForm.values.status || 'active'}
                    onValueChange={(value) => userForm.setValue('status', value as any)}
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
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleFormSubmit}>
                Benutzer erstellen
              </Button>
            </div>
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