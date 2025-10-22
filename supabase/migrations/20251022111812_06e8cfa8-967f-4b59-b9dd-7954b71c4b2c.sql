-- Ensure slots table has REPLICA IDENTITY FULL for complete realtime updates
ALTER TABLE public.slots REPLICA IDENTITY FULL;

-- Ensure slots table is in the realtime publication
-- First check if it's already there, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slots;
  END IF;
END $$;