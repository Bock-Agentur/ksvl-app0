import { useState } from "react";
import { FileMetadata, useFileManager } from "@/hooks/use-file-manager";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCard } from "./file-card";
import { Search, Grid3x3, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: FileMetadata) => void;
  title?: string;
  description?: string;
  filters?: {
    category?: string;
    file_type?: string;
    allowedMimeTypes?: string[];
  };
  multiple?: boolean;
}

/**
 * File Selector Dialog
 * Reusable component for selecting files from the file manager
 * Mobile-optimized with full-screen layout
 */
export function FileSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Datei auswählen",
  description = "Wählen Sie eine Datei aus dem Dateimanager",
  filters,
  multiple = false,
}: FileSelectorDialogProps) {
  const isMobile = useIsMobile();
  const {
    files,
    loading,
    searchQuery,
    hasMore,
    setSearchQuery,
    setFilters,
    loadMore,
  } = useFileManager();

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>('grid');

  // Apply filters
  useState(() => {
    if (filters) {
      setFilters({
        category: filters.category,
        file_type: filters.file_type,
      });
    }
  });

  // Filter by allowed mime types if specified
  const filteredFiles = filters?.allowedMimeTypes
    ? files.filter(file => filters.allowedMimeTypes!.includes(file.mime_type))
    : files;

  const handleSelect = (file: FileMetadata) => {
    if (multiple) {
      const isSelected = selectedFiles.includes(file.id);
      if (isSelected) {
        setSelectedFiles(selectedFiles.filter(id => id !== file.id));
      } else {
        setSelectedFiles([...selectedFiles, file.id]);
      }
    } else {
      onSelect(file);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (multiple && selectedFiles.length > 0) {
      // For multiple selection, pass the first selected file for now
      // This could be extended to return all selected files
      const file = files.find(f => f.id === selectedFiles[0]);
      if (file) onSelect(file);
      onOpenChange(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Search and View Toggle */}
      <div className="p-4 space-y-3 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Dateien durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* View Toggle */}
          <div className="hidden sm:flex gap-1 border rounded-md p-1">
            <Button
              variant={localViewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLocalViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={localViewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLocalViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Filter (if no preset filter) */}
        {!filters?.category && (
          <Tabs 
            defaultValue="all" 
            onValueChange={(v) => setFilters({ category: v === 'all' ? undefined : v })}
            className="w-full"
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="general">Allgemein</TabsTrigger>
              <TabsTrigger value="login_media">Login-Medien</TabsTrigger>
              <TabsTrigger value="user_document">Dokumente</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {loading && filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Lade Dateien...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Keine Dateien gefunden
          </div>
        ) : (
          <>
            <div className={cn(
              localViewMode === 'grid' 
                ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-2"
            )}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelect(file)}
                  className="cursor-pointer"
                >
                  <FileCard
                    file={file}
                    viewMode={localViewMode}
                    isSelected={multiple ? selectedFiles.includes(file.id) : false}
                    onSelect={() => handleSelect(file)}
                    onView={() => handleSelect(file)}
                    multiSelectActive={multiple}
                  />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-8">
                <Button onClick={loadMore} variant="outline" disabled={loading}>
                  {loading ? 'Lädt...' : 'Mehr laden'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions (for multiple selection) */}
      {multiple && selectedFiles.length > 0 && (
        <div className="p-4 border-t bg-background">
          <Button onClick={handleConfirm} className="w-full">
            {selectedFiles.length} Datei(en) auswählen
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
