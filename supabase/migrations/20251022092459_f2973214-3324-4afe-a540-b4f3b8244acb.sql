-- Enable realtime for slots table
ALTER TABLE public.slots REPLICA IDENTITY FULL;

-- Add slots table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.slots;