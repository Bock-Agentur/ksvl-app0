import { ReactNode, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCrudOperations } from "@/hooks";

export interface CrudManagerProps<T extends { id: string }> {
  data: T[];
  entityName: string;
  onCreate?: (item: Omit<T, 'id'>) => void;
  onUpdate?: (id: string, item: Partial<T>) => void;
  onDelete?: (id: string) => void;
  onGet?: (id: string) => T | undefined;
  renderItem: (item: T, actions: CrudActions<T>) => ReactNode;
  renderForm: (
    formProps: {
      item?: T | null;
      onSubmit: (data: T) => Promise<boolean>;
      onCancel: () => void;
      isEditing: boolean;
    }
  ) => ReactNode;
  addButtonLabel?: string;
  editButtonLabel?: string;
  deleteButtonLabel?: string;
  confirmDelete?: boolean;
  className?: string;
}

export interface CrudActions<T> {
  edit: (item: T) => void;
  delete: (id: string) => void;
  duplicate?: (item: T) => void;
}

/**
 * Wiederverwendbare CRUD-Manager Komponente
 * Abstrahiert das gemeinsame Pattern für Create/Read/Update/Delete Operationen
 */
export function CrudManager<T extends { id: string }>({
  data,
  entityName,
  onCreate,
  onUpdate,
  onDelete,
  onGet,
  renderItem,
  renderForm,
  addButtonLabel = "Hinzufügen",
  editButtonLabel = "Bearbeiten",
  deleteButtonLabel = "Löschen",
  confirmDelete = true,
  className = ""
}: CrudManagerProps<T>) {
  
  const crud = useCrudOperations<T>({
    entityName,
    onAdd: onCreate,
    onUpdate,
    onDelete,
    onGet,
    onList: () => data
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setShowDialog(true);
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete) {
      const item = data.find(d => d.id === id);
      const itemName = (item as any)?.name || (item as any)?.title || id;
      
      if (!window.confirm(`Möchtest du "${itemName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
        return;
      }
    }
    
    await crud.remove(id);
  };

  const handleDuplicate = (item: T) => {
    const duplicatedItem = {
      ...item,
      id: undefined, // Wird automatisch generiert
      name: (item as any).name ? `${(item as any).name} (Kopie)` : undefined,
      title: (item as any).title ? `${(item as any).title} (Kopie)` : undefined,
    };
    
    setEditingItem(duplicatedItem as T);
    setShowDialog(true);
  };

  const handleFormSubmit = async (data: T): Promise<boolean> => {
    try {
      let success: boolean;
      
      if (editingItem?.id) {
        success = await crud.update(editingItem.id, data);
      } else {
        success = await crud.create(data);
      }
      
      if (success) {
        setShowDialog(false);
        setEditingItem(null);
      }
      
      return success;
    } catch (error) {
      console.error('CRUD operation failed:', error);
      return false;
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingItem(null);
  };

  const actions: CrudActions<T> = {
    edit: handleEdit,
    delete: handleDelete,
    duplicate: handleDuplicate
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Add Button Header */}
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {addButtonLabel}
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {data.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Keine {entityName.toLowerCase()} vorhanden.</p>
              <Button onClick={handleAdd} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Ersten {entityName} erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          data.map((item) => (
            <div key={item.id}>
              {renderItem(item, actions)}
            </div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? `${entityName} bearbeiten` : `${entityName} erstellen`}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? `Bearbeiten Sie den/die ${entityName}` : `Erstellen Sie einen/eine neuen/neue ${entityName}`}
            </DialogDescription>
          </DialogHeader>
          
          {renderForm({
            item: editingItem,
            onSubmit: handleFormSubmit,
            onCancel: handleCancel,
            isEditing: !!editingItem?.id
          })}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Standard Item Actions Component
export function StandardItemActions<T extends { id: string }>({ 
  item, 
  actions,
  showDuplicate = true,
  editButtonVariant = "outline",
  deleteButtonVariant = "outline"
}: { 
  item: T;
  actions: CrudActions<T>;
  showDuplicate?: boolean;
  editButtonVariant?: "outline" | "ghost" | "secondary";
  deleteButtonVariant?: "outline" | "ghost" | "secondary";
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={editButtonVariant}
        onClick={() => actions.edit(item)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      
      {showDuplicate && actions.duplicate && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => actions.duplicate?.(item)}
          title="Duplizieren"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
      
      <Button
        size="sm"
        variant={deleteButtonVariant}
        onClick={() => actions.delete(item.id)}
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Quick CRUD für einfache Listen
export interface QuickCrudItem {
  id: string;
  name: string;
  description?: string;
}

export function QuickCrudList<T extends QuickCrudItem>({
  items,
  entityName,
  onAdd,
  onUpdate,
  onDelete,
  renderCustomFields,
  className
}: {
  items: T[];
  entityName: string;
  onAdd: (item: Omit<T, 'id'>) => void;
  onUpdate: (id: string, item: Partial<T>) => void;
  onDelete: (id: string) => void;
  renderCustomFields?: (item: T | null, onChange: (field: string, value: any) => void) => ReactNode;
  className?: string;
}) {
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <CrudManager
      data={items}
      entityName={entityName}
      onCreate={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
      className={className}
      renderItem={(item, actions) => (
        <Card className="transition-colors hover:bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                )}
              </div>
              <StandardItemActions item={item} actions={actions} />
            </div>
          </CardContent>
        </Card>
      )}
      renderForm={({ item, onSubmit, onCancel, isEditing }) => (
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <input
              type="text"
              value={item?.name || formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder={`${entityName} Name`}
            />
          </div>
          
          <div>
            <Label>Beschreibung</Label>
            <textarea
              value={item?.description || formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="Beschreibung (optional)"
              rows={3}
            />
          </div>
          
          {renderCustomFields && renderCustomFields(item, handleFieldChange)}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button onClick={() => onSubmit({
              ...item,
              ...formData,
              name: item?.name || formData.name,
              description: item?.description || formData.description
            } as T)}>
              {isEditing ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </div>
      )}
    />
  );
}