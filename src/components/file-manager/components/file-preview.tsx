import { useState, useEffect } from "react";
import { FileMetadata } from "../types/file-manager.types";
import { useFileManager } from "@/hooks/use-file-manager";
import { FileText, Image as ImageIcon, Video, File as FileIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FilePreviewProps {
  file: File | FileMetadata;
  size?: 'small' | 'medium' | 'large';
  showFileName?: boolean;
  onError?: () => void;
  className?: string;
}

/**
 * Reusable File Preview Component
 * Displays thumbnails for images or fallback icons for other file types
 */
export function FilePreview({
  file,
  size = 'medium',
  showFileName = false,
  onError,
  className,
}: FilePreviewProps) {
  const { getFilePreviewUrl } = useFileManager();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Check if it's a File object or FileMetadata
  const isFileObject = file instanceof File;
  
  // Get file type and check for HEIC
  const getFileType = (): 'image' | 'pdf' | 'video' | 'other' => {
    if (isFileObject) {
      const f = file as File;
      if (f.type.startsWith('image/')) return 'image';
      if (f.type === 'application/pdf') return 'pdf';
      if (f.type.startsWith('video/')) return 'video';
      return 'other';
    }
    return (file as FileMetadata).file_type;
  };

  const fileType = getFileType();
  const filename = isFileObject ? (file as File).name : (file as FileMetadata).filename;
  const mimeType = isFileObject ? (file as File).type : (file as FileMetadata).mime_type;
  const isHEIC = mimeType === 'image/heic' || mimeType === 'image/heif' || filename.toLowerCase().endsWith('.heic') || filename.toLowerCase().endsWith('.heif');

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
        // For FileMetadata, use getFilePreviewUrl
        setLoading(true);
        try {
          const url = await getFilePreviewUrl(file as FileMetadata);
          if (isMounted) {
            setPreviewUrl(url);
            setError(!url);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error loading preview:', err);
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
                        fileType === 'pdf' ? FileText :
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
