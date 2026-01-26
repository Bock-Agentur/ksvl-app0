import { useState, useEffect } from "react";
import { Edit, Save, X, User, Mail, Phone, Anchor, Calendar, Home, Ship, Ticket, ArrowLeft, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast, useRole, useRoleBadgeSettings } from "@/hooks";
import { cn } from "@/lib/utils";
import { User as UserType, UserRole, generateRolesFromPrimary } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { generateMemberNumber } from "@/lib/business-logic";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";
import { userLogger } from "@/lib/logger";

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
  admin: "Admin",
  vorstand: "Vorstand"
};


export function UserDetailView({ user, isOpen, onClose, onUpdate }: UserDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserType>(user);
  const [aiInfoEnabled, setAiInfoEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { getRoleBadgeInlineStyle } = useRoleBadgeSettings();
  
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
        userLogger.debug('Admin role check', { hasAdminRole, roles });
        setIsAdmin(hasAdminRole);
      }
    };
    
    if (isOpen) {
      checkAdmin();
    }
  }, [isOpen]);

  useEffect(() => {
    setEditedUser(user);
    // Load ai_info_enabled from user profile
    const loadAiInfoEnabled = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_info_enabled')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setAiInfoEnabled(profile.ai_info_enabled === true);
      }
    };
    loadAiInfoEnabled();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht angemeldet');
      }

      // First update ai_info_enabled in profiles table
      const { error: aiInfoError } = await supabase
        .from('profiles')
        .update({ ai_info_enabled: aiInfoEnabled })
        .eq('id', user.id);

      if (aiInfoError) {
        userLogger.error('Error updating ai_info_enabled', aiInfoError);
        throw aiInfoError;
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
            firstName: editedUser.firstName,
            lastName: editedUser.lastName,
            phone: editedUser.phone,
            memberNumber: editedUser.memberNumber,
            boatName: editedUser.boatName,
            streetAddress: editedUser.streetAddress,
            postalCode: editedUser.postalCode,
            city: editedUser.city,
            status: editedUser.status,
            roles: editedUser.roles || generateRolesFromPrimary(editedUser.role),
            oesvNumber: (editedUser as any).oesvNumber,
            address: (editedUser as any).address,
            berthNumber: (editedUser as any).berthNumber,
            berthType: (editedUser as any).berthType,
            birthDate: (editedUser as any).birthDate,
            entryDate: (editedUser as any).entryDate,
            dinghyBerthNumber: (editedUser as any).dinghyBerthNumber,
            boatType: (editedUser as any).boatType,
            boatLength: (editedUser as any).boatLength,
            boatWidth: (editedUser as any).boatWidth,
            parkingPermitNumber: (editedUser as any).parkingPermitNumber,
            parkingPermitIssueDate: (editedUser as any).parkingPermitIssueDate,
            beverageChipNumber: (editedUser as any).beverageChipNumber,
            beverageChipIssueDate: (editedUser as any).beverageChipIssueDate,
            emergencyContact: (editedUser as any).emergencyContact,
            notes: (editedUser as any).notes,
            vorstandFunktion: (editedUser as any).vorstandFunktion,
            dataPublicInKsvl: (editedUser as any).dataPublicInKsvl,
            contactPublicInKsvl: (editedUser as any).contactPublicInKsvl
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
      userLogger.error('Error saving user', error);
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
            
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              )}
              <Button variant="outline" onClick={onClose} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            </div>
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {sortRoles(editedUser.roles || []).map((role) => (
                      <Badge key={role} className="text-xs" style={getRoleBadgeInlineStyle(role)}>
                        {ROLE_LABELS[role] || roleLabels[role]}
                      </Badge>
                    ))}
                    <Badge variant={editedUser.status === "active" ? "default" : "secondary"} className="text-xs">
                      {editedUser.status === "active" ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Rollen-Bearbeitung (nur für Admins im Edit-Modus) */}
              {isEditing && isAdmin && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Rollen zuweisen</Label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(["gastmitglied", "mitglied", "kranfuehrer", "vorstand", "admin"] as UserRole[]).map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-edit-${role}`}
                          checked={(editedUser.roles || []).includes(role)}
                          onCheckedChange={(checked) => {
                            const currentRoles = editedUser.roles || [];
                            let newRoles: UserRole[];
                            
                            if (checked) {
                              newRoles = [...currentRoles, role];
                              // Auto-add dependent roles
                              if (role === "kranfuehrer" && !currentRoles.includes("mitglied")) {
                                newRoles.push("mitglied");
                              }
                              if (role === "admin") {
                                newRoles = ["admin", "kranfuehrer", "mitglied", "gastmitglied"];
                              }
                              if (role === "vorstand") {
                                newRoles = ["vorstand", "admin", "kranfuehrer", "mitglied", "gastmitglied"];
                              }
                            } else {
                              newRoles = currentRoles.filter(r => r !== role);
                              // Auto-remove dependent roles
                              if (role === "mitglied") {
                                newRoles = newRoles.filter(r => !["kranfuehrer", "admin", "vorstand"].includes(r));
                              }
                              if (role === "kranfuehrer") {
                                newRoles = newRoles.filter(r => !["admin", "vorstand"].includes(r));
                              }
                              if (role === "admin") {
                                newRoles = newRoles.filter(r => r !== "vorstand");
                              }
                            }
                            
                            const uniqueRoles = Array.from(new Set(newRoles)) as UserRole[];
                            setEditedUser(prev => ({ ...prev, roles: uniqueRoles }));
                          }}
                        />
                        <Label
                          htmlFor={`role-edit-${role}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {roleLabels[role]}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Vorstand erhält automatisch alle Rollen. Admin erhält alle außer Vorstand.
                  </p>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Persönliche Daten */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                  <User className="w-4 h-4" />
                  Persönliche Daten
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vorname</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.firstName || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Vorname"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{editedUser.firstName || "-"}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Nachname</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.lastName || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Nachname"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{editedUser.lastName || "-"}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Vollständiger Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.name}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Vollständiger Name"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{editedUser.name}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Geburtsdatum</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={(editedUser as any).birthDate || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, birthDate: e.target.value } as any))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {(editedUser as any).birthDate ? new Date((editedUser as any).birthDate).toLocaleDateString('de-AT') : "-"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Kontaktdaten */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                  <Mail className="w-4 h-4" />
                  Kontaktdaten
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{editedUser.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Telefon</Label>
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
                    <Label>Straße & Hausnummer</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.streetAddress || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, streetAddress: e.target.value }))}
                        placeholder="Musterstraße 1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{editedUser.streetAddress || "-"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>PLZ</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.postalCode || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="1010"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{editedUser.postalCode || "-"}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Stadt</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.city || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Wien"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">{editedUser.city || "-"}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Notfallkontakt</Label>
                    {isEditing ? (
                      <Textarea
                        value={(editedUser as any).emergencyContact || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, emergencyContact: e.target.value } as any))}
                        placeholder="Name und Telefonnummer"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {(editedUser as any).emergencyContact || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mitgliedsdaten */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                  <Anchor className="w-4 h-4" />
                  Mitgliedsdaten
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mitgliedsnummer</Label>
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
                    <Label>ÖSV Nummer</Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).oesvNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, oesvNumber: e.target.value } as any))}
                        placeholder="ÖSV Mitgliedsnummer"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).oesvNumber || "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Eintrittsdatum</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={(editedUser as any).entryDate || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, entryDate: e.target.value } as any))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {(editedUser as any).entryDate ? new Date((editedUser as any).entryDate).toLocaleDateString('de-AT') : "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
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

                  {(editedUser as any).vorstandFunktion && (
                    <div className="space-y-2">
                      <Label>Vorstand Funktion</Label>
                      {isEditing ? (
                        <Input
                          value={(editedUser as any).vorstandFunktion || ""}
                          onChange={(e) => setEditedUser(prev => ({ ...prev, vorstandFunktion: e.target.value } as any))}
                          placeholder="z.B. Präsident, Kassier"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {(editedUser as any).vorstandFunktion || "-"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Bootsdaten */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                  <Ship className="w-4 h-4" />
                  Bootsdaten
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bootsname</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.boatName || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, boatName: e.target.value }))}
                        placeholder="Name des Bootes"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{editedUser.boatName || "-"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Bootstyp</Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).boatType || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, boatType: e.target.value } as any))}
                        placeholder="z.B. Segelboot, Motorboot"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).boatType || "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Bootslänge (m)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={(editedUser as any).boatLength || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, boatLength: e.target.value ? parseFloat(e.target.value) : undefined } as any))}
                        placeholder="8.5"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).boatLength ? `${(editedUser as any).boatLength} m` : "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Bootsbreite (m)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={(editedUser as any).boatWidth || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, boatWidth: e.target.value ? parseFloat(e.target.value) : undefined } as any))}
                        placeholder="2.5"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).boatWidth ? `${(editedUser as any).boatWidth} m` : "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Liegeplatz */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                  <Anchor className="w-4 h-4" />
                  Liegeplatz
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Liegeplatz Nummer</Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).berthNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, berthNumber: e.target.value } as any))}
                        placeholder="z.B. A-42"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).berthNumber || "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
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
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).berthType || "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Dingi Liegeplatz</Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).dinghyBerthNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, dinghyBerthNumber: e.target.value } as any))}
                        placeholder="z.B. D-12"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).dinghyBerthNumber || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sonstiges */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-b pb-2">
                  <Ticket className="w-4 h-4" />
                  Sonstiges
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parkausweis Nummer</Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).parkingPermitNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, parkingPermitNumber: e.target.value } as any))}
                        placeholder="P-123"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).parkingPermitNumber || "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Parkausweis Ausstellungsdatum</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={(editedUser as any).parkingPermitIssueDate || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, parkingPermitIssueDate: e.target.value } as any))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {(editedUser as any).parkingPermitIssueDate ? new Date((editedUser as any).parkingPermitIssueDate).toLocaleDateString('de-AT') : "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Getränkechip Nummer</Label>
                    {isEditing ? (
                      <Input
                        value={(editedUser as any).beverageChipNumber || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, beverageChipNumber: e.target.value } as any))}
                        placeholder="G-456"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {(editedUser as any).beverageChipNumber || "-"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Getränkechip Ausstellungsdatum</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={(editedUser as any).beverageChipIssueDate || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, beverageChipIssueDate: e.target.value } as any))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {(editedUser as any).beverageChipIssueDate ? new Date((editedUser as any).beverageChipIssueDate).toLocaleDateString('de-AT') : "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Notizen</Label>
                    {isEditing ? (
                      <Textarea
                        value={(editedUser as any).notes || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, notes: e.target.value } as any))}
                        placeholder="Zusätzliche Notizen"
                        rows={3}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {(editedUser as any).notes || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />


              <Separator />

              {/* AI-Assistent */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">
                  AI-Assistent
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aiInfoEnabled"
                      checked={aiInfoEnabled}
                      onCheckedChange={(checked) => setAiInfoEnabled(checked === true)}
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="aiInfoEnabled"
                      className={cn(
                        "text-sm font-normal cursor-pointer",
                        !isEditing && "cursor-default"
                      )}
                    >
                      AI-Assistent Info aktivieren
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Wenn aktiviert, kann der AI-Assistent die unten eingetragenen Informationen bei Fragen über Sie verwenden.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Datenschutz */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">
                  Datenschutz & KSVL-Verzeichnis
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dataPublic"
                      checked={(editedUser as any).dataPublicInKsvl === true}
                      onCheckedChange={(checked) => 
                        isEditing && setEditedUser(prev => ({ ...prev, dataPublicInKsvl: checked === true } as any))
                      }
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="dataPublic"
                      className={cn(
                        "text-sm font-normal cursor-pointer",
                        !isEditing && "cursor-default"
                      )}
                    >
                      Meine Daten dürfen im KSVL-Verzeichnis veröffentlicht werden
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contactPublic"
                      checked={(editedUser as any).contactPublicInKsvl === true}
                      onCheckedChange={(checked) => 
                        isEditing && setEditedUser(prev => ({ ...prev, contactPublicInKsvl: checked === true } as any))
                      }
                      disabled={!isEditing}
                    />
                    <Label
                      htmlFor="contactPublic"
                      className={cn(
                        "text-sm font-normal cursor-pointer",
                        !isEditing && "cursor-default"
                      )}
                    >
                      Meine Kontaktdaten dürfen im KSVL-Verzeichnis veröffentlicht werden
                    </Label>
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
