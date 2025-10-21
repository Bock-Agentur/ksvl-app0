import { useState, useEffect } from "react";
import { Edit, Save, X, Plus, Trash2, User, Mail, Phone, Anchor, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { User as UserType, UserRole, CustomField, ProfileViewProps, generateRolesFromPrimary } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Mock current users based on role
const mockCurrentUsers: Record<UserRole, UserType> = {
  gastmitglied: {
    id: "0",
    name: "Gast User",
    email: "gast@email.com",
    phone: "+43 664 000 0000",
    boatName: "Gast Boot",
    memberNumber: "KSVL000",
    role: "gastmitglied",
    roles: generateRolesFromPrimary("gastmitglied"),
    status: "active",
    joinDate: "2024-01-01",
    joinedAt: "2024-01-01",
    isActive: true
  },
  mitglied: {
    id: "1",
    name: "Hans Müller",
    email: "hans.mueller@email.com",
    phone: "+43 664 123 4567",
    boatName: "Seeadler",
    memberNumber: "KSVL001",
    role: "mitglied",
    roles: generateRolesFromPrimary("mitglied"),
    status: "active",
    joinDate: "2023-01-15",
    joinedAt: "2023-01-15",
    isActive: true
  },
  kranfuehrer: {
    id: "3",
    name: "Franz Weber",
    email: "f.weber@email.com",
    phone: "+43 664 345 6789",
    memberNumber: "KSVL003",
    role: "kranfuehrer",
    roles: generateRolesFromPrimary("kranfuehrer"),
    status: "active",
    joinDate: "2022-05-10",
    joinedAt: "2022-05-10",
    isActive: true
  },
  admin: {
    id: "4",
    name: "Anna Bauer",
    email: "anna.bauer@email.com",
    phone: "+43 664 456 7890",
    memberNumber: "KSVL004",
    role: "admin",
    roles: generateRolesFromPrimary("admin"),
    status: "active",
    joinDate: "2022-01-01",
    joinedAt: "2022-01-01",
    isActive: true
  },
  vorstand: {
    id: "5",
    name: "Dr. Vorstand",
    email: "vorstand@email.com",
    phone: "+43 664 555 5555",
    memberNumber: "KSVL005",
    role: "vorstand",
    roles: generateRolesFromPrimary("vorstand"),
    status: "active",
    joinDate: "2021-01-01",
    joinedAt: "2021-01-01",
    isActive: true
  }
};

// Mock custom fields (globally defined by admin)
const initialCustomFields: CustomField[] = [
  {
    id: "emergency_contact",
    name: "emergencyContact",
    label: "Notfallkontakt",
    type: "text",
    required: false,
    placeholder: "Name und Telefonnummer"
  },
  {
    id: "sailing_experience",
    name: "sailingExperience",
    label: "Segelerfahrung",
    type: "select",
    required: false,
    options: ["Anfänger", "Fortgeschritten", "Profi", "Instructor"]
  },
  {
    id: "notes",
    name: "notes",
    label: "Notizen",
    type: "textarea",
    required: false,
    placeholder: "Zusätzliche Informationen..."
  }
];

// ProfileViewProps is now imported from @/types

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator",
  vorstand: "Vorstand"
};

const roleColors: Record<UserRole, string> = {
  gastmitglied: "bg-muted text-muted-foreground",
  mitglied: "bg-accent text-accent-foreground",
  kranfuehrer: "bg-gradient-ocean text-primary-foreground",
  admin: "bg-gradient-deep text-primary-foreground",
  vorstand: "bg-gradient-deep text-primary-foreground"
};

