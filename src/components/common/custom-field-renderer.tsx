import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CustomField } from "@/types/custom-fields";

interface CustomFieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  isEditing: boolean;
  displayIcon?: React.ReactNode;
}

export function CustomFieldRenderer({ 
  field, 
  value, 
  onChange, 
  isEditing,
  displayIcon 
}: CustomFieldRendererProps) {
  const fieldValue = value || '';

  if (!isEditing) {
    // Display mode
    let displayValue = fieldValue || '-';
    
    if (field.type === 'date' && fieldValue) {
      displayValue = new Date(fieldValue).toLocaleDateString('de-AT');
    }
    
    return (
      <div className="space-y-2">
        <Label>{field.label} {field.required && '*'}</Label>
        <div className="flex items-center gap-2">
          {displayIcon}
          <span className="text-sm text-muted-foreground">{displayValue}</span>
        </div>
      </div>
    );
  }

  // Edit mode
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <div className="space-y-2">
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type={field.type}
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );
    
    case 'number':
      return (
        <div className="space-y-2">
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type="number"
            step="0.1"
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      );
    
    case 'date':
      return (
        <div className="space-y-2">
          <Label>{field.label} {field.required && '*'}</Label>
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
          />
        </div>
      );
    
    case 'textarea':
      return (
        <div className="space-y-2">
          <Label>{field.label} {field.required && '*'}</Label>
          <Textarea
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        </div>
      );
    
    case 'select':
      return (
        <div className="space-y-2">
          <Label>{field.label} {field.required && '*'}</Label>
          <Select
            value={fieldValue}
            onValueChange={(val) => onChange(field.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    
    default:
      return null;
  }
}

// Helper to group fields by group
export function groupFieldsByGroup(fields: CustomField[]) {
  return fields.reduce((acc, field) => {
    const group = field.group || 'Weitere';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);
}
