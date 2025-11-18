-- Phase 1: Rollenbasierte Zugriffskontrolle für File Manager

-- 1. Neue Spalte in file_metadata für Rollen-Zugriffe
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT NULL;

COMMENT ON COLUMN file_metadata.allowed_roles IS 'Array von Rollen (admin, vorstand, kranfuehrer, mitglied, gastmitglied) die Zugriff auf diese Datei haben';

-- 2. Lösche alte Policy und erstelle neue mit Rollen-Support
DROP POLICY IF EXISTS "Users can view role-allowed files" ON file_metadata;

CREATE POLICY "Users can view role-allowed files"
ON file_metadata FOR SELECT
TO authenticated
USING (
  -- Admins sehen alles
  is_admin(auth.uid()) 
  OR 
  -- Eigene Dateien
  owner_id = auth.uid() 
  OR 
  -- Verknüpfte Dateien
  linked_user_id = auth.uid() 
  OR 
  -- Öffentliche Dateien
  is_public = true
  OR
  -- NEUE LOGIK: Dateien für eigene Rollen
  (
    allowed_roles IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role::text = ANY(allowed_roles)
    )
  )
);

-- 3. Funktion für Storage-Zugriffsprüfung (im PUBLIC Schema!)
CREATE OR REPLACE FUNCTION public.can_access_file(storage_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  file_record RECORD;
  user_has_role BOOLEAN;
  current_user_id UUID;
BEGIN
  -- Auth-Check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Hole file_metadata basierend auf storage_path
  SELECT * INTO file_record 
  FROM file_metadata 
  WHERE file_metadata.storage_path = can_access_file.storage_path;
  
  IF NOT FOUND THEN
    -- Datei nicht in Metadaten -> kein Zugriff
    RETURN FALSE;
  END IF;
  
  -- Admin-Check
  IF is_admin(current_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Owner-Check
  IF file_record.owner_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Linked-User-Check
  IF file_record.linked_user_id = current_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Public-Check
  IF file_record.is_public THEN
    RETURN TRUE;
  END IF;
  
  -- Rollen-Check
  IF file_record.allowed_roles IS NOT NULL AND array_length(file_record.allowed_roles, 1) > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = current_user_id
      AND role::text = ANY(file_record.allowed_roles)
    ) INTO user_has_role;
    
    IF user_has_role THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 4. Storage Policies für 'documents' Bucket mit Rollen-Check
-- Lösche alte Policies
DROP POLICY IF EXISTS "Users can view linked files" ON storage.objects;
DROP POLICY IF EXISTS "Role-based access to documents" ON storage.objects;

-- Neue SELECT Policy mit Funktion
CREATE POLICY "Role-based file access for documents bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.can_access_file(name)
);

-- UPDATE/DELETE Policies bleiben restriktiv (nur Owner oder Admin)
DROP POLICY IF EXISTS "Users can update own files in documents" ON storage.objects;
CREATE POLICY "Users can update own files in documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM file_metadata
      WHERE storage_path = name
      AND owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete own files in documents" ON storage.objects;
CREATE POLICY "Users can delete own files in documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM file_metadata
      WHERE storage_path = name
      AND owner_id = auth.uid()
    )
  )
);

-- 5. Ähnliche Policies für 'member-documents' Bucket
DROP POLICY IF EXISTS "Role-based file access for member-documents bucket" ON storage.objects;
CREATE POLICY "Role-based file access for member-documents bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents' 
  AND public.can_access_file(name)
);

DROP POLICY IF EXISTS "Users can update own files in member-documents" ON storage.objects;
CREATE POLICY "Users can update own files in member-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'member-documents' 
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM file_metadata
      WHERE storage_path = name
      AND owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete own files in member-documents" ON storage.objects;
CREATE POLICY "Users can delete own files in member-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'member-documents' 
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM file_metadata
      WHERE storage_path = name
      AND owner_id = auth.uid()
    )
  )
);