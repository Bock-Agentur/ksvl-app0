import { useState } from "react";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { CustomField } from "@/types/common";

type CustomFieldGroup = 'Kontakt' | 'Persönlich' | 'Mitgliedschaft' | 'Boot' | 'Liegeplatz' | 'Sonstiges';

const fieldGroups: CustomFieldGroup[] = ['Kontakt', 'Persönlich', 'Mitgliedschaft', 'Boot', 'Liegeplatz', 'Sonstiges'];

export function CustomFieldsManager() {
  const { customFields, loading, addCustomField, deleteCustomField, refreshCustomFields } = useCustomFields();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<Partial<CustomField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    group: 'Sonstiges',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.label) {
      toast({
        title: "Fehler",
        description: "Name und Label sind erforderlich",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCustomField(formData as Omit<CustomField, 'id'>);
      toast({
        title: "Erfolg",
        description: "Custom Field wurde erstellt",
      });
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        group: 'Sonstiges',
      });
      refreshCustomFields();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Custom Field konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Möchten Sie dieses Custom Field wirklich löschen? Alle zugehörigen Daten gehen verloren.")) {
      return;
    }

    try {
      await deleteCustomField(fieldId);
      toast({
        title: "Erfolg",
        description: "Custom Field wurde gelöscht",
      });
      refreshCustomFields();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Custom Field konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const groupedFields = customFields.reduce((acc, field) => {
    const group = field.group || 'Sonstiges';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  if (loading) {
    return <div className="p-4">Lade Custom Fields...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Fields Verwaltung</h2>
          <p className="text-muted-foreground">
            Verwalten Sie benutzerdefinierte Felder für Benutzerprofile
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neues Feld
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neues Custom Field anlegen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues benutzerdefiniertes Feld
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name (technisch)</Label>
                <Input
                  id="name"
                  placeholder="z.B. boat_color"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                />
              </div>
              <div>
                <Label htmlFor="label">Label (Anzeigename)</Label>
                <Input
                  id="label"
                  placeholder="z.B. Bootsfarbe"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Feldtyp</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="number">Zahl</SelectItem>
                    <SelectItem value="date">Datum</SelectItem>
                    <SelectItem value="email">E-Mail</SelectItem>
                    <SelectItem value="phone">Telefon</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="group">Gruppe</Label>
                <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldGroups.map((group) => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="placeholder">Platzhalter (optional)</Label>
                <Input
                  id="placeholder"
                  placeholder="z.B. Blau"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                />
                <Label htmlFor="required">Pflichtfeld</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit}>Erstellen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {fieldGroups.map((groupName) => {
          const fields = groupedFields[groupName] || [];
          if (fields.length === 0) return null;

          return (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{groupName}</span>
                  <Badge variant="secondary">{fields.length} Felder</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fields.sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {field.name} • {field.type}
                            {field.required && " • Pflichtfeld"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {customFields.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Noch keine Custom Fields vorhanden. Klicken Sie auf "Neues Feld" um zu starten.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
