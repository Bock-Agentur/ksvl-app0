import { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { CustomField } from "@/types";

interface CustomFieldsSectionProps {
  isAdmin: boolean;
  customValues: Record<string, any>;
  editedCustomValues: Record<string, any>;
  isEditing: boolean;
  onValueChange: (fieldName: string, value: any) => void;
}

export function CustomFieldsSection({
  isAdmin,
  customValues,
  editedCustomValues,
  isEditing,
  onValueChange
}: CustomFieldsSectionProps) {
  const [isManagingFields, setIsManagingFields] = useState(false);
  const { customFields, loading: fieldsLoading, addCustomField, deleteCustomField } = useCustomFields();
  const { toast } = useToast();

  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: ""
  });

  const handleAddCustomField = async () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Fehler",
        description: "Name und Label sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addCustomField({
        name: newField.name!,
        label: newField.label!,
        type: newField.type || "text",
        required: newField.required || false,
        placeholder: newField.placeholder,
        options: newField.type === "select" ? newField.options : undefined
      });

      setNewField({
        name: "",
        label: "",
        type: "text",
        required: false,
        placeholder: ""
      });

      toast({
        title: "Feld hinzugefügt",
        description: `Das Feld "${newField.label}" wurde zu allen Profilen hinzugefügt.`
      });
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Fehler",
        description: "Feld konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomField = async (fieldId: string) => {
    const field = customFields.find(f => f.id === fieldId);
    
    try {
      await deleteCustomField(fieldId);

      toast({
        title: "Feld entfernt",
        description: `Das Feld "${field?.label}" wurde von allen Profilen entfernt.`
      });
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Fehler",
        description: "Feld konnte nicht entfernt werden.",
        variant: "destructive"
      });
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = isEditing ? editedCustomValues[field.name] : customValues[field.name];
    
    if (!isEditing) {
      if (!value) return null;
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
      );
    }

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ""}
              onChange={(e) => onValueChange(field.name, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
      
      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(newValue) => onValueChange(field.name, newValue)}
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
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={value || ""}
              onChange={(e) => onValueChange(field.name, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  if (customFields.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <>
      {isAdmin && (
        <Dialog open={isManagingFields} onOpenChange={setIsManagingFields}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Settings className="w-3 h-3 mr-1.5" />
              Felder verwalten
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Custom Fields verwalten</DialogTitle>
              <DialogDescription>
                Verwalten Sie zusätzliche Felder für alle Benutzerprofile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Add New Field Form */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Neues Feld hinzufügen</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-name">Feldname (technisch)</Label>
                    <Input
                      id="field-name"
                      value={newField.name || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="z.B. custom_field_1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="field-label">Anzeigename</Label>
                    <Input
                      id="field-label"
                      value={newField.label || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="z.B. Zusätzliche Info"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="field-type">Feldtyp</Label>
                    <Select
                      value={newField.type || "text"}
                      onValueChange={(value) => setNewField(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Mehrzeiliger Text</SelectItem>
                        <SelectItem value="number">Zahl</SelectItem>
                        <SelectItem value="date">Datum</SelectItem>
                        <SelectItem value="select">Auswahl</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="field-placeholder">Platzhalter</Label>
                    <Input
                      id="field-placeholder"
                      value={newField.placeholder || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                {newField.type === "select" && (
                  <div className="space-y-2">
                    <Label htmlFor="field-options">Auswahloptionen (kommagetrennt)</Label>
                    <Input
                      id="field-options"
                      value={newField.options?.join(", ") || ""}
                      onChange={(e) => setNewField(prev => ({ 
                        ...prev, 
                        options: e.target.value.split(",").map(o => o.trim()).filter(o => o) 
                      }))}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-required"
                    checked={newField.required || false}
                    onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked === true }))}
                  />
                  <label htmlFor="field-required" className="text-sm font-medium cursor-pointer">
                    Pflichtfeld
                  </label>
                </div>
                
                <Button onClick={handleAddCustomField}>
                  <Plus className="w-4 h-4 mr-2" />
                  Feld hinzufügen
                </Button>
              </div>

              {/* Existing Fields List */}
              <div className="space-y-4">
                <h3 className="font-semibold">Bestehende Felder</h3>
                {fieldsLoading ? (
                  <p className="text-sm text-muted-foreground">Lade Felder...</p>
                ) : customFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Noch keine Custom Fields vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {customFields.map(field => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{field.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Typ: {field.type} | Name: {field.name}
                            {field.required && " | Pflichtfeld"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomField(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Render custom fields in profile */}
      {customFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customFields.map(field => renderCustomField(field))}
        </div>
      )}
    </>
  );
}
