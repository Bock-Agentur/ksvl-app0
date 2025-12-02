/**
 * FileManagerGrid Component
 * 
 * Renders the file list in either grid or list view mode.
 * Handles loading states, empty states, and pagination.
 */

import { Button } from "@/components/ui/button";
import { FileCard } from "../file-card";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileMetadata, ViewMode } from "../types/file-manager.types";

interface FileManagerGridProps {
  files: FileMetadata[];
  viewMode: ViewMode;
  loading: boolean;
  hasMore: boolean;
  selectedFiles: string[];
  multiSelectMode: boolean;
  onFileSelect: (fileId: string) => void;
  onFileView: (fileId: string) => void;
  onLoadMore: () => void;
  onUploadClick: () => void;
}

export function FileManagerGrid({
  files,
  viewMode,
  loading,
  hasMore,
  selectedFiles,
  multiSelectMode,
  onFileSelect,
  onFileView,
  onLoadMore,
  onUploadClick,
}: FileManagerGridProps) {
  // Loading state
  if (loading && files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Lade Dateien...
      </div>
    );
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Keine Dateien gefunden</p>
        <Button onClick={onUploadClick}>
          <Upload className="h-4 w-4 mr-2" />
          Erste Datei hochladen
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        viewMode === 'grid' 
          ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "space-y-2"
      )}>
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            viewMode={viewMode}
            isSelected={selectedFiles.includes(file.id)}
            onSelect={() => onFileSelect(file.id)}
            onView={() => onFileView(file.id)}
            multiSelectActive={multiSelectMode}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-8">
          <Button onClick={onLoadMore} variant="outline" disabled={loading}>
            {loading ? 'Lädt...' : 'Mehr laden'}
          </Button>
        </div>
      )}
    </>
  );
}