import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Anchor, Filter, Download, Key, Eye, ChevronDown, ArrowUpDown } from "lucide-react";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUsers, DatabaseUser } from "@/hooks/use-users";
import { useSearchFilter, useCommonFilters } from "@/hooks/use-search-filter";
import { useFormHandler, useCommonFieldConfigs } from "@/hooks/use-form-handler";
import { User, UserRole, generateRolesFromPrimary } from "@/types";
import { ProfileView } from "./profile-view";
import { cn } from "@/lib/utils";
import { UserRoleSelector } from "./user-role-selector";
import { UserCardWithCustomFields } from "./user-card-with-custom-fields";
import { useRoleBadgeSettings } from "@/hooks/use-role-badge-settings";
import {
  getRoleLabel, 
  calculateUserStats, 
  convertToCSV, 
  downloadCSV, 
  generateMemberNumber 
} from "@/lib/business-logic";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";

/**
 * Benutzer-Verwaltung mit Supabase Datenbank
 */
export function UserManagementRefactored() {
  const { users: dbUsers, loading, deleteUser: deleteDbUser, refreshUsers } = useUsers();
  const { toast } = useToast();
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();
  const { isPageSticky } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky('userManagement');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'memberNumber' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Convert DatabaseUser to User format for compatibility
  const users: User[] = dbUsers.map(u => ({
    id: u.id,
    name: u.name || '',
    username: u.username || '',
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
    
    // Existing fields
    oesvNumber: u.oesv_number || '',
    address: u.address || '',
    berthNumber: u.berth_number || '',
    berthType: u.berth_type || '',
    birthDate: u.birth_date || '',
    entryDate: u.entry_date || '',
    
    // New fields
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    streetAddress: u.street_address || '',
    postalCode: u.postal_code || '',
    city: u.city || '',
    membershipType: u.membership_type || '',
    membershipStatus: u.membership_status || 'Aktiv',
    vorstandFunktion: u.vorstand_funktion || '',
    boatType: u.boat_type || '',
    boatLength: u.boat_length || undefined,
    boatWidth: u.boat_width || undefined,
    boatColor: u.boat_color || '',
    berthLength: u.berth_length || undefined,
    berthWidth: u.berth_width || undefined,
    buoyRadius: u.buoy_radius || undefined,
    hasDinghyBerth: u.has_dinghy_berth || false,
    beverageChipStatus: u.beverage_chip_status || 'Aktiv',
    emergencyContactName: u.emergency_contact_name || '',
    emergencyContactPhone: u.emergency_contact_phone || ''
  } as any));

  // Such- und Filter-Funktionalität mit wiederverwendbarem Hook
  const { userRoleFilter, statusFilter } = useCommonFilters();
  
  const searchFilter = useSearchFilter(users, {
    searchFields: [
      'name',
      'firstName',
      'lastName',
      'email',
      'username',
      'memberNumber',
      'phone',
      'boatName',
      'berthNumber',
      'oesvNumber',
      'address',
      'city',
      'vorstandFunktion'
    ],
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

  // Sortier-Logik
  const sortedUsers = [...searchFilter.filteredData].sort((a, b) => {
    let compareA: string | number = '';
    let compareB: string | number = '';

    switch (sortBy) {
      case 'name':
        // Use firstName and lastName directly from user object
        const aFullName = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.name;
        const bFullName = [b.firstName, b.lastName].filter(Boolean).join(' ') || b.name;
        
        compareA = aFullName.toLowerCase();
        compareB = bFullName.toLowerCase();
        break;
      case 'email':
        compareA = a.email.toLowerCase();
        compareB = b.email.toLowerCase();
        break;
      case 'memberNumber':
        compareA = (a.memberNumber || '').toLowerCase();
        compareB = (b.memberNumber || '').toLowerCase();
        break;
      case 'role':
        compareA = (a.role || '').toLowerCase();
        compareB = (b.role || '').toLowerCase();
        break;
    }

    if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
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
    <div className={cn(
      "p-4 max-w-7xl mx-auto",
      isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-6"
    )}>
      {/* Fixed Header Area */}
      <div className={cn(
        "space-y-2",
        isStickyEnabled ? "flex-shrink-0 relative z-10" : ""
      )}>
      {/* Hero Card */}
      <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Mitgliederverwaltung</h1>
              <p className="text-muted-foreground">
                {stats.total} Mitglieder • {stats.active} aktiv • {stats.roleCount.admin} Admins • {stats.activeRate}% Aktivitätsrate
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-auto"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button 
                onClick={handleAddUser}
                className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-auto"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Benutzer hinzufügen</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiken Cards - Collapsible auf Mobile */}
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen} className="sm:hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 hover:bg-white/90 px-6 py-4 h-auto"
          >
            <span className="font-semibold text-sm">Statistiken anzeigen</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isStatsOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-primary">{stats.total}</div>
                    <p className="text-[10px] text-muted-foreground">Gesamt</p>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-green-600">{stats.active}</div>
                    <p className="text-[10px] text-muted-foreground">Aktiv</p>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-blue-600">{stats.roleCount.mitglied}</div>
                    <p className="text-[10px] text-muted-foreground">Mitglieder</p>
                  </CardContent>
                </Card>
                <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-purple-600">{stats.roleCount.kranfuehrer}</div>
                    <p className="text-[10px] text-muted-foreground">Kranführer</p>
                  </CardContent>
                </Card>
                <Card className="col-span-2 bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-red-600">{stats.roleCount.admin}</div>
                    <p className="text-[10px] text-muted-foreground">Admins</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Statistiken Cards - Normal auf Desktop */}
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-primary">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-green-600">{stats.active}</div>
            <p className="text-[10px] text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-blue-600">{stats.roleCount.mitglied}</div>
            <p className="text-[10px] text-muted-foreground">Mitglieder</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardContent className="pt-3 pb-2">
             <div className="text-lg font-bold text-purple-600">{stats.roleCount.kranfuehrer}</div>
             <p className="text-[10px] text-muted-foreground">Kranführer</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-red-600">{stats.roleCount.admin}</div>
            <p className="text-[10px] text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Such- und Filter-Bereich - Collapsible auf Mobile */}
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="sm:hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 hover:bg-white/90 px-6 py-4 h-auto"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-semibold text-sm">Suche & Filter</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-mobile">Suche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-mobile"
                      placeholder="Nach Name, E-Mail, Telefon..."
                      value={searchFilter.searchTerm}
                      onChange={(e) => searchFilter.setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
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

                <div>
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
                  <Button variant="outline" onClick={searchFilter.clearAll} className="w-full">
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{searchFilter.stats.filtered} von {searchFilter.stats.total} Benutzern</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort-mobile" className="text-xs">Sortieren:</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger id="sort-mobile" className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">E-Mail</SelectItem>
                      <SelectItem value="memberNumber">Mitgliedsnr.</SelectItem>
                      <SelectItem value="role">Rolle</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Such- und Filter-Bereich - Normal auf Desktop */}
      <Card className="hidden sm:block bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Suche & Filter
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-desktop" className="text-sm font-normal">Sortieren:</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger id="sort-desktop" className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="memberNumber">Mitgliedsnummer</SelectItem>
                  <SelectItem value="role">Rolle</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
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
      </div>

      {/* Scrollable Content Area */}
      <div className={cn(
        "space-y-6",
        isStickyEnabled ? "flex-1 overflow-y-auto" : ""
      )}>
      {/* Benutzerliste */}
      <div className="space-y-3">
        {sortedUsers.length === 0 ? (
          <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
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
          sortedUsers.map((user) => (
            <UserCardWithCustomFields
              key={user.id}
              user={user}
              getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
              onViewUser={handleViewUser}
              onPasswordChange={(userId) => {
                setPasswordUserId(userId);
                setShowPasswordDialog(true);
              }}
              onDeleteUser={handleDeleteUser}
            />
          ))
        )}
      </div>

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
    </div>
  );
}