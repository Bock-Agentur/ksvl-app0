-- Drop existing INSERT policy for slots
DROP POLICY IF EXISTS "Crane operators and admins can create slots" ON public.slots;

-- Create new INSERT policy that includes vorstand
CREATE POLICY "Crane operators, vorstand and admins can create slots"
ON public.slots
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'kranfuehrer') OR
  public.has_role(auth.uid(), 'vorstand')
);