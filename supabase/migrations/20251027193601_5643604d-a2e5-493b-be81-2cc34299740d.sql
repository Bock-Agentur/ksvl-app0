-- Phase 1: File Manager Database & Storage Setup

-- 1. Create file_metadata table
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'video', 'other')),
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('login_media', 'user_document', 'general', 'shared')),
  document_type TEXT CHECK (document_type IN ('bfa', 'insurance', 'berth_contract', 'member_photo') OR document_type IS NULL),
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_metadata_owner ON public.file_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_linked_user ON public.file_metadata(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_category ON public.file_metadata(category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_type ON public.file_metadata(file_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON public.file_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_tags ON public.file_metadata USING GIN(tags);

-- 3. Create trigger for updated_at
CREATE TRIGGER update_file_metadata_updated_at
  BEFORE UPDATE ON public.file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable RLS on file_metadata
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for file_metadata

-- Admins can view all files
CREATE POLICY "Admins can view all files"
  ON public.file_metadata
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admins can manage all files (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert files"
  ON public.file_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update files"
  ON public.file_metadata
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete files"
  ON public.file_metadata
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Users can view their own files
CREATE POLICY "Users can view own files"
  ON public.file_metadata
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Users can view files linked to them
CREATE POLICY "Users can view linked files"
  ON public.file_metadata
  FOR SELECT
  TO authenticated
  USING (linked_user_id = auth.uid());

-- Users can view public files
CREATE POLICY "Anyone can view public files"
  ON public.file_metadata
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Users can upload their own files
CREATE POLICY "Users can upload own files"
  ON public.file_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (linked_user_id IS NULL OR linked_user_id = auth.uid()));

-- Users can update their own files
CREATE POLICY "Users can update own files"
  ON public.file_metadata
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON public.file_metadata
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- 6. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS Policies for documents bucket

-- Admins have full access to all files
CREATE POLICY "Admins full access to documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'documents' AND
    public.is_admin(auth.uid())
  );

-- Users can upload to their own folder
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own files
CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view files in user_documents folder with their ID
CREATE POLICY "Users can view linked documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'user_documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can update their own files
CREATE POLICY "Users can update own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Comment for documentation
COMMENT ON TABLE public.file_metadata IS 'Central file management table with metadata for all uploaded files. Supports mobile-optimized queries with proper indexing.';