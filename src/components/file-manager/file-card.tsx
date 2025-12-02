import { FileMetadata, useFilePermissions, useFileManager, useIsMobile, useRole } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Download,
  Edit,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Video,
  File,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/role-order";
import { useState, useEffect } from "react";
import { DeleteConfirmationDialog } from "./components/delete-confirmation-dialog";
import { logger } from "@/lib/logger";

interface FileCardProps {
  file: FileMetadata;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  multiSelectActive: boolean;
}

// Cache for signed URLs (1 hour TTL)
const signedUrlCache = new Map<string, { url: string; expires: number }>();

/**
 * File Card Component
 * Adaptive design for mobile and desktop
 * Uses signed URLs for private buckets
 */
export function FileCard({
  file,
  viewMode,
  isSelected,
  onSelect,
  onView,
  multiSelectActive,
}: FileCardProps) {
  const isMobile = useIsMobile();
  const { isAdmin } = useFilePermissions();
  const { currentUser } = useRole();
  const { deleteFile, downloadFile } = useFileManager();
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // ✅ Calculate permissions client-side using already-loaded data
  const userId = currentUser?.id;
  const canEditFile = isAdmin || file.owner_id === userId;
  const canDeleteFile = isAdmin || file.owner_id === userId;

  // ✅ Determine bucket from storage_path structure (priority over category)
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

  // ✅ Generate thumbnail URL with signed URLs for private buckets
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
      .createSignedUrl(cleanPath, 3600) // 1 hour
      .then(({ data, error }) => {
        if (error) {
          logger.error('FILE_CARD', 'Signed URL error', { error, bucket, cleanPath, storagePath: file.storage_path });
          setThumbnailUrl(null);
          setThumbnailLoading(false);
          return;
        }
        if (data?.signedUrl) {
          // Ensure URL is absolute
          let url = data.signedUrl;
          if (url.startsWith('/')) {
            url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${url}`;
          }
          setThumbnailUrl(url);
          signedUrlCache.set(cacheKey, { url, expires: Date.now() + 3500000 }); // Cache 58 min
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

  const handleDelete = async () => {
    await deleteFile(file.id);
    setDeleteDialogOpen(false);
  };

  const handleDownload = () => {
    downloadFile(file.id);
  };

  // File type icon
  const FileIcon = file.file_type === 'image' ? ImageIcon :
                   file.file_type === 'video' ? Video :
                   File;

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'login_media': return 'bg-blue-500/10 text-blue-500';
      case 'user_document': return 'bg-green-500/10 text-green-500';
      case 'shared': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  // Tooltip content for role access
  const getRoleTooltipContent = () => {
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
  };

  // ✅ Click handler: Always open detail view, multi-select only via checkbox
  const handleCardClick = () => {
    if (multiSelectActive) {
      // In multi-select mode, clicking card still opens detail
      // Use checkbox for selection
      onView();
    } else {
      onView();
    }
  };

  // List View (Horizontal Layout)
  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
          isSelected && "ring-2 ring-primary bg-accent"
        )}
        onClick={handleCardClick}
      >
        {/* Checkbox (Multi-Select Mode) - Click only selects */}
        {multiSelectActive && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Thumbnail/Icon */}
        <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
          {thumbnailLoading ? (
            <div className="h-full w-full animate-pulse bg-muted-foreground/20" />
          ) : thumbnailUrl && !imageError ? (
            <img 
              src={thumbnailUrl} 
              alt={file.filename} 
              className="h-full w-full object-cover" 
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="font-medium truncate text-sm flex-1">{file.filename}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{formatSize(file.file_size)}</span>
            <Badge variant="secondary" className={cn("text-xs h-5", getCategoryColor(file.category))}>
              {file.category}
            </Badge>
            {((file.allowed_roles && file.allowed_roles.length > 0) || file.is_public) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs h-5 gap-1 cursor-help">
                      <Shield className="h-3 w-3" />
                      {file.is_public ? 'Öffentlich' : file.allowed_roles?.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{getRoleTooltipContent()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {file.tags.length > 0 && (
              <span className="text-xs text-muted-foreground">{file.tags.length} Tags</span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {!multiSelectActive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Ansehen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </DropdownMenuItem>
              {canEditFile && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
              )}
              {canDeleteFile && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Desktop Grid View (Vertical Layout)
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={handleCardClick}
    >
      {/* Checkbox (Top Left) - Click only selects */}
      {multiSelectActive && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="bg-background"
          />
        </div>
      )}

      {/* Category Badge (Top Right) */}
      <Badge 
        variant="secondary" 
        className={cn("absolute top-2 right-2 z-10 text-xs", getCategoryColor(file.category))}
      >
        {file.category}
      </Badge>

      {/* Thumbnail */}
      <div className="aspect-video bg-muted flex items-center justify-center">
        {thumbnailLoading ? (
          <div className="h-full w-full animate-pulse bg-muted-foreground/20" />
        ) : thumbnailUrl && !imageError ? (
          <img 
            src={thumbnailUrl} 
            alt={file.filename} 
            className="h-full w-full object-cover" 
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <FileIcon className="h-12 w-12 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-medium truncate text-sm mb-1">{file.filename}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{formatSize(file.file_size)}</span>
          <span>{new Date(file.created_at).toLocaleDateString()}</span>
        </div>
        
        {/* Badges */}
        <div className="flex gap-1 flex-wrap mb-3">
          {((file.allowed_roles && file.allowed_roles.length > 0) || file.is_public) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs h-5 gap-1 cursor-help">
                    <Shield className="h-3 w-3" />
                    {file.is_public ? 'Öffentlich' : file.allowed_roles?.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{getRoleTooltipContent()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {file.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs h-5">
              {tag}
            </Badge>
          ))}
          {file.tags.length > 2 && (
            <Badge variant="outline" className="text-xs h-5">
              +{file.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        {!multiSelectActive && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" className="flex-1 h-8" onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="h-4 w-4 mr-1" />
              Ansehen
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
              <Download className="h-4 w-4" />
            </Button>
            {canDeleteFile && (
              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        description={`"${file.filename}" wirklich löschen?`}
      />
    </div>
  );
}