export function ProfileView({ currentRole }: ProfileViewProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>(initialCustomFields);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingFields, setIsManagingFields] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [editedCustomValues, setEditedCustomValues] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // New custom field form
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: ""
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Nicht angemeldet');
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id);

      if (rolesError) throw rolesError;

      const roles = userRoles?.map(r => r.role as UserRole) || [];
      const primaryRole = roles.find(r => r !== 'mitglied') || roles[0] || 'mitglied';

      const userData: UserType = {
        id: profile.id,
        name: profile.name || '',
        email: profile.email,
        phone: profile.phone || '',
        boatName: profile.boat_name || '',
        memberNumber: profile.member_number || '',
        roles: roles,
        role: primaryRole as UserRole,
        status: (profile.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        joinDate: profile.entry_date || profile.created_at || '',
        joinedAt: profile.entry_date || profile.created_at || '',
        isActive: profile.status === 'active',
        oesvNumber: profile.oesv_number || '',
        address: profile.address || '',
        berthNumber: profile.berth_number || '',
        berthType: profile.berth_type || '',
        birthDate: profile.birth_date || '',
        entryDate: profile.entry_date || ''
      } as any;

      setUser(userData);
      setEditedUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedUser) return;
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Nicht angemeldet');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editedUser.name,
          phone: editedUser.phone || null,
          member_number: editedUser.memberNumber || null,
          boat_name: editedUser.boatName || null,
          oesv_number: (editedUser as any).oesvNumber || null,
          address: (editedUser as any).address || null,
          berth_number: (editedUser as any).berthNumber || null,
          berth_type: (editedUser as any).berthType || null,
          birth_date: (editedUser as any).birthDate || null,
          entry_date: (editedUser as any).entryDate || null
        })
        .eq('id', authUser.id);

      if (error) throw error;

      setUser(editedUser);
      setCustomValues(editedCustomValues);
      setIsEditing(false);
      toast({
        title: "Profil gespeichert",
        description: "Ihre Profildaten wurden erfolgreich aktualisiert."
      });
      
      loadCurrentUser(); // Reload to ensure fresh data
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleAddCustomField = () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Fehler",
        description: "Name und Label sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    const field: CustomField = {
      id: Date.now().toString(),
      name: newField.name,
      label: newField.label,
      type: newField.type || "text",
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.type === "select" ? newField.options : undefined
    };

    setCustomFields(prev => [...prev, field]);
    setNewField({
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: ""
    });

    toast({
      title: "Feld hinzugefügt",
      description: `Das Feld "${field.label}" wurde zu allen Profilen hinzugefügt.`
    });
  };

  const handleDeleteCustomField = (fieldId: string) => {
    const field = customFields.find(f => f.id === fieldId);
    setCustomFields(prev => prev.filter(f => f.id !== fieldId));
    
    // Remove values for this field
    setCustomValues(prev => {
      const newValues = { ...prev };
      delete newValues[field?.name || ""];
      return newValues;
    });

    toast({
      title: "Feld entfernt",
      description: `Das Feld "${field?.label}" wurde von allen Profilen entfernt.`
    });
  };

  const renderCustomField = (field: CustomField, isEditing: boolean) => {
    const value = isEditing ? editedCustomValues[field.name] : customValues[field.name];
    
    if (!isEditing) {
      if (!value) return null;
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Lade Profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Profil konnte nicht geladen werden.</p>
      </div>
    );
  }

  return (
        <div key={field.id} className="space-y-1">
          <Label className="text-sm font-medium">{field.label}</Label>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
      );
    }

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ""}
              onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </div>
        );
      
      case "select":
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(newValue) => setEditedCustomValues(prev => ({ ...prev, [field.name]: newValue }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Auswählen..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={value || ""}
              onChange={(e) => setEditedCustomValues(prev => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mein Profil</h1>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Ihre Kontoinformationen
          </p>
        </div>
        
        {!isEditing && (
          <Button onClick={() => {
            setIsEditing(true);
            setEditedUser(user);
            setEditedCustomValues(customValues);
          }}>
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs", roleColors[user.role])}>
                  {roleLabels[user.role]}
                </Badge>
                <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                  {user.status === "active" ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Grunddaten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.name}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.name}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>E-Mail</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Telefon</Label>
                {isEditing ? (
                  <Input
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Mitgliedsnummer</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {user.memberNumber}
                  </span>
                </div>
              </div>
              
              {(user.boatName || isEditing) && (
                <div className="space-y-1">
                  <Label>Bootsname</Label>
                  {isEditing ? (
                    <Input
                      value={editedUser.boatName || ""}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, boatName: e.target.value }))}
                      placeholder="Name Ihres Bootes"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.boatName}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-1">
                <Label>Mitglied seit</Label>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.joinedAt).toLocaleDateString('de-AT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Zusätzliche Informationen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>OESV Nummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).oesvNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, oesvNumber: e.target.value } as any))}
                    placeholder="OESV Mitgliedsnummer"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {(user as any).oesvNumber || "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Adresse</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).address || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, address: e.target.value } as any))}
                    placeholder="Ihre Adresse"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {(user as any).address || "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Liegeplatz Nummer</Label>
                {isEditing ? (
                  <Input
                    value={(editedUser as any).berthNumber || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, berthNumber: e.target.value } as any))}
                    placeholder="Liegeplatz Nummer"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {(user as any).berthNumber || "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Liegeplatz Typ</Label>
                {isEditing ? (
                  <Select
                    value={(editedUser as any).berthType || ""}
                    onValueChange={(value) => setEditedUser(prev => ({ ...prev, berthType: value } as any))}
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
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {(user as any).berthType || "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Geburtsdatum</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any).birthDate || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, birthDate: e.target.value } as any))}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {(user as any).birthDate ? new Date((user as any).birthDate).toLocaleDateString('de-AT') : "-"}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <Label>Eintrittsdatum</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={(editedUser as any).entryDate || ""}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, entryDate: e.target.value } as any))}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {(user as any).entryDate ? new Date((user as any).entryDate).toLocaleDateString('de-AT') : "-"}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b pb-2">Zusätzliche Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map(field => renderCustomField(field, isEditing))}
              </div>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="pt-6 border-t">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditedUser(user);
                  setEditedCustomValues(customValues);
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Abbrechen
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Field Management - Bottom Section */}
      {currentRole === "admin" && (
        <div className="flex justify-center">
          <Dialog open={isManagingFields} onOpenChange={setIsManagingFields}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Felder verwalten
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Benutzerdefinierte Felder verwalten</DialogTitle>
                <DialogDescription className="sr-only">
                  Verwalten Sie benutzerdefinierte Felder für Ihr Profil
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Existing Fields */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vorhandene Felder</Label>
                  {customFields.map(field => (
                    <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.type}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCustomField(field.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Add New Field */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Neues Feld hinzufügen</Label>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Feld-Name (z.B. emergencyContact)"
                      value={newField.name || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Anzeige-Label (z.B. Notfallkontakt)"
                      value={newField.label || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                    />
                    <Select
                      value={newField.type}
                      onValueChange={(value: CustomField["type"]) => setNewField(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Textbereich</SelectItem>
                        <SelectItem value="select">Auswahl</SelectItem>
                        <SelectItem value="number">Zahl</SelectItem>
                        <SelectItem value="date">Datum</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {newField.type === "select" && (
                      <Input
                        placeholder="Optionen (kommagetrennt)"
                        onChange={(e) => setNewField(prev => ({ 
                          ...prev, 
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                      />
                    )}
                    
                    <Input
                      placeholder="Platzhalter-Text (optional)"
                      value={newField.placeholder || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                    />
                  </div>
                  
                  <Button onClick={handleAddCustomField} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Feld hinzufügen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
