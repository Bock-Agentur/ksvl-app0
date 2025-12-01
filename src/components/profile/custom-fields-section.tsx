import { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks";
import { CustomField } from "@/types";

interface CustomFieldsSectionProps {
  isAdmin: boolean;
  customFields: CustomField[];
  customValues: Record<string, any>;
  editedCustomValues: Record<string, any>;
  isEditing: boolean;
  fieldsLoading: boolean;
  onValueChange: (fieldName: string, value: any) => void;
  onAddField: (field: Partial<CustomField>) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
}

export function CustomFieldsSection({
  isAdmin,
  customFields,
  customValues,
  editedCustomValues,
  isEditing,
  fieldsLoading,
  onValueChange,
  onAddField,
  onDeleteField,
}: CustomFieldsSectionProps) {
  const [isManagingFields, setIsManagingFields] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
  });
  const { toast } = useToast();

  const renderCustomField = (field: CustomField) => {
    const value = isEditing
      ? editedCustomValues[field.name]
      : customValues[field.name];

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
              {field.label}{" "}
              {field.required && <span className="text-destructive">*</span>}
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
              {field.label}{" "}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(newValue) => onValueChange(field.name, newValue)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={field.placeholder || "Auswählen..."}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}{" "}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                  ? "date"
                  : "text"
              }
              value={value || ""}
              onChange={(e) => onValueChange(field.name, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  const handleAddField = async () => {
    if (!newField.name || !newField.label) {
      toast({
        title: "Fehler",
        description: "Bitte Feldname und Anzeigename ausfüllen.",
        variant: "destructive",
      });
      return;
    }

    await onAddField({
      name: newField.name!,
      label: newField.label!,
      type: newField.type || "text",
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.type === "select" ? newField.options : undefined,
    });

    setNewField({
      name: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    });

    toast({
      title: "Feld hinzugefügt",
      description: `Das Feld "${newField.label}" wurde zu allen Profilen hinzugefügt.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Admin: Custom Fields verwalten Button */}
      {isAdmin && !isEditing && (
        <div className="flex justify-end">
          <Dialog open={isManagingFields} onOpenChange={setIsManagingFields}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-3 h-3 mr-1.5" />
                Custom Fields verwalten
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
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="z.B. custom_field_1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-label">Anzeigename</Label>
                      <Input
                        id="field-label"
                        value={newField.label || ""}
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        placeholder="z.B. Zusätzliche Info"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-type">Feldtyp</Label>
                      <Select
                        value={newField.type || "text"}
                        onValueChange={(value) =>
                          setNewField((prev) => ({
                            ...prev,
                            type: value as any,
                          }))
                        }
                      >
                        <SelectTrigger id="field-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">
                            Mehrzeiliger Text
                          </SelectItem>
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
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            placeholder: e.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {newField.type === "select" && (
                    <div className="space-y-2">
                      <Label htmlFor="field-options">
                        Auswahloptionen (kommagetrennt)
                      </Label>
                      <Input
                        id="field-options"
                        value={newField.options?.join(", ") || ""}
                        onChange={(e) =>
                          setNewField((prev) => ({
                            ...prev,
                            options: e.target.value
                              .split(",")
                              .map((o) => o.trim())
                              .filter((o) => o),
                          }))
                        }
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-required"
                      checked={newField.required || false}
                      onCheckedChange={(checked) =>
                        setNewField((prev) => ({
                          ...prev,
                          required: checked === true,
                        }))
                      }
                    />
                    <label
                      htmlFor="field-required"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Pflichtfeld
                    </label>
                  </div>

                  <Button onClick={handleAddField}>
                    <Plus className="w-4 h-4 mr-2" />
                    Feld hinzufügen
                  </Button>
                </div>

                {/* Existing Fields List */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Vorhandene Felder</h3>

                  {fieldsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Lade Felder...
                    </p>
                  ) : customFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Keine benutzerdefinierten Felder vorhanden.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {customFields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{field.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {field.name} • {field.type}{" "}
                              {field.required && "• Pflichtfeld"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteField(field.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Custom Fields Rendering */}
      {customFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customFields.map((field) => renderCustomField(field))}
        </div>
      )}
    </div>
  );
}
