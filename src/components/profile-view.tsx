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

// Mock current users based on role
const mockCurrentUsers: Record<UserRole, UserType> = {
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
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator"
};

const roleColors: Record<UserRole, string> = {
  mitglied: "bg-accent text-accent-foreground",
  kranfuehrer: "bg-gradient-ocean text-primary-foreground",
  admin: "bg-gradient-deep text-primary-foreground"
};

export function ProfileView({ currentRole }: ProfileViewProps) {
  const [user, setUser] = useState<UserType>(mockCurrentUsers[currentRole]);
  const [customFields, setCustomFields] = useState<CustomField[]>(initialCustomFields);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingFields, setIsManagingFields] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType>(user);
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
    setUser(mockCurrentUsers[currentRole]);
    setEditedUser(mockCurrentUsers[currentRole]);
  }, [currentRole]);

  const handleSaveProfile = () => {
    setUser(editedUser);
    setCustomValues(editedCustomValues);
    setIsEditing(false);
    toast({
      title: "Profil gespeichert",
      description: "Ihre Profildaten wurden erfolgreich aktualisiert."
    });
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
