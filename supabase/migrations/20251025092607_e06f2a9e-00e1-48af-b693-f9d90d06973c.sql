-- Insert AI Agent Info custom field
INSERT INTO custom_fields (
  name,
  label,
  type,
  required,
  placeholder,
  "group",
  "order"
) VALUES (
  'ai_agent_info',
  'Info für AI-Assistent',
  'textarea',
  false,
  'Zusätzliche Informationen, die der AI-Assistent über Sie wissen sollte (z.B. bevorzugte Kommunikationsweise, besondere Anforderungen)',
  'Sonstiges',
  999
);

-- Add ai_info_enabled column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_info_enabled BOOLEAN DEFAULT false;