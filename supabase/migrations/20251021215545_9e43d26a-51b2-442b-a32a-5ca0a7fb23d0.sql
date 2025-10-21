-- Add new fields for extended user profile information
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS dinghy_berth_number TEXT,
  ADD COLUMN IF NOT EXISTS boat_type TEXT,
  ADD COLUMN IF NOT EXISTS boat_length NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS boat_width NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS parking_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS parking_permit_issue_date DATE,
  ADD COLUMN IF NOT EXISTS beverage_chip_number TEXT,
  ADD COLUMN IF NOT EXISTS beverage_chip_issue_date DATE,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;