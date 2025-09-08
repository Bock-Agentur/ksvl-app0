import { useState, useMemo } from "react";
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Anchor, Filter, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTestData } from "@/hooks/use-test-data";
import { useCrudOperations } from "@/hooks/use-crud-operations";
import { useSearchFilter, useCommonFilters } from "@/hooks/use-search-filter";
import { User, UserRole } from "@/types";
import { 
  getRoleLabel, 
  calculateUserStats, 
  convertToCSV, 
  downloadCSV, 
  generateMemberNumber 
} from "@/lib/business-logic";

const roleLabels: Record<UserRole, string> = {
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator"
};

const roleColors: Record<UserRole, string> = {
  mitglied: "bg-accent text-accent-foreground",
  kranfuehrer: "bg-gradient-ocean text-primary-foreground",
  admin: "bg-gradient-deep text-primary-foreground"
};

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useTestData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<User>>({
    name: "",
    email: "",
    phone: "",
    boatName: "",
    memberNumber: "",
    role: "mitglied",
    status: "active"
  });

  const [selectedStatus, setSelectedStatus] = useState<"active" | "inactive" | "all">("all");
  const [activeTab, setActiveTab] = useState("overview");

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.boatName && user.boatName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    inactive: users.filter(u => u.status === "inactive").length,
    members: users.filter(u => u.role === "mitglied").length,
    operators: users.filter(u => u.role === "kranfuehrer" || u.role === "admin").length,
    admins: users.filter(u => u.role === "admin").length
  }), [users]);

  const handleSaveUser = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    if (editingUser) {
      // Update existing user
      updateUser({ ...editingUser, ...formData } as User);
      toast({
        title: "Benutzer aktualisiert",
        description: `${formData.name} wurde erfolgreich aktualisiert.`
      });
    } else {
      // Create new user
      const newUser: User = {
        ...formData,
        id: Date.now().toString(),
        joinDate: new Date().toISOString().split('T')[0],
        isActive: formData.status === "active"
      } as User;
      
      addUser(newUser);
      toast({
        title: "Benutzer erstellt",
        description: `${formData.name} wurde erfolgreich erstellt.`
      });
    }

    resetForm();
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    deleteUser(userId);
    toast({
      title: "Benutzer gelöscht",
      description: `${user?.name} wurde erfolgreich gelöscht.`
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      boatName: "",
      memberNumber: "",
      role: "mitglied",
      status: "active"
    });
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Mitgliederverwaltung</h1>
            <p className="text-sm text-muted-foreground">
              Verwalten Sie alle Vereinsmitglieder
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Neuer Benutzer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Benutzer bearbeiten" : "Neuer Benutzer"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {editingUser ? "Bearbeiten Sie die Benutzerdaten" : "Erstellen Sie einen neuen Benutzer"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Vollständiger Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+43 664 123 4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="memberNumber">Mitgliedsnummer</Label>
                  <Input
                    id="memberNumber"
                    value={formData.memberNumber || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, memberNumber: e.target.value }))}
                    placeholder="KSVL001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="boatName">Bootsname</Label>
                  <Input
                    id="boatName"
                    value={formData.boatName || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, boatName: e.target.value }))}
                    placeholder="Name des Bootes"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Rolle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mitglied">👤 Mitglied</SelectItem>
                      <SelectItem value="kranfuehrer">⚓ Kranführer</SelectItem>
                      <SelectItem value="admin">🔧 Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}
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
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveUser} className="flex-1">
                    {editingUser ? "Aktualisieren" : "Erstellen"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Abbrechen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Gesamt</p>
                  <p className="font-semibold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <div>
                  <p className="text-xs text-muted-foreground">Aktiv</p>
                  <p className="font-semibold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <div>
                  <p className="text-xs text-muted-foreground">Mitglieder</p>
                  <p className="font-semibold">{stats.members}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Kranführer</p>
                  <p className="font-semibold">{stats.operators}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-deep"></div>
                <div>
                  <p className="text-xs text-muted-foreground">Admins</p>
                  <p className="font-semibold">{stats.admins}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Suchen nach Name, E-Mail, Mitgliedsnummer oder Boot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedRole} onValueChange={(value: UserRole | "all") => setSelectedRole(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Rolle filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Rollen</SelectItem>
            <SelectItem value="mitglied">👤 Mitglied</SelectItem>
            <SelectItem value="kranfuehrer">⚓ Kranführer</SelectItem>
            <SelectItem value="admin">🔧 Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Benutzer gefunden</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedRole !== "all" 
                  ? "Versuchen Sie andere Suchkriterien." 
                  : "Erstellen Sie den ersten Benutzer."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="transition-wave hover:shadow-card-maritime">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                      <Badge className={cn("text-xs", roleColors[user.role])}>
                        {roleLabels[user.role]}
                      </Badge>
                      <Badge 
                        variant={user.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.status === "active" ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <span className="text-xs">#{user.memberNumber}</span>
                        {user.boatName && (
                          <div className="flex items-center gap-1">
                            <Anchor className="w-3 h-3" />
                            <span className="text-xs">{user.boatName}</span>
                          </div>
                        )}
                        <span className="text-xs">Seit {new Date(user.joinedAt).toLocaleDateString('de-AT')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="hidden sm:flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(user.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}