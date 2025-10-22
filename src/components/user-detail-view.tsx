import { useState, useEffect } from "react";
import { Edit, Save, X, User, Mail, Phone, Anchor } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { User as UserType, UserRole, generateRolesFromPrimary } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { generateMemberNumber } from "@/lib/business-logic";
import { useRoleBadgeSettings } from "@/hooks/use-role-badge-settings";

interface UserDetailViewProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const roleLabels: Record<UserRole, string> = {
  gastmitglied: "Gastmitglied",
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator",
  vorstand: "Vorstand"
};


export function UserDetailView({ user, isOpen, onClose, onUpdate }: UserDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType>(user);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { getRoleBadgeStyle } = useRoleBadgeSettings();
  
  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id);
        
        const hasAdminRole = roles?.some(r => r.role === 'admin') || false;
        console.log('User is admin:', hasAdminRole, roles);
        setIsAdmin(hasAdminRole);
      }
    };
    
    if (isOpen) {
      checkAdmin();
    }
  }, [isOpen]);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht angemeldet');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update',
          userId: user.id,
          userData: {
            name: editedUser.name,
            phone: editedUser.phone,
            memberNumber: editedUser.memberNumber,
            boatName: editedUser.boatName,
            status: editedUser.status,
            roles: editedUser.roles || generateRolesFromPrimary(editedUser.role),
            oesvNumber: (editedUser as any).oesvNumber,
            address: (editedUser as any).address,
            berthNumber: (editedUser as any).berthNumber,
            berthType: (editedUser as any).berthType,
            birthDate: (editedUser as any).birthDate,
            entryDate: (editedUser as any).entryDate
          }
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Benutzer konnte nicht aktualisiert werden');
      }

      setIsEditing(false);
      toast({
        title: "Erfolg",
        description: "Benutzerdaten wurden erfolgreich aktualisiert."
      });
      
      onUpdate();
      onClose(); // Dialog schließen nach dem Speichern
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Fehler",
        description: error.message || "Benutzerdaten konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Benutzerdetails</DialogTitle>
          <DialogDescription className="sr-only">
            Detaillierte Ansicht und Bearbeitung der Benutzerdaten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{editedUser.name}</h2>
              <p className="text-sm text-muted-foreground">
                Mitgliedsnummer: {editedUser.memberNumber}
              </p>
            </div>
            
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} size="sm">
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
                  <CardTitle className="text-lg">{editedUser.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {editedUser.roles?.map((role) => (
                      <Badge key={role} className={cn("text-xs", getRoleBadgeStyle(role))}>
                        {roleLabels[role]}
                      </Badge>
                    ))}
                    <Badge variant={editedUser.status === "active" ? "default" : "secondary"} className="text-xs">
                      {editedUser.status === "active" ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Rollen - Nur für Admins */}
              {isAdmin && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground border-b pb-2">Rollen</h3>
                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(roleLabels).map(([roleKey, roleLabel]) => {
                        const role = roleKey as UserRole;
                        const isChecked = editedUser.roles?.includes(role) || false;
                        
                        return (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={`role-${role}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentRoles = editedUser.roles || [];
                                let newRoles: UserRole[];
                                
                                if (checked) {
                                  newRoles = [...currentRoles, role];
                                } else {
                                  newRoles = currentRoles.filter(r => r !== role);
                                }
                                
                                // Update primary role if needed
                                const primaryRole = newRoles.find(r => r === 'vorstand') 
                                  || newRoles.find(r => r === 'admin') 
                                  || newRoles.find(r => r === 'kranfuehrer') 
                                  || newRoles.find(r => r === 'mitglied') 
                                  || 'gastmitglied';
                                
                                setEditedUser(prev => ({
                                  ...prev,
                                  roles: newRoles,
                                  role: primaryRole
                                }));
                              }}
                            />
                            <label
                              htmlFor={`role-${role}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {roleLabel}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {editedUser.roles?.map((role) => (
                        <Badge key={role} className={cn("text-xs", getRoleBadgeStyle(role))}>
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Grunddaten */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">Grunddaten</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name: </Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.name}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Vollständiger Name"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">{editedUser.name}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>E-Mail: </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{editedUser.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Telefon: </Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.phone || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+43 664 123 4567"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{editedUser.phone || "-"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Mitgliedsnummer: </Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.memberNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, memberNumber: e.target.value }))}
                        placeholder="KSVL001"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{editedUser.memberNumber || "-"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Boot Name: </Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.boatName || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, boatName: e.target.value }))}
                        placeholder="Name des Bootes"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{editedUser.boatName || "-"}</div>
                    )}
                  </div>


                  <div className="space-y-2">
                    <Label>Status: </Label>
                    {isEditing ? (
                      <Select
                        value={editedUser.status}
                        onValueChange={(value) => setEditedUser(prev => ({ ...prev, status: value as "active" | "inactive" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktiv</SelectItem>
                          <SelectItem value="inactive">Inaktiv</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={editedUser.status === "active" ? "default" : "secondary"}>
                        {editedUser.status === "active" ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Beitrittsdatum: </Label>
                    <div className="text-sm text-muted-foreground">
                      {editedUser.joinDate ? new Date(editedUser.joinDate).toLocaleDateString('de-AT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "-"}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Zusätzliche Informationen */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">Zusätzliche Informationen</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>OESV Nummer: </Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).oesvNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, oesvNumber: e.target.value } as any))}
                        placeholder="OESV Mitgliedsnummer"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).oesvNumber || "-"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Adresse: </Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).address || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, address: e.target.value } as any))}
                        placeholder="Ihre Adresse"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).address || "-"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Liegeplatz Nummer: </Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).berthNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, berthNumber: e.target.value } as any))}
                        placeholder="Liegeplatz Nummer"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).berthNumber || "-"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Liegeplatz Typ: </Label>
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
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).berthType || "-"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Geburtsdatum: </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={(editedUser as any).birthDate || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, birthDate: e.target.value } as any))}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).birthDate ? new Date((editedUser as any).birthDate).toLocaleDateString('de-AT') : "-"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Eintrittsdatum: </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={(editedUser as any).entryDate || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, entryDate: e.target.value } as any))}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).entryDate ? new Date((editedUser as any).entryDate).toLocaleDateString('de-AT') : "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditedUser(user);
                  setIsEditing(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
