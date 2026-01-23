# KSVL Slot Manager - Benutzerverwaltung

## 1. Übersicht

Das User-Management umfasst:
- Profilansicht für alle Benutzer (eigenes Profil)
- Admin-Verwaltung für Benutzer (erstellen, bearbeiten, löschen)
- Dokumenten-Upload für Mitglieder
- Passwort-Management

## 2. User Type Definition

**Datei:** `src/types/user.ts`

```typescript
export type UserRole = 'admin' | 'vorstand' | 'kranfuehrer' | 'mitglied' | 'gastmitglied';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  roles: UserRole[];
  
  // Mitgliedschaft
  memberNumber?: string;
  membershipType?: string;
  membershipStatus?: string;
  oesvNumber?: string;
  entryDate?: string;
  birthDate?: string;
  
  // Adresse
  address?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  
  // Boot
  boatName?: string;
  boatType?: string;
  boatLength?: number;
  boatWidth?: number;
  boatColor?: string;
  
  // Liegeplatz
  berthNumber?: string;
  berthType?: string;
  berthLength?: number;
  berthWidth?: number;
  buoyRadius?: number;
  hasDinghyBerth?: boolean;
  dinghyBerthNumber?: string;
  
  // Zusatzinfos
  parkingPermitNumber?: string;
  parkingPermitIssueDate?: string;
  beverageChipNumber?: string;
  beverageChipIssueDate?: string;
  beverageChipStatus?: string;
  
  // Notfallkontakt
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  
  // Vorstand
  vorstandFunktion?: string;
  boardPositionStartDate?: string;
  boardPositionEndDate?: string;
  
  // Dokumente
  documentBfa?: string;
  documentInsurance?: string;
  documentBerthContract?: string;
  documentMemberPhoto?: string;
  
  // Settings
  avatarUrl?: string;
  status?: string;
  passwordChangeRequired?: boolean;
  twoFactorMethod?: string;
  
  // Datenschutz
  dataPublicInKsvl?: boolean;
  contactPublicInKsvl?: boolean;
  newsletterOptin?: boolean;
  
  // AI
  aiInfoEnabled?: boolean;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
```

## 3. Data Hooks

### 3.1 useUsersData

**Datei:** `src/hooks/core/data/use-users-data.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { UserRole } from '@/types';

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: UserRole[];
  // ... all profile fields
}

export function useUsersData(userId?: string) {
  return useQuery({
    queryKey: userId ? QUERY_KEYS.user(userId) : QUERY_KEYS.users,
    queryFn: async () => {
      // Fetch profiles
      let profilesQuery = supabase.from('profiles').select('*');
      if (userId) {
        profilesQuery = profilesQuery.eq('id', userId);
      }
      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      // Fetch all roles
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => ({
        ...profile,
        firstName: profile.first_name,
        lastName: profile.last_name,
        roles: roles
          ?.filter(r => r.user_id === profile.id)
          .map(r => r.role as UserRole) || ['mitglied'],
      })) || [];

      return userId ? usersWithRoles[0] : usersWithRoles;
    },
    staleTime: 60 * 1000,
  });
}

export function useUserData(userId?: string) {
  const { data, isLoading, error, refetch } = useUsersData(userId);
  return {
    user: Array.isArray(data) ? data[0] : data,
    isLoading,
    error,
    refetch,
  };
}
```

### 3.2 useUsers (mit Realtime)

**Datei:** `src/hooks/core/data/use-users.tsx`

```typescript
import { useEffect, useCallback } from 'react';
import { useUsersData } from './use-users-data';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@/hooks';

export function useUsers() {
  const { data: rawUsers, isLoading, refetch } = useUsersData();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Transform to DatabaseUser format
  const users = rawUsers?.map(transformToUser) || [];

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const refreshUsers = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      // Delete roles first
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Delete profile
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      
      toast({ title: \"Benutzer gelöscht\" });
      await refreshUsers();
    } catch (error: any) {
      toast({ title: \"Fehler\", description: error.message, variant: \"destructive\" });
    }
  }, [toast, refreshUsers]);

  return { users, loading: isLoading, refreshUsers, deleteUser };
}
```

### 3.3 useProfileData

**Datei:** `src/hooks/core/data/use-profile-data.tsx`

```typescript
import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserData } from './use-users-data';

export function useProfileData(options?: { enabled?: boolean }) {
  const { user: authUser } = useAuth();
  const enabled = options?.enabled ?? true;
  
  const { user: profileData, isLoading, refetch } = useUserData(
    enabled && authUser?.id ? authUser.id : undefined
  );

  const fullName = useMemo(() => {
    if (!profileData) return '';
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    return profileData.name || profileData.email?.split('@')[0] || '';
  }, [profileData]);

  return {
    profile: profileData,
    fullName,
    isLoading,
    refetch,
  };
}
```

## 4. User Service

**Datei:** `src/lib/services/user-service.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  // ... other fields
}

interface UpdateUserData {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  // ... other fields
}

class UserService {
  private async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Nicht angemeldet');
    return session;
  }

  private getEdgeFunctionUrl(functionName: string): string {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
  }

  async createUser(data: CreateUserData) {
    const session = await this.getSession();
    
    const response = await fetch(this.getEdgeFunctionUrl('manage-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'create', ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Erstellen');
    }

    return response.json();
  }

  async updateUser(data: UpdateUserData) {
    const session = await this.getSession();
    
    const response = await fetch(this.getEdgeFunctionUrl('manage-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'update', ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Aktualisieren');
    }

    return response.json();
  }

  async deleteUser(userId: string) {
    const session = await this.getSession();
    
    const response = await fetch(this.getEdgeFunctionUrl('manage-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'delete', userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Löschen');
    }

    return response.json();
  }

  async updatePassword(data: { userId: string; password: string }) {
    const session = await this.getSession();
    
    const response = await fetch(this.getEdgeFunctionUrl('manage-user-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'update', ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Passwort-Update');
    }

    return response.json();
  }

  async updateProfile(data: UpdateUserData) {
    // Direct database update for own profile (no Edge Function needed)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        // ... map all fields to snake_case
      })
      .eq('id', data.id);

    if (error) throw error;
    return { success: true };
  }
}

export const userService = new UserService();
```

## 5. Profile Components

### 5.1 ProfileView

**Datei:** `src/components/profile-view.tsx`

```typescript
interface ProfileComponentProps {
  currentRole?: UserRole;
  userId?: string;           // Optional: View other user's profile (admin only)
  onUpdate?: () => void;
  isDialog?: boolean;        // Render in dialog mode
  onBack?: () => void;
}

export function ProfileView({ currentRole, userId, onUpdate, isDialog, onBack }: ProfileComponentProps) {
  const { user, loading, isAdmin, aiInfoEnabled, setAiInfoEnabled, reload } = useProfileLoader({ userId });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  const handleSaveProfile = async () => {
    if (!editedUser) return;
    
    try {
      if (isAdmin && userId) {
        await userService.updateUser(editedUser);
      } else {
        await userService.updateProfile(editedUser);
      }
      
      setIsEditing(false);
      reload();
      onUpdate?.();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className=\"space-y-6\">
      <ProfileHeader
        user={user}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSaveProfile}
        onCancel={() => setIsEditing(false)}
        onBack={onBack}
      />

      <ProfileFormCards
        user={user}
        editedUser={editedUser}
        isEditing={isEditing}
        isAdmin={isAdmin}
        setEditedUser={setEditedUser}
      />

      <ProfileDocumentsSection
        userId={user.id}
        user={user}
        isEditing={isEditing}
        onDocumentUpload={(field, url) => {
          setEditedUser(prev => ({ ...prev, [field]: url }));
          reload();
        }}
      />
    </div>
  );
}
```

### 5.2 Profile Sub-Components

**Struktur:**
```
src/components/profile/
├── hooks/
│   └── use-profile-loader.ts     # Data loading hook
├── profile-header.tsx            # Avatar, Name, Role-Badges
├── profile-form-cards.tsx        # Form wrapper
├── profile-personal-cards.tsx    # Personal data cards
├── profile-master-data-card.tsx  # Mitgliedschaftsdaten
├── profile-boat-cards.tsx        # Boot-Informationen
├── profile-admin-cards.tsx       # Admin-only fields
├── profile-login-card.tsx        # Passwort-Änderung
├── profile-privacy-card.tsx      # Datenschutz-Einstellungen
├── profile-membership-card.tsx   # Mitgliedschaft
└── profile-documents-section.tsx # Dokumente-Upload
```

### 5.3 useProfileLoader Hook

**Datei:** `src/components/profile/hooks/use-profile-loader.ts`

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRole } from '@/hooks';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface UseProfileLoaderOptions {
  userId?: string;
}

