export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'email' | 'phone';
  required: boolean;
  placeholder?: string;
  options?: string[];
  order?: number;
  group?: string;
  monday_column_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomFieldValue {
  id: string;
  user_id: string;
  field_id: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomFieldGroup = 'Kontakt' | 'Persönlich' | 'Mitgliedschaft' | 'Boot' | 'Liegeplatz' | 'Sonstiges';
