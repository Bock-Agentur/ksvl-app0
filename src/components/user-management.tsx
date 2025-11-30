import { useState } from "react";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useUsers, DatabaseUser } from "@/hooks/use-users";
import { useSearchFilter, useCommonFilters } from "@/hooks/use-search-filter";
import { useFormHandler, useCommonFieldConfigs } from "@/hooks/use-form-handler";
import { User, UserRole, generateRolesFromPrimary } from "@/types";
import { ProfileView } from "./profile-view";
import { cn } from "@/lib/utils";
import { useRoleBadgeSettings } from "@/hooks/use-role-badge-settings";
import { calculateUserStats, convertToCSV, downloadCSV, generateMemberNumber } from "@/lib/business-logic";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/lib/services/user-service";
import { validatePassword } from "@/lib/password-validation";
import { UserHeroSection } from "./user-management/user-hero-section";
import { UserStatsCards } from "./user-management/user-stats-cards";
import { UserFiltersSection } from "./user-management/user-filters-section";
import { UserListSection } from "./user-management/user-list-section";
import { UserAddDialog } from "./user-management/user-add-dialog";
import { UserPasswordDialog } from "./user-management/user-password-dialog";

/**
 * Benutzer-Verwaltung mit Supabase Datenbank
 */
export function UserManagementRefactored() {
  const { users: dbUsers, loading, deleteUser: deleteDbUser, refreshUsers } = useUsers();
  const { toast } = useToast();
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();
  const { isPageSticky } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky('userManagement');
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
      
      if (!password) {
        toast({
          title: "Fehler",
          description: "Bitte geben Sie ein Passwort ein.",
          variant: "destructive"
        });
        return;
      }

      await userService.createUser({
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
      });

      toast({ title: "Erfolg", description: `Benutzer ${data.name} wurde erstellt.` });
      setPassword("");
      refreshUsers();
      setShowAddDialog(false);
    } catch (error: any) {
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
    
    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast({
        title: "Fehler",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      await userService.updatePassword({
        userId: passwordUserId,
        password: password
      });

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
    return (
      <div className={cn(
        "p-4 max-w-7xl mx-auto",
        isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-6"
      )}>
        <Card className="animate-pulse">
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
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
        <UserHeroSection 
          stats={stats} 
          onAddUser={handleAddUser}
          onExport={handleExport}
        />
        
        <UserStatsCards stats={stats} />
        
        <UserFiltersSection
          searchTerm={searchFilter.searchTerm}
          onSearchChange={searchFilter.setSearchTerm}
          roleFilter={searchFilter.filters.role || null}
          onRoleFilterChange={(value) => searchFilter.setFilter('role', value)}
          statusFilter={searchFilter.filters.status || null}
          onStatusFilterChange={(value) => searchFilter.setFilter('status', value)}
          roleOptions={userRoleFilter.options}
          statusOptions={statusFilter.options}
          onClearFilters={searchFilter.clearAll}
          filteredCount={searchFilter.stats.filtered}
          totalCount={searchFilter.stats.total}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className={cn(
        "space-y-6",
        isStickyEnabled ? "flex-1 overflow-y-auto" : ""
      )}>
        <UserListSection
          users={sortedUsers}
          searchTerm={searchFilter.searchTerm}
          getRoleBadgeInlineStyle={getRoleBadgeInlineStyle}
          onViewUser={handleViewUser}
          onPasswordChange={(userId) => {
            setPasswordUserId(userId);
            setShowPasswordDialog(true);
          }}
          onDeleteUser={handleDeleteUser}
        />

        <UserAddDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          formValues={userForm.values as any}
          onFormValueChange={(field, value) => userForm.setValue(field as any, value)}
          formErrors={userForm.errors}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={handleFormSubmit}
        />

        <UserPasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={handlePasswordChange}
          onCancel={() => {
            setShowPasswordDialog(false);
            setPassword("");
            setPasswordUserId(null);
          }}
        />
      </div>
    </div>
  );
}