export function useProfileLoader({ userId }: UseProfileLoaderOptions = {}) {
  const { user: authUser } = useAuth();
  const { currentRole, hasPermission } = useRole();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInfoEnabled, setAiInfoEnabled] = useState(false);

  const isAdmin = hasPermission('admin');
  const targetId = userId || authUser?.id;

  const reload = async () => {
    if (!targetId) return;
    
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetId);

      setUser({
        ...transformProfileToUser(profile),
        roles: roles?.map(r => r.role) || ['mitglied'],
      });
      setAiInfoEnabled(profile.ai_info_enabled || false);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [targetId]);

  return {
    user,
    loading,
    isAdmin,
    aiInfoEnabled,
    setAiInfoEnabled,
    reload,
  };
}
```

## 6. User Management Page

**Datei:** `src/components/user-management.tsx`

```typescript
export function UserManagementRefactored() {
  const { users, loading, refreshUsers, deleteUser } = useUsers();
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Search and filter
  const { getCommonFilters } = useCommonFilters();
  const {
    filteredData: filteredUsers,
    searchTerm,
    setSearchTerm,
    setFilter,
    filters,
  } = useSearchFilter(users, {
    searchFields: ['name', 'firstName', 'lastName', 'email', 'memberNumber'],
    filters: getCommonFilters().role,
  });

  // Sort users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  }, [filteredUsers, sortBy, sortOrder]);

  const handleAddUser = async (userData: CreateUserRequest) => {
    await userService.createUser(userData);
    await refreshUsers();
    setShowAddDialog(false);
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
  };

  if (selectedUser) {
    return (
      <ProfileView
        userId={selectedUser.id}
        isDialog
        onBack={() => setSelectedUser(null)}
        onUpdate={refreshUsers}
      />
    );
  }

  return (
    <div className=\"space-y-6\">
      <UserHeroSection onAdd={() => setShowAddDialog(true)} />
      <UserStatsCards users={users} />
      <UserFiltersSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilter}
      />
      <UserListSection
        users={sortedUsers}
        onView={setSelectedUser}
        onDelete={handleDeleteUser}
        onPasswordChange={(user) => {
          setSelectedUser(user);
          setShowPasswordDialog(true);
        }}
      />
      <UserAddDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddUser}
      />
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />
    </div>
  );
}
```

## 7. Document Upload

**Datei:** `src/components/profile/profile-documents-section.tsx`

```typescript
interface DocumentType {
  key: 'documentBfa' | 'documentInsurance' | 'documentBerthContract' | 'documentMemberPhoto';
  label: string;
  icon: LucideIcon;
  accept: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { key: 'documentBfa', label: 'Befähigungsausweis (BFA)', icon: Award, accept: 'image/*,.pdf' },
  { key: 'documentInsurance', label: 'Versicherung', icon: Shield, accept: 'image/*,.pdf' },
  { key: 'documentBerthContract', label: 'Liegeplatzvertrag', icon: FileText, accept: 'image/*,.pdf' },
  { key: 'documentMemberPhoto', label: 'Mitgliedsfoto', icon: User, accept: 'image/*' },
];

export function ProfileDocumentsSection({ userId, user, isEditing, onDocumentUpload }) {
  const handleUpload = async (file: File, docType: DocumentType) => {
    const path = `${userId}/${docType.key}/${file.name}`;
    
    const { error } = await supabase.storage
      .from('member-documents')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    // Update profile with document path
    await supabase
      .from('profiles')
      .update({ [docType.key.replace(/([A-Z])/g, '_$1').toLowerCase()]: path })
      .eq('id', userId);

    onDocumentUpload(docType.key, path);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
          {DOCUMENT_TYPES.map((docType) => (
            <DocumentUploadCard
              key={docType.key}
              document={docType}
              currentPath={user[docType.key]}
              onUpload={(file) => handleUpload(file, docType)}
              canEdit={isEditing}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 8. Password Management

### 8.1 PasswordDialog Component

**Datei:** `src/components/common/password-dialog.tsx`

```typescript
interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  userName?: string;
}

export function PasswordDialog({ open, onOpenChange, userId, userName }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      toast({ title: \"Fehler\", description: \"Passwörter stimmen nicht überein\", variant: \"destructive\" });
      return;
    }

    setLoading(true);
    try {
      await userService.updatePassword({ userId: userId!, password });
      toast({ title: \"Passwort geändert\" });
      onOpenChange(false);
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: \"Fehler\", description: error.message, variant: \"destructive\" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort ändern für {userName}</DialogTitle>
        </DialogHeader>
        <div className=\"space-y-4\">
          <Input
            type=\"password\"
            placeholder=\"Neues Passwort\"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type=\"password\"
            placeholder=\"Passwort bestätigen\"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant=\"outline\" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Speichern...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

**Letzte Aktualisierung**: 2026-01-23
