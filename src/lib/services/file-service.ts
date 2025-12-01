/**
 * File Service
 * 
 * Centralized service for all file-related CRUD operations.
 * Abstracts Supabase Storage and file_metadata table operations.
 * 
 * This service handles:
 * - File uploads (single and multiple)
 * - File deletion (with storage cleanup)
 * - Metadata updates
 * - URL generation (signed and public URLs)
 * - Preview URL generation with caching
 */

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// File metadata type
export interface FileMetadata {
  id: string;
  filename: string;
  storage_path: string;
  file_type: 'image' | 'pdf' | 'video' | 'other';
  mime_type: string;
  file_size: number;
  owner_id: string | null;
  linked_user_id: string | null;
  category: 'login_media' | 'user_document' | 'general' | 'shared';
  document_type: 'bfa' | 'insurance' | 'berth_contract' | 'member_photo' | null;
  tags: string[];
  description: string | null;
  is_public: boolean;
  allowed_roles: string[] | null;
  created_at: string;
  updated_at: string;
}

// Upload metadata schema for validation
export const uploadMetadataSchema = z.object({
  category: z.enum(['login_media', 'user_document', 'general', 'shared']),
  document_type: z.enum(['bfa', 'insurance', 'berth_contract', 'member_photo']).nullable().optional(),
  linked_user_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().optional(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

// Service error type
export class FileServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FileServiceError';
  }
}

/**
 * File Service Class
 * Pure business logic without UI dependencies
 */
class FileService {
  /**
   * Get current authenticated session
   */
  private async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new FileServiceError("Nicht angemeldet", "UNAUTHENTICATED");
    }
    return session;
  }

  /**
   * Determine storage bucket and path based on category and metadata
   */
  private determineBucket(
    category: string,
    storagePath?: string
  ): string {
    // If path already contains bucket name, extract it
    if (storagePath?.startsWith('login-media/')) {
      return 'login-media';
    }
    if (storagePath?.startsWith('documents/')) {
      return 'documents';
    }
    
    // Otherwise determine by category
    if (category === 'login_media') {
      return 'login-media';
    }
    
    return 'documents';
  }

  /**
   * Determine file type from MIME type
   */
  private determineFileType(mimeType: string): FileMetadata['file_type'] {
    if (mimeType.startsWith('image/') || mimeType === 'image/webp') {
      return 'image';
    }
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    return 'other';
  }

  /**
   * Generate storage path based on category and user
   */
  private generateStoragePath(
    file: File,
    userId: string,
    metadata: UploadMetadata
  ): { bucket: string; path: string } {
    let storagePath = '';
    let bucket = 'documents';
    
    if (metadata.category === 'login_media') {
      // Login media goes to login-media bucket with simple filename
      bucket = 'login-media';
      storagePath = `${file.name.replace(/\s/g, '-')}-${Date.now()}.${file.name.split('.').pop()}`;
    } else if (metadata.category === 'user_document' && metadata.linked_user_id) {
      storagePath = `user_documents/${metadata.linked_user_id}/${metadata.document_type || 'general'}/${file.name}`;
    } else {
      storagePath = `${userId}/general/${file.name}`;
    }
    
    return { bucket, path: storagePath };
  }

  /**
   * Upload a single file to storage and create metadata entry
   */
  async uploadFile(file: File, metadata: UploadMetadata): Promise<FileMetadata> {
    try {
      // Validate metadata
      const validatedMetadata = uploadMetadataSchema.parse(metadata);
      
      // Validate file size (20MB for images/videos, 10MB for PDFs)
      const maxSize = file.type.startsWith('image/') || file.type.startsWith('video/') 
        ? 20 * 1024 * 1024 
        : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        throw new FileServiceError(
          `Maximale Dateigröße: ${maxSize / (1024 * 1024)}MB`,
          "FILE_TOO_LARGE"
        );
      }

      // Get current user
      const session = await this.getSession();
      const userId = session.user.id;

      // Generate storage path
      const { bucket, path: storagePath } = this.generateStoragePath(file, userId, validatedMetadata);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Determine file type
      const fileType = this.determineFileType(file.type);

      // Create metadata entry
      const { data: metadataData, error: metadataError } = await supabase
        .from('file_metadata')
        .insert({
          filename: file.name,
          storage_path: uploadData.path,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          owner_id: userId,
          linked_user_id: validatedMetadata.linked_user_id || null,
          category: validatedMetadata.category,
          document_type: validatedMetadata.document_type || null,
          tags: validatedMetadata.tags || [],
          description: validatedMetadata.description || null,
          is_public: validatedMetadata.is_public || false,
        })
        .select()
        .single() as { data: FileMetadata | null; error: any };

      if (metadataError) {
        // Rollback storage upload
        await supabase.storage.from(bucket).remove([uploadData.path]);
        throw metadataError;
      }

      if (!metadataData) {
        throw new FileServiceError("Metadata creation failed", "METADATA_CREATION_FAILED");
      }

      return metadataData;
    } catch (error) {
      if (error instanceof FileServiceError) {
        throw error;
      }
      console.error('Error uploading file:', error);
      throw new FileServiceError("Datei konnte nicht hochgeladen werden", "UPLOAD_FAILED");
    }
  }

  /**
   * Upload multiple files sequentially
   */
  async uploadMultipleFiles(
    files: File[], 
    metadata: UploadMetadata
  ): Promise<FileMetadata[]> {
    const uploadedFiles: FileMetadata[] = [];
    const errors: Error[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, metadata);
        uploadedFiles.push(result);
      } catch (error) {
        errors.push(error as Error);
      }
    }
    
    if (errors.length > 0 && uploadedFiles.length === 0) {
      throw new FileServiceError(
        `Alle Uploads fehlgeschlagen: ${errors[0].message}`,
        "ALL_UPLOADS_FAILED"
      );
    }
    
    return uploadedFiles;
  }

  /**
   * Delete a file from storage and database
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file metadata to find storage path
      const { data: file, error: fetchError } = await supabase
        .from('file_metadata')
        .select('storage_path, category')
        .eq('id', fileId)
        .single();

      if (fetchError || !file) {
        throw new FileServiceError("Datei nicht gefunden", "FILE_NOT_FOUND");
      }

      // Determine bucket
      const bucket = this.determineBucket(file.category, file.storage_path);

      // Clean the path (remove bucket prefix if present)
      let cleanPath = file.storage_path;
      if (cleanPath.startsWith(`${bucket}/`)) {
        cleanPath = cleanPath.substring(bucket.length + 1);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([cleanPath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue to delete metadata even if storage deletion fails
      }

      // Delete metadata
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('id', fileId);

      if (metadataError) throw metadataError;
    } catch (error) {
      if (error instanceof FileServiceError) {
        throw error;
      }
      console.error('Error deleting file:', error);
      throw new FileServiceError("Datei konnte nicht gelöscht werden", "DELETE_FAILED");
    }
  }

  /**
   * Delete multiple files sequentially
   */
  async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    const errors: Error[] = [];
    
    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId);
      } catch (error) {
        errors.push(error as Error);
      }
    }
    
    if (errors.length > 0) {
      throw new FileServiceError(
        `${errors.length} Datei(en) konnten nicht gelöscht werden`,
        "PARTIAL_DELETE_FAILED"
      );
    }
  }

  /**
   * Update file metadata
   */
  async updateMetadata(
    fileId: string,
    updates: Partial<Pick<FileMetadata, 'description' | 'tags' | 'is_public' | 'allowed_roles'>>
  ): Promise<FileMetadata> {
    try {
      const { data, error } = await supabase
        .from('file_metadata')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single() as { data: FileMetadata | null; error: any };

      if (error) throw error;
      if (!data) throw new FileServiceError("Datei nicht gefunden", "FILE_NOT_FOUND");

      return data;
    } catch (error) {
      if (error instanceof FileServiceError) {
        throw error;
      }
      console.error('Error updating metadata:', error);
      throw new FileServiceError("Metadaten konnten nicht aktualisiert werden", "UPDATE_FAILED");
    }
  }

  /**
   * Get download URL for a file (signed or public)
   */
  async getFileUrl(storagePath: string, category?: string): Promise<string | null> {
    try {
      // Determine bucket
      const bucket = this.determineBucket(category || '', storagePath);
      
      // Clean the path
      let filePath = storagePath;
      if (filePath.startsWith(`${bucket}/`)) {
        filePath = filePath.substring(bucket.length + 1);
      }

      // For public bucket, use public URL
      if (bucket === 'login-media') {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }

      // For private buckets, create signed URL (valid for 1 hour)
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  /**
   * Get preview URL for a file with automatic bucket detection
   * Handles both public and private buckets with fallback logic
   */
  async getPreviewUrl(file: FileMetadata): Promise<string | null> {
    try {
      // Determine bucket from path or category
      let bucket = 'documents';
      let filePath = file.storage_path;
      
      // Check if path starts with bucket name
      if (filePath.startsWith('login-media/')) {
        bucket = 'login-media';
        filePath = filePath.substring('login-media/'.length);
      } else if (filePath.startsWith('documents/')) {
        bucket = 'documents';
        filePath = filePath.substring('documents/'.length);
      }
      // If no bucket prefix, determine by category and path structure
      else if (filePath.includes('/general/') || filePath.match(/^[0-9a-f-]{36}\//)) {
        // Documents bucket pattern (has user ID path structure)
        bucket = 'documents';
      } else if (file.category === 'login_media') {
        bucket = 'login-media';
      }
      
      let resultUrl: string | null = null;

      // Try to get URL from determined bucket
      if (bucket === 'login-media') {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        if (data?.publicUrl) {
          resultUrl = data.publicUrl;
        }
      } else {
        // For documents bucket, create signed URL
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600);

        if (error) {
          // Fallback to login-media bucket if category matches
          if (file.category === 'login_media') {
            const { data: fallbackData } = supabase.storage
              .from('login-media')
              .getPublicUrl(filePath);
            
            if (fallbackData?.publicUrl) {
              resultUrl = fallbackData.publicUrl;
            }
          }
        } else if (data?.signedUrl) {
          resultUrl = data.signedUrl;
        }
      }

      return resultUrl;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
