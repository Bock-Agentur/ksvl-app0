import { useState } from "react";
import { useFileManager } from "@/hooks/use-file-manager";
import { useFilePermissions } from "@/hooks/use-file-permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileCard } from "./file-card";
import { FileUploadDialog } from "./file-upload-dialog";
import { FileDetailDrawer } from "./file-detail-drawer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Upload, 
  Grid3x3, 
  List, 
  Search, 
  SlidersHorizontal,
  Trash2,
  Download,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Enhanced File Manager Component
 * Mobile-first design with adaptive layouts
 */
export function EnhancedFileManager() {
  const isMobile = useIsMobile();
  const {
    files,
    loading,
    uploading,
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Category tabs
  const categories = [
    { id: 'all', label: 'Alle', value: undefined },
    { id: 'general', label: 'Meine Dateien', value: 'general' },
    ...(isAdmin() ? [
      { id: 'user_document', label: 'Mitglieder-Dokumente', value: 'user_document' },
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

  const handleMigrateFiles = async () => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-storage-files', {
        body: { bucketName: 'login-media' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Migration erfolgreich! ${data.migratedCount} Dateien migriert, ${data.skippedCount} übersprungen.`
        );
        // Refresh file list
        window.location.reload();
      } else {
        toast.error(`Migration mit Fehlern: ${data.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration fehlgeschlagen');
    } finally {
      setIsMigrating(false);
    }
  };

  const isMultiSelectActive = selectedFiles.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4 space-y-3">
          {/* Search Bar */}
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
            
            {/* Filter Sheet (Mobile) / Button (Desktop) */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[80vh]" : ""}>
                <SheetHeader>
                  <SheetTitle>Filter</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  {/* File Type Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dateityp</label>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'image', 'pdf', 'video'].map((type) => (
                        <Button
                          key={type}
                          variant={filters.file_type === (type === 'all' ? undefined : type) ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilters({ ...filters, file_type: type === 'all' ? undefined : type })}
                        >
                          {type === 'all' ? 'Alle' : type.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* View Toggle */}
            <div className="hidden sm:flex gap-1 border rounded-md p-1">
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
          </div>

          {/* Category Tabs - Horizontal Scroll on Mobile */}
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

          {/* Active Filters */}
          {(filters.file_type || searchQuery) && (
            <div className="flex gap-2 flex-wrap">
              {filters.file_type && (
                <Badge variant="secondary" className="gap-1">
                  Typ: {filters.file_type}
                  <button onClick={() => setFilters({ ...filters, file_type: undefined })}>×</button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Suche: {searchQuery}
                  <button onClick={() => setSearchQuery('')}>×</button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Select Actions Bar */}
      {isMultiSelectActive && (
        <div className="sticky top-[180px] z-10 bg-primary text-primary-foreground p-3 flex items-center justify-between shadow-lg">
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

      {/* File Grid/List */}
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

      {/* Upload Button (Desktop) */}
      {!isMobile && (
        <div className="sticky bottom-0 p-4 bg-background border-t space-y-2">
          <Button onClick={() => setUploadDialogOpen(true)} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Datei hochladen
          </Button>
          
          {/* Admin Migration Button */}
          {isAdmin() && (
            <Button 
              onClick={handleMigrateFiles} 
              variant="outline" 
              className="w-full"
              disabled={isMigrating}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isMigrating && "animate-spin")} />
              {isMigrating ? 'Migriere...' : 'Alte Dateien migrieren'}
            </Button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />

      {/* File Detail Drawer */}
      <FileDetailDrawer
        fileId={selectedFileId}
        open={!!selectedFileId}
        onOpenChange={(open) => !open && setSelectedFileId(null)}
      />
    </div>
  );
}
