import { FileMetadata } from "@/hooks/use-file-manager";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useFileManager } from "@/hooks/use-file-manager";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Eye,
  Download,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FileCardProps {
  file: FileMetadata;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  multiSelectActive: boolean;
}

/**
 * File Card Component
 * Adaptive design for mobile and desktop
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
  const { canEdit, canDelete } = useFilePermissions();
  const { deleteFile, downloadFile, getFilePreviewUrl } = useFileManager();
  
  const [canEditFile, setCanEditFile] = useState(false);
  const [canDeleteFile, setCanDeleteFile] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const [editPerm, deletePerm] = await Promise.all([
        canEdit(file.id),
        canDelete(file.id),
      ]);
      setCanEditFile(editPerm);
      setCanDeleteFile(deletePerm);
    };
    checkPermissions();
  }, [file.id, canEdit, canDelete]);

  useEffect(() => {
    let isMounted = true;
    
    const loadThumbnail = async () => {
      // Check if it's an image by file_type OR file extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const isImage = file.file_type === 'image' || 
                     imageExtensions.some(ext => file.filename.toLowerCase().endsWith(ext));
      
      if (!isImage) return;
      
      // Reset states
      setThumbnailLoading(true);
      setImageError(false);
      
      try {
        // Use the new getFilePreviewUrl method which handles both buckets
        const url = await getFilePreviewUrl(file);
        
        if (isMounted) {
          if (url) {
            setThumbnailUrl(url);
            setImageError(false);
          } else {
            setThumbnailUrl(null);
            setImageError(true);
          }
          setThumbnailLoading(false);
        }
      } catch (error) {
        console.error('Error loading thumbnail:', error);
        if (isMounted) {
          setThumbnailUrl(null);
          setImageError(true);
          setThumbnailLoading(false);
        }
      }
    };
    
    loadThumbnail();
    
    return () => {
      isMounted = false;
    };
  }, [file.id, file.storage_path, file.category]);

  const handleDelete = async () => {
    if (window.confirm(`"${file.filename}" wirklich löschen?`)) {
      await deleteFile(file.id);
    }
  };

  const handleDownload = () => {
    downloadFile(file.id);
  };

  // Long press for multi-select on mobile
  const handleTouchStart = () => {
    if (!isMobile) return;
    const timer = setTimeout(() => {
      onSelect();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // File type icon
  const FileIcon = file.file_type === 'image' ? ImageIcon :
                   file.file_type === 'pdf' ? FileText :
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

  // List View (Horizontal Layout)
  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
          isSelected && "ring-2 ring-primary bg-accent"
        )}
        onClick={() => multiSelectActive ? onSelect() : onView()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Checkbox (Multi-Select Mode) */}
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
          <p className="font-medium truncate text-sm">{file.filename}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{formatSize(file.file_size)}</span>
            <Badge variant="secondary" className={cn("text-xs h-5", getCategoryColor(file.category))}>
              {file.category}
            </Badge>
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
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
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
      onClick={() => multiSelectActive ? onSelect() : onView()}
    >
      {/* Checkbox (Top Left) */}
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
      <div className="aspect-video bg-muted flex items-center justify-center relative">
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

        {/* Hover Actions (Desktop Only) */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
            <Download className="h-4 w-4" />
          </Button>
          {canDeleteFile && (
            <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-medium truncate text-sm mb-1">{file.filename}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatSize(file.file_size)}</span>
          <span>{new Date(file.created_at).toLocaleDateString()}</span>
        </div>
        {file.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {file.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs h-5">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-5">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
