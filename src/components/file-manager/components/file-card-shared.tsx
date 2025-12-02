/**
 * Shared File Card Logic
 * 
 * Contains all shared utilities, hooks, and types for FileCard variants.
 * Extracted for better code organization and reusability.
 */

import { useState, useEffect } from "react";
import { FileMetadata, useFilePermissions, useFileManager, useRole } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { ROLE_LABELS } from "@/lib/role-order";
import { Image as ImageIcon, Video, File } from "lucide-react";

// Cache for signed URLs (1 hour TTL)
const signedUrlCache = new Map<string, { url: string; expires: number }>();

export interface FileCardBaseProps {
  file: FileMetadata;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  multiSelectActive: boolean;
}

export interface UseFileCardThumbnailResult {
  thumbnailUrl: string | null;
  thumbnailLoading: boolean;
  imageError: boolean;
  setImageError: (error: boolean) => void;
}

/**
 * Determine bucket from storage_path structure
 */
export function determineBucket(storagePath: string, category: string): string {
  // Explicit login-media prefix
  if (storagePath.startsWith('login-media/')) return 'login-media';
  // UUID path structure = documents bucket
  if (storagePath.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i)) {
    return 'documents';
  }
  // Fallback to category
  if (category === 'login_media') return 'login-media';
  return 'documents';
}

/**
 * Hook for managing file thumbnail URL
 */
export function useFileCardThumbnail(file: FileMetadata): UseFileCardThumbnailResult {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const isImage = file.file_type === 'image' || 
                   imageExtensions.some(ext => file.filename.toLowerCase().endsWith(ext));
    
    if (!isImage) {
      setThumbnailUrl(null);
      return;
    }

    const bucket = determineBucket(file.storage_path, file.category);
    
    // Clean path - remove bucket prefix if present
    let cleanPath = file.storage_path;
    if (cleanPath.startsWith(`${bucket}/`)) {
      cleanPath = cleanPath.substring(bucket.length + 1);
    } else if (cleanPath.startsWith('login-media/')) {
      cleanPath = cleanPath.substring('login-media/'.length);
    }

    // Check cache first
    const cacheKey = `${bucket}/${cleanPath}`;
    const cached = signedUrlCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      setThumbnailUrl(cached.url);
      setThumbnailLoading(false);
      return;
    }

    // For public bucket (login-media), use getPublicUrl
    if (bucket === 'login-media') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
      if (data?.publicUrl) {
        setThumbnailUrl(data.publicUrl);
        signedUrlCache.set(cacheKey, { url: data.publicUrl, expires: Date.now() + 3600000 });
      }
      setThumbnailLoading(false);
      return;
    }

    // For private buckets (documents), use createSignedUrl
    setThumbnailLoading(true);
    supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 3600)
      .then(({ data, error }) => {
        if (error) {
          logger.error('FILE_CARD', 'Signed URL error', { error, bucket, cleanPath });
          setThumbnailUrl(null);
          setThumbnailLoading(false);
          return;
        }
        if (data?.signedUrl) {
          let url = data.signedUrl;
          if (url.startsWith('/')) {
            url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${url}`;
          }
          setThumbnailUrl(url);
          signedUrlCache.set(cacheKey, { url, expires: Date.now() + 3500000 });
        } else {
          setThumbnailUrl(null);
        }
        setThumbnailLoading(false);
      })
      .catch((err) => {
        logger.error('FILE_CARD', 'createSignedUrl catch', err);
        setThumbnailUrl(null);
        setThumbnailLoading(false);
      });
  }, [file.storage_path, file.file_type, file.filename, file.category]);

  return { thumbnailUrl, thumbnailLoading, imageError, setImageError };
}

/**
 * Hook for file card permissions
 */
export function useFileCardPermissions(file: FileMetadata) {
  const { isAdmin } = useFilePermissions();
  const { currentUser } = useRole();
  const { deleteFile, downloadFile } = useFileManager();
  
  const userId = currentUser?.id;
  const canEditFile = isAdmin || file.owner_id === userId;
  const canDeleteFile = isAdmin || file.owner_id === userId;

  return {
    isAdmin,
    canEditFile,
    canDeleteFile,
    deleteFile,
    downloadFile,
  };
}

/**
 * Get file type icon component
 */
export function getFileIcon(fileType: string) {
  if (fileType === 'image') return ImageIcon;
  if (fileType === 'video') return Video;
  return File;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Get category badge color class
 */
export function getCategoryColor(category: string): string {
  switch (category) {
    case 'login_media': return 'bg-blue-500/10 text-blue-500';
    case 'user_document': return 'bg-green-500/10 text-green-500';
    case 'shared': return 'bg-purple-500/10 text-purple-500';
    default: return 'bg-gray-500/10 text-gray-500';
  }
}

/**
 * Get tooltip content for role access
 */
export function getRoleTooltipContent(file: FileMetadata): string {
  if (file.is_public) {
    return "Öffentlich - Für alle sichtbar";
  }
  if (file.allowed_roles && file.allowed_roles.length > 0) {
    const roleNames = file.allowed_roles
      .map(role => ROLE_LABELS[role] || role)
      .join(', ');
    return `Zugriff für: ${roleNames}`;
  }
  return "Privat - Nur für Besitzer";
}
