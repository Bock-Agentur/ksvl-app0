import { useState, useEffect } from "react";
import { FileMetadata } from "../types/file-manager.types";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Video, File as FileIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FilePreviewProps {
  file: File | FileMetadata;
  size?: 'small' | 'medium' | 'large';
  showFileName?: boolean;
  onError?: () => void;
  className?: string;
}

// Cache for signed URLs (1 hour TTL)
const previewUrlCache = new Map<string, { url: string; expires: number }>();

/**
 * Reusable File Preview Component
 * Displays thumbnails for images or fallback icons for other file types
 * Uses signed URLs for private buckets
 */
export function FilePreview({
  file,
  size = 'medium',
  showFileName = false,
  onError,
  className,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Check if it's a File object or FileMetadata
  const isFileObject = file instanceof File;
  
  // Get file type and check for HEIC
  const getFileType = (): 'image' | 'video' => {
    if (isFileObject) {
      const f = file as File;
      if (f.type.startsWith('image/')) return 'image';
      if (f.type.startsWith('video/')) return 'video';
      return 'image'; // Default to image for this image-only manager
    }
    return (file as FileMetadata).file_type;
  };

  const fileType = getFileType();
  const filename = isFileObject ? (file as File).name : (file as FileMetadata).filename;
  const mimeType = isFileObject ? (file as File).type : (file as FileMetadata).mime_type;
  const isHEIC = mimeType === 'image/heic' || mimeType === 'image/heif' || filename.toLowerCase().endsWith('.heic') || filename.toLowerCase().endsWith('.heif');

  // Determine bucket from storage_path structure (priority over category)
  const determineBucket = (storagePath: string, category: string): string => {
    // Explicit login-media prefix
    if (storagePath.startsWith('login-media/')) return 'login-media';
    // UUID path structure = documents bucket (e.g., "5a7f5773-0c9c-4336-b06b-f2aaaa327764/general/...")
    if (storagePath.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i)) {
      return 'documents';
    }
    // Fallback to category
    if (category === 'login_media') return 'login-media';
    return 'documents';
  };

  useEffect(() => {
    let isMounted = true;

    const loadPreview = async () => {
      if (isFileObject) {
        const f = file as File;
        if (f.type.startsWith('image/')) {
          // For File objects, create object URL
          setLoading(true);
          const url = URL.createObjectURL(f);
          if (isMounted) {
            setPreviewUrl(url);
            setLoading(false);
          }
          return () => URL.revokeObjectURL(url);
        }
      } else if (!isFileObject && fileType === 'image') {
        const fileMetadata = file as FileMetadata;
        const bucket = determineBucket(fileMetadata.storage_path, fileMetadata.category);
        
        // Clean path
        let cleanPath = fileMetadata.storage_path;
        if (cleanPath.startsWith(`${bucket}/`)) {
          cleanPath = cleanPath.substring(bucket.length + 1);
        } else if (cleanPath.startsWith('login-media/')) {
          cleanPath = cleanPath.substring('login-media/'.length);
        }

        // Check cache first
        const cacheKey = `${bucket}/${cleanPath}`;
        const cached = previewUrlCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          if (isMounted) {
            setPreviewUrl(cached.url);
            setLoading(false);
          }
          return;
        }

        setLoading(true);

        try {
          let url: string | null = null;

          // For public bucket (login-media), use getPublicUrl
          if (bucket === 'login-media') {
            const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
            if (data?.publicUrl) {
              url = data.publicUrl;
            }
          } else {
            // For private buckets (documents), use createSignedUrl
            const { data, error: signError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(cleanPath, 3600); // 1 hour

            if (data?.signedUrl) {
              url = data.signedUrl;
              // Ensure URL is absolute
              if (url.startsWith('/')) {
                url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${url}`;
              }
            }
          }

          if (isMounted) {
            if (url) {
              setPreviewUrl(url);
              previewUrlCache.set(cacheKey, { url, expires: Date.now() + 3500000 }); // Cache 58 min
            } else {
              setError(true);
              onError?.();
            }
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError(true);
            setLoading(false);
            onError?.();
          }
        }
      }
    };

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [file, isFileObject, fileType]);

  const handleImageError = () => {
    setError(true);
    onError?.();
  };

  // Size classes
  const sizeClasses = {
    small: 'h-14 w-14',
    medium: 'h-24 w-24',
    large: 'h-48 w-48',
  };

  const iconSizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-24 w-24',
  };

  // File icon
  const IconComponent = fileType === 'image' ? ImageIcon :
                        fileType === 'video' ? Video :
                        FileIcon;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* HEIC Warning */}
      {isHEIC && size !== 'small' && (
        <Alert variant="default" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            HEIC-Bilder werden im Browser nicht unterstützt. Bitte in JPG/PNG konvertieren.
          </AlertDescription>
        </Alert>
      )}
      
      <div className={cn(
        "rounded-md overflow-hidden bg-muted flex items-center justify-center",
        sizeClasses[size]
      )}>
        {loading ? (
          <div className="h-full w-full animate-pulse bg-muted-foreground/20" />
        ) : previewUrl && !error && fileType === 'image' && !isHEIC ? (
          <img 
            src={previewUrl} 
            alt={filename} 
            className="h-full w-full object-cover" 
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <IconComponent className={cn("text-muted-foreground", iconSizeClasses[size])} />
        )}
      </div>
      
      {showFileName && (
        <p className={cn(
          "mt-2 text-center truncate max-w-full",
          size === 'small' ? 'text-xs' : 'text-sm'
        )}>
          {filename}
        </p>
      )}
    </div>
  );
}
