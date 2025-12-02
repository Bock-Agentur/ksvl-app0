/**
 * File Card List View
 * 
 * Horizontal layout for list view mode.
 */

import { useState } from "react";
import { FileMetadata } from "@/hooks";
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
import { Eye, Download, Edit, Trash2, MoreVertical, Shield } from "lucide-react";
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

interface FileCardListProps extends FileCardBaseProps {}

export function FileCardList({
  file,
  isSelected,
  onSelect,
  onView,
  multiSelectActive,
}: FileCardListProps) {
  const { thumbnailUrl, thumbnailLoading, imageError, setImageError } = useFileCardThumbnail(file);
  const { canEditFile, canDeleteFile, deleteFile, downloadFile } = useFileCardPermissions(file);
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
          "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
          isSelected && "ring-2 ring-primary bg-accent"
        )}
        onClick={handleCardClick}
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
            <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
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
                    <p className="text-xs">{getRoleTooltipContent(file)}</p>
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
            <DropdownMenuContent align="end" className="bg-card z-50">
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

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        description={`"${file.filename}" wirklich löschen?`}
      />
    </>
  );
}
