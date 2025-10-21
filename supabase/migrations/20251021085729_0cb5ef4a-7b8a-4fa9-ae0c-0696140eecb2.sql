-- Create slots table for storing all slot and booking data
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (15, 30, 45, 60)),
  crane_operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_booked BOOLEAN DEFAULT false,
  notes TEXT,
  is_mini_slot BOOLEAN DEFAULT false,
  mini_slot_count INTEGER CHECK (mini_slot_count >= 1 AND mini_slot_count <= 4),
  start_minute INTEGER CHECK (start_minute IN (0, 15, 30, 45)),
  block_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_slots_date ON public.slots(date);
CREATE INDEX idx_slots_crane_operator ON public.slots(crane_operator_id);
CREATE INDEX idx_slots_member ON public.slots(member_id);
CREATE INDEX idx_slots_is_booked ON public.slots(is_booked);
CREATE INDEX idx_slots_block_id ON public.slots(block_id);

-- Enable RLS
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can view slots
CREATE POLICY "Everyone can view slots"
ON public.slots
FOR SELECT
USING (true);

-- Only crane operators and admins can create slots
CREATE POLICY "Crane operators and admins can create slots"
ON public.slots
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'kranfuehrer')
);

-- Only crane operators (of that slot) and admins can update slots
CREATE POLICY "Crane operators and admins can update slots"
ON public.slots
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  (public.has_role(auth.uid(), 'kranfuehrer') AND crane_operator_id = auth.uid())
);

-- Only admins can delete slots
CREATE POLICY "Admins can delete slots"
ON public.slots
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Members can book available slots (update member_id and is_booked)
CREATE POLICY "Members can book slots"
ON public.slots
FOR UPDATE
USING (
  NOT is_booked AND 
  auth.uid() IS NOT NULL
)
WITH CHECK (
  member_id = auth.uid() AND 
  is_booked = true
);

-- Trigger for updated_at
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();