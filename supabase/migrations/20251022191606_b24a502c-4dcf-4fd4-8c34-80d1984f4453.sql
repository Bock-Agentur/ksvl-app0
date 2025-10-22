-- Create login-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('login-media', 'login-media', true);

-- RLS Policies for login-media bucket
CREATE POLICY "Anyone can view login media"
ON storage.objects FOR SELECT
USING (bucket_id = 'login-media');

CREATE POLICY "Admins can upload login media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'login-media' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can update login media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'login-media' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can delete login media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'login-media' 
  AND is_admin(auth.uid())
);