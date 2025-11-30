import { useState, useCallback, useMemo } from "react";
import { ValidationResult } from "@/types";
import { logger } from "@/lib/logger";

export interface FieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
  required?: boolean;
  validation?: (value: any) => string | null;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FormConfig<T> {
  fields: FieldConfig<T>[];
  initialValues?: Partial<T>;
  onSubmit: (data: T) => Promise<boolean> | boolean;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

export interface FormState<T> {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface FormActions<T> {
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string | null) => void;
  clearErrors: () => void;
  reset: () => void;
  submit: () => Promise<boolean>;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
}

/**
 * Wiederverwendbarer Hook für Formularbehandlung
 * Verwaltet Formularstatus, Validierung und Submit-Logik
 */
export function useFormHandler<T extends Record<string, any>>(
  config: FormConfig<T>
): FormState<T> & FormActions<T> {
  const { fields, initialValues = {}, onSubmit } = config;

  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Einzelnes Feld validieren
  const validateField = useCallback((field: keyof T): boolean => {
    const fieldConfig = fields.find(f => f.name === field);
    if (!fieldConfig) return true;

    const value = values[field];

    // Required validation
    if (fieldConfig.required && (!value || (typeof value === 'string' && !value.trim()))) {
      setErrors(prev => ({
        ...prev,
        [field]: `${fieldConfig.label} ist erforderlich`
      }));
      return false;
    }

    // Type-specific validation
    if (value) {
      switch (fieldConfig.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            setErrors(prev => ({
              ...prev,
              [field]: 'Ungültige E-Mail-Adresse'
            }));
            return false;
          }
          break;

        case 'phone':
          const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
          if (!phoneRegex.test(String(value))) {
            setErrors(prev => ({
              ...prev,
              [field]: 'Ungültige Telefonnummer'
            }));
            return false;
          }
          break;

        case 'number':
          if (isNaN(Number(value))) {
            setErrors(prev => ({
              ...prev,
              [field]: 'Muss eine Zahl sein'
            }));
            return false;
          }
          if (fieldConfig.min !== undefined && Number(value) < fieldConfig.min) {
            setErrors(prev => ({
              ...prev,
              [field]: `Minimum: ${fieldConfig.min}`
            }));
            return false;
          }
          if (fieldConfig.max !== undefined && Number(value) > fieldConfig.max) {
            setErrors(prev => ({
              ...prev,
              [field]: `Maximum: ${fieldConfig.max}`
            }));
            return false;
          }
          break;
      }
    }

    // Custom validation
    if (fieldConfig.validation) {
      const error = fieldConfig.validation(value);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [field]: error
        }));
        return false;
      }
    }

    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    return true;
  }, [fields, values]);

  // Alle Felder validieren
  const validateAll = useCallback((): boolean => {
    let isFormValid = true;
    
    fields.forEach(field => {
      const isFieldValid = validateField(field.name);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }, [fields, validateField]);

  // Ist das Formular gültig?
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           fields.filter(f => f.required).every(f => values[f.name]);
  }, [errors, fields, values]);

  // Feld-Wert setzen
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Validierung nach einer kurzen Verzögerung
    setTimeout(() => validateField(field), 100);
  }, [validateField]);

  // Mehrere Werte setzen
  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
    setIsDirty(true);
  }, []);

  // Fehler setzen
  const setError = useCallback((field: keyof T, error: string | null) => {
    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  // Alle Fehler löschen
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Formular zurücksetzen
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  // Formular absenden
  const submit = useCallback(async (): Promise<boolean> => {
    if (!validateAll()) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const success = await onSubmit(values as T);
      
      if (success) {
        setIsDirty(false);
        // Optional: Formular nach erfolgreichem Submit zurücksetzen
        // reset();
      }
      
      return success;
    } catch (error) {
      logger.error('FORM', 'Form submission error', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, onSubmit, values]);

  return {
    // State
    values,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    
    // Actions
    setValue,
    setValues: setFormValues,
    setError,
    clearErrors,
    reset,
    submit,
    validateField,
    validateAll
  };
}

// Utility Hook für häufige Feldkonfigurationen
export function useCommonFieldConfigs() {
  const nameField = {
    name: 'name' as const,
    label: 'Name',
    type: 'text' as const,
    required: true,
    validation: (value: string) => {
      if (value && value.length < 2) {
        return 'Name muss mindestens 2 Zeichen lang sein';
      }
      return null;
    }
  };

  const emailField = {
    name: 'email' as const,
    label: 'E-Mail',
    type: 'email' as const,
    required: true
  };

  const phoneField = {
    name: 'phone' as const,
    label: 'Telefon',
    type: 'phone' as const,
    placeholder: '+43 664 123 4567'
  };

  const memberNumberField = {
    name: 'memberNumber' as const,
    label: 'Mitgliedsnummer',
    type: 'text' as const,
    required: true,
    validation: (value: string) => {
      if (value && !/^KSVL\d{3}$/.test(value)) {
        return 'Format: KSVL001';
      }
      return null;
    }
  };

  const roleField = {
    name: 'role' as const,
    label: 'Rolle',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'mitglied', label: 'Mitglied' },
      { value: 'kranfuehrer', label: 'Kranführer' },
      { value: 'admin', label: 'Admin' }
    ]
  };

  return {
    nameField,
    emailField,
    phoneField,
    memberNumberField,
    roleField
  };
}