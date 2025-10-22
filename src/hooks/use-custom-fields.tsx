import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomField } from '@/types';

export function useCustomFields() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('created_at');

      if (error) throw error;

      const fields: CustomField[] = (data || []).map(field => ({
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type as CustomField['type'],
        required: field.required || false,
        placeholder: field.placeholder || undefined,
        options: field.options || undefined,
        order: field.order || 0,
        group: field.group || undefined,
        monday_column_id: field.monday_column_id || undefined
      }));

      setCustomFields(fields);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: "Fehler",
        description: "Custom Fields konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomFields();

    // Subscribe to changes
    const channel = supabase
      .channel('custom-fields-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'custom_fields' }, 
        () => fetchCustomFields()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const addCustomField = async (field: Omit<CustomField, 'id'>) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .insert({
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required || false,
          placeholder: field.placeholder || null,
          options: field.options || null,
          order: field.order || 0,
          group: field.group || null,
          monday_column_id: field.monday_column_id || null
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Custom Field wurde hinzugefügt."
      });

      fetchCustomFields();
    } catch (error: any) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Fehler",
        description: error.message || "Custom Field konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    }
  };

  const updateCustomField = async (fieldId: string, updates: Partial<CustomField>) => {
    const { error } = await supabase
      .from("custom_fields")
      .update(updates)
      .eq("id", fieldId);

    if (error) throw error;
    await fetchCustomFields();
  };

  const reorderCustomFields = async (fieldIds: string[]) => {
    const updates = fieldIds.map((id, index) => ({ id, order: index }));
    
    for (const update of updates) {
      await supabase
        .from("custom_fields")
        .update({ order: update.order })
        .eq("id", update.id);
    }
    
    await fetchCustomFields();
  };

  const getFieldsByGroup = (group?: string) => {
    if (!group) return customFields;
    return customFields.filter(f => f.group === group);
  };

  const validateFieldValue = (field: CustomField, value: any): { isValid: boolean; error?: string } => {
    if (field.required && !value) {
      return { isValid: false, error: `${field.label} ist erforderlich` };
    }

    if (!value) return { isValid: true };

    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, error: 'Ungültige E-Mail-Adresse' };
        }
        break;
      case 'phone':
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
        if (!phoneRegex.test(value)) {
          return { isValid: false, error: 'Ungültige Telefonnummer' };
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          return { isValid: false, error: `${field.label} muss eine Zahl sein` };
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          return { isValid: false, error: 'Ungültiges Datum' };
        }
        break;
      case 'select':
        if (field.options && !field.options.includes(value)) {
          return { isValid: false, error: `Ungültiger Wert für ${field.label}` };
        }
        break;
    }

    return { isValid: true };
  };

  const deleteCustomField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Custom Field wurde gelöscht."
      });

      fetchCustomFields();
    } catch (error: any) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Fehler",
        description: error.message || "Custom Field konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  return {
    customFields,
    loading,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    reorderCustomFields,
    getFieldsByGroup,
    validateFieldValue,
    refreshCustomFields: fetchCustomFields
  };
}

export function useCustomFieldValues(userId: string) {
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomValues = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*, custom_fields(*)')
        .eq('user_id', userId);

      if (error) throw error;

      const values: Record<string, any> = {};
      data?.forEach(item => {
        if (item.custom_fields) {
          values[(item.custom_fields as any).name] = item.value;
        }
      });

      setCustomValues(values);
    } catch (error) {
      console.error('Error fetching custom values:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomValues();
  }, [userId]);

  const saveCustomValue = async (fieldId: string, fieldName: string, value: any) => {
    try {
      const { error } = await supabase
        .from('custom_field_values')
        .upsert({
          user_id: userId,
          field_id: fieldId,
          value: value || null
        }, {
          onConflict: 'user_id,field_id'
        });

      if (error) throw error;

      setCustomValues(prev => ({ ...prev, [fieldName]: value }));
    } catch (error: any) {
      console.error('Error saving custom value:', error);
      toast({
        title: "Fehler",
        description: "Wert konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const saveAllCustomValues = async (fields: CustomField[], values: Record<string, any>) => {
    try {
      const updates = fields.map(field => ({
        user_id: userId,
        field_id: field.id,
        value: values[field.name] || null
      }));

      const { error } = await supabase
        .from('custom_field_values')
        .upsert(updates, {
          onConflict: 'user_id,field_id'
        });

      if (error) throw error;

      setCustomValues(values);
      
      toast({
        title: "Erfolg",
        description: "Alle Werte wurden gespeichert."
      });
    } catch (error: any) {
      console.error('Error saving all custom values:', error);
      toast({
        title: "Fehler",
        description: "Werte konnten nicht gespeichert werden.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    customValues,
    loading,
    saveCustomValue,
    saveAllCustomValues,
    refreshCustomValues: fetchCustomValues
  };
}
