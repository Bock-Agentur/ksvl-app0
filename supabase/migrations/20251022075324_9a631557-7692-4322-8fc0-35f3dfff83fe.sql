-- Add policy to allow members to update/cancel their own booked slots
CREATE POLICY "Members can update their own booked slots"
ON public.slots
FOR UPDATE
TO authenticated
USING (is_booked = true AND member_id = auth.uid())
WITH CHECK (member_id = auth.uid());