import { FileMetadata } from "@/hooks/use-file-manager";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useFileManager } from "@/hooks/use-file-manager";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/hooks/use-role";
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
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/role-order";
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
  const { isAdmin } = useFilePermissions();
  const { currentUser } = useRole();
  const { deleteFile, downloadFile } = useFileManager();
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // ✅ Calculate permissions client-side using already-loaded data
  const userId = currentUser?.id;
  const canEditFile = isAdmin || file.owner_id === userId;
  const canDeleteFile = isAdmin || file.owner_id === userId;

  // ✅ Generate thumbnail URL directly (no async request needed)
  useEffect(() => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const isImage = file.file_type === 'image' || 
                   imageExtensions.some(ext => file.filename.toLowerCase().endsWith(ext));
    
    if (!isImage) {
      setThumbnailUrl(null);
      return;
    }
    
    // Determine bucket from storage_path
    const bucket = file.storage_path.startsWith('login-media/') 
      ? 'login-media' 
      : 'documents';
    
    const cleanPath = bucket === 'login-media' 
      ? file.storage_path.replace('login-media/', '')
      : file.storage_path;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(cleanPath);
    
    setThumbnailUrl(data.publicUrl);
    setThumbnailLoading(false);
  }, [file.storage_path, file.file_type, file.filename]);

  const handleDelete = async () => {
    if (window.confirm(`"${file.filename}" wirklich löschen?`)) {
      await deleteFile(file.id);
    }
  };

  const handleDownload = () => {
    downloadFile(file.id);
  };

  // Long-press removed - multi-select now via explicit toggle button

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

  // List View (Horizontal Layout)
  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
          isSelected && "ring-2 ring-primary bg-accent"
        )}
        onClick={(e) => {
          if (multiSelectActive) {
            onSelect();
          } else {
            onView();
          }
        }}
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
      onClick={(e) => {
        if (multiSelectActive) {
          onSelect();
        } else {
          onView();
        }
      }}
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
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{formatSize(file.file_size)}</span>
          <span>{new Date(file.created_at).toLocaleDateString()}</span>
        </div>
        
        {/* Badges */}
        <div className="flex gap-1 flex-wrap">
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
      </div>
    </div>
  );
}
