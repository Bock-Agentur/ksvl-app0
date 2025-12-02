/**
 * File Card Grid View
 * 
 * Vertical layout for grid view mode.
 */

import { useState } from "react";
import { FileMetadata } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Download, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import {
  FileCardBaseProps,
  useFileCardThumbnail,
  useFileCardPermissions,
  getFileIcon,
  formatFileSize,
  getCategoryColor,
  getRoleTooltipContent,
} from "./file-card-shared";

interface FileCardGridProps extends FileCardBaseProps {}

export function FileCardGrid({
  file,
  isSelected,
  onSelect,
  onView,
  multiSelectActive,
}: FileCardGridProps) {
  const { thumbnailUrl, thumbnailLoading, imageError, setImageError } = useFileCardThumbnail(file);
  const { canDeleteFile, deleteFile, downloadFile } = useFileCardPermissions(file);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const FileIcon = getFileIcon(file.file_type);

  const handleDelete = async () => {
    await deleteFile(file.id);
    setDeleteDialogOpen(false);
  };

  const handleDownload = () => {
    downloadFile(file.id);
  };

  const handleCardClick = () => {
    onView();
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all cursor-pointer",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={handleCardClick}
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
            <span>{formatFileSize(file.file_size)}</span>
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
                    <p className="text-xs">{getRoleTooltipContent(file)}</p>
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
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        description={`"${file.filename}" wirklich löschen?`}
      />
    </>
  );
}
