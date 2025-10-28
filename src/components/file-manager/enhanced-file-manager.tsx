import { useState } from "react";
import { useFileManager } from "@/hooks/use-file-manager";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCard } from "./file-card";
import { FileUploadDialog } from "./file-upload-dialog";
import { FileDetailDrawer } from "./file-detail-drawer";
import { 
  Upload, 
  Grid3x3, 
  List, 
  Search, 
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function EnhancedFileManager() {
  const isMobile = useIsMobile();
  const {
    files,
    loading,
    selectedFiles,
    filters,
    searchQuery,
    viewMode,
    hasMore,
    setFilters,
    setSearchQuery,
    setViewMode,
    toggleFileSelection,
    clearSelection,
    deleteMultipleFiles,
    loadMore,
  } = useFileManager();

  const { isAdmin } = useFilePermissions();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Alle', value: undefined },
    { id: 'general', label: 'Meine Dateien', value: 'general' },
    ...(isAdmin() ? [
      { id: 'user_document', label: 'Dokumente', value: 'user_document' },
      { id: 'login_media', label: 'Login-Medien', value: 'login_media' },
    ] : []),
  ];

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setFilters({ ...filters, category: category?.value });
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`${selectedFiles.length} Dateien wirklich löschen?`)) {
      await deleteMultipleFiles(selectedFiles);
    }
  };

  const isMultiSelectActive = selectedFiles.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="p-4 space-y-3">
          {/* Search & View Mode */}
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
            
            {!isMobile && (
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Hochladen
            </Button>
          </div>

          {/* Category Tabs */}
          <Tabs 
            value={filters.category || 'all'} 
            onValueChange={handleCategoryChange}
            className="w-full"
          >
            <TabsList className={cn(
              "w-full justify-start",
              isMobile && "overflow-x-auto flex-nowrap"
            )}>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="flex-shrink-0">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Multi-Select Actions */}
      {isMultiSelectActive && (
        <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
          <span className="text-sm font-medium">{selectedFiles.length} ausgewählt</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Löschen
            </Button>
            <Button size="sm" variant="secondary" onClick={clearSelection}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {loading && files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Lade Dateien...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Keine Dateien gefunden</p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Erste Datei hochladen
            </Button>
          </div>
        ) : (
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
                  onSelect={() => toggleFileSelection(file.id)}
                  onView={() => setSelectedFileId(file.id)}
                  multiSelectActive={isMultiSelectActive}
                />
              ))}
            </div>

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

      {/* Upload FAB (Mobile) */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-20"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-6 w-6" />
        </Button>
      )}

      {/* Dialogs */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />

      <FileDetailDrawer
        fileId={selectedFileId}
        open={!!selectedFileId}
        onOpenChange={(open) => !open && setSelectedFileId(null)}
      />
    </div>
  );
}
