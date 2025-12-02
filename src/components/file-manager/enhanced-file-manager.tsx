import { useState, useEffect } from "react";
import { useFileManager, useFilePermissions, useRole, useIsMobile } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileCard } from "./file-card";
import { FileUploadDrawer } from "./components/file-upload-drawer";
import { FileDetailDrawer } from "./components/file-detail-drawer";
import { BulkPermissionsDialog } from "./components/bulk-permissions-dialog";
import { DeleteConfirmationDialog } from "./components/delete-confirmation-dialog";
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
  RefreshCw,
  Info,
  ChevronDown,
  CheckSquare,
  Shield
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
  const { currentRole } = useRole();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [authDebug, setAuthDebug] = useState<{ isLoggedIn: boolean; isAdminUser: boolean; userId: string | null }>();
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [bulkPermissionsOpen, setBulkPermissionsOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Debug: Check auth status on mount only
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthDebug({
        isLoggedIn: !!user,
        isAdminUser: isAdmin,
        userId: user?.id || null
      });
    })();
  }, [isAdmin, currentRole]); // ✅ Removed files.length from dependencies

  // Category tabs - reactive to role changes
  const categories = [
    { id: 'all', label: 'Alle', value: undefined },
    { id: 'general', label: 'Meine Dateien', value: 'general' },
    ...(isAdmin ? [
      { id: 'user_document', label: 'Mitglieder-Dokumente', value: 'user_document' },
      { id: 'login_media', label: 'Login-Medien', value: 'login_media' },
    ] : []),
  ];

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setFilters({ ...filters, category: category?.value });
  };

  const handleBulkDelete = async () => {
    await deleteMultipleFiles(selectedFiles);
    setBulkDeleteDialogOpen(false);
    clearSelection();
    setMultiSelectMode(false);
  };

  const handleBulkPermissions = async (roles: string[]) => {
    try {
      const updates = selectedFiles.map(fileId => 
        supabase
          .from('file_metadata')
          .update({ allowed_roles: roles.length > 0 ? roles : null })
          .eq('id', fileId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        toast.error(`Fehler beim Aktualisieren von ${errors.length} Datei(en)`);
      } else {
        toast.success(`Berechtigungen für ${selectedFiles.length} Datei(en) aktualisiert`);
        clearSelection();
        setMultiSelectMode(false);
      }
    } catch (error) {
      console.error('Bulk permissions error:', error);
      toast.error('Fehler beim Aktualisieren der Berechtigungen');
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
        // ✅ Refresh file list via hook instead of page reload
        window.location.reload(); // TODO: Replace with refetch when hook exports it
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

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    if (multiSelectMode) {
      clearSelection();
    }
  };

  const isMultiSelectActive = multiSelectMode && selectedFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Mobile: Multi-Select Toggle & Filter Toggle */}
      <div className="sm:hidden flex gap-2">
        <Button
          variant={multiSelectMode ? 'default' : 'outline'}
          size="sm"
          onClick={toggleMultiSelectMode}
          className="flex items-center gap-2 bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 hover:bg-white/90 px-4 py-4 h-auto"
        >
          <CheckSquare className="h-4 w-4" />
          {multiSelectMode ? 'Fertig' : 'Auswählen'}
        </Button>
        
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="flex-1">
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-between bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 hover:bg-white/90 px-6 py-4 h-auto"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-semibold text-sm">Filter</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
            <CardContent className="pt-4 space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search-mobile">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-mobile"
                    placeholder="Dateien durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Label>Kategorie</Label>
                <Select 
                  value={filters.category || 'all'} 
                  onValueChange={(value) => {
                    setFilters({ ...filters, category: value === 'all' ? undefined : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="general">Meine Dateien</SelectItem>
                    {isAdmin && (
                      <>
                        <SelectItem value="user_document">Mitglieder-Dokumente</SelectItem>
                        <SelectItem value="login_media">Login-Medien</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* File Type Filter - Images only */}
              <div>
                <Label>Dateityp</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['all', 'image'].map((type) => (
                    <Button
                      key={type}
                      variant={filters.file_type === (type === 'all' ? undefined : type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, file_type: type === 'all' ? undefined : type })}
                    >
                      {type === 'all' ? 'Alle' : 'Bilder'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* View Mode */}
              <div>
                <Label>Ansicht</Label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Rasteransicht
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex items-center gap-2 flex-1"
                  >
                    <List className="h-4 w-4" />
                    Listenansicht
                  </Button>
                </div>
              </div>

              {/* Reset Filters */}
              {(searchQuery || filters.file_type || (filters.category && filters.category !== 'all')) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ category: undefined, file_type: undefined });
                  }} 
                  className="w-full"
                >
                  Filter zurücksetzen
                </Button>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Search & Filter Card - Desktop */}
      <Card className="hidden sm:block bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
        <CardContent className="pt-6 space-y-4">
          {/* View Mode Toggle & Multi-Select Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Rasteransicht
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Listenansicht
              </Button>
            </div>
            
            {/* Multi-Select Toggle */}
            <Button
              variant={multiSelectMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleMultiSelectMode}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              {multiSelectMode ? 'Fertig' : 'Auswählen'}
            </Button>
          </div>

          {/* Search */}
          <div>
            <Label htmlFor="search-desktop">Suche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-desktop"
                placeholder="Dateien durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <Tabs 
              value={filters.category || 'all'} 
              onValueChange={(value) => {
                setFilters({ ...filters, category: value === 'all' ? undefined : value });
              }}
              className="w-full"
            >
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="general">Meine Dateien</TabsTrigger>
                {isAdmin && (
                  <>
                    <TabsTrigger value="user_document">Mitglieder-Dokumente</TabsTrigger>
                    <TabsTrigger value="login_media">Login-Medien</TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* File Type Filter - Images only */}
          <div>
            <Label>Dateityp</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['all', 'image'].map((type) => (
                <Button
                  key={type}
                  variant={filters.file_type === (type === 'all' ? undefined : type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters({ ...filters, file_type: type === 'all' ? undefined : type })}
                >
                  {type === 'all' ? 'Alle' : 'Bilder'}
                </Button>
              ))}
            </div>
          </div>

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
        </CardContent>
      </Card>

      {/* Multi-Select Actions Bar - Responsive */}
      {isMultiSelectActive && (
        <div className="sticky top-[60px] sm:top-[180px] z-10 bg-primary text-primary-foreground p-3 rounded-lg flex items-center justify-between shadow-lg">
          <span className="text-sm font-medium">{selectedFiles.length} ausgewählt</span>
          <div className="flex gap-1 sm:gap-2">
            {isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setBulkPermissionsOpen(true)} className="px-2 sm:px-3">
                <Shield className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Berechtigungen</span>
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setBulkDeleteDialogOpen(true)} className="px-2 sm:px-3">
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Löschen</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={clearSelection} className="px-2 sm:px-3">
              <span className="hidden sm:inline">Abbrechen</span>
              <span className="sm:hidden">×</span>
            </Button>
          </div>
        </div>
      )}

      {/* File Grid/List */}
      <div className="space-y-4">
        {/* Debug Info for Admins - Only in Development */}
        {import.meta.env.DEV && authDebug && (
          <Alert className="mb-4 border-yellow-500/20 bg-yellow-500/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs font-mono">
              Login: {authDebug.isLoggedIn ? '✓' : '✗'} | 
              Admin: {authDebug.isAdminUser ? '✓' : '✗'} | 
              User ID: {authDebug.userId || 'null'} |
              Dateien: {files.length}
            </AlertDescription>
          </Alert>
        )}

        {/* Migration Info Banner for Admins */}
        {isAdmin && files.length === 0 && !loading && (
          <Alert className="mb-4 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm">
                Alte Dateien aus dem Login-Bereich migrieren? Klicken Sie auf "Alte Dateien migrieren".
              </span>
              <Button 
                onClick={handleMigrateFiles} 
                size="sm"
                variant="default"
                disabled={isMigrating}
                className="shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isMigrating && "animate-spin")} />
                {isMigrating ? 'Migriere...' : 'Jetzt migrieren'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                  multiSelectActive={multiSelectMode}
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

      {/* Upload FAB (Mobile) - Higher to avoid footer overlap */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-20"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-6 w-6" />
        </Button>
      )}

      {/* Upload Button (Desktop) */}
      {!isMobile && (
        <Button 
          onClick={() => setUploadDialogOpen(true)} 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20"
          size="icon"
        >
          <Upload className="h-6 w-6" />
        </Button>
      )}

      {/* Upload Drawer */}
      <FileUploadDrawer
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />

      {/* File Detail Drawer */}
      <FileDetailDrawer
        fileId={selectedFileId}
        open={!!selectedFileId}
        onOpenChange={(open) => !open && setSelectedFileId(null)}
      />

      {/* Bulk Permissions Dialog */}
      <BulkPermissionsDialog
        open={bulkPermissionsOpen}
        onOpenChange={setBulkPermissionsOpen}
        selectedCount={selectedFiles.length}
        onApply={handleBulkPermissions}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        description={`${selectedFiles.length} Dateien wirklich löschen?`}
      />
    </div>
  );
}
