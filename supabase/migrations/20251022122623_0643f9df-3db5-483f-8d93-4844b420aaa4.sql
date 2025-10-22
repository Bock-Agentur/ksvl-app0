-- Erlaube öffentlichen Lesezugriff auf email und name für Login-Zwecke
CREATE POLICY "Public can view email and name for login"
ON public.profiles
FOR SELECT
USING (true);