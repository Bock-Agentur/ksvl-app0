/**
 * Enhanced File Manager Component
 * 
 * Orchestrator component that coordinates file management operations.
 * Mobile-first design with adaptive layouts.
 * 
 * Refactored from ~564 lines to use subcomponents:
 * - FileManagerFilters: Search, category, and file type filtering
 * - FileManagerGrid: File list/grid rendering with pagination
 * - FileManagerActionsBar: Bulk action toolbar
 */

import { useState, useEffect } from "react";
import { useFileManager, useFilePermissions, useRole, useIsMobile } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUploadDrawer } from "./components/file-upload-drawer";
import { FileDetailDrawer } from "./components/file-detail-drawer";
import { BulkPermissionsDialog } from "./components/bulk-permissions-dialog";
import { DeleteConfirmationDialog } from "./components/delete-confirmation-dialog";
import { FileManagerFilters } from "./components/file-manager-filters";
import { FileManagerGrid } from "./components/file-manager-grid";
import { FileManagerActionsBar } from "./components/file-manager-actions-bar";
import { useFileManagerActions } from "./hooks/use-file-manager-actions";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Info, RefreshCw } from "lucide-react";
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
  const { currentRole } = useRole();
  const { isMigrating, handleBulkPermissions, handleMigrateFiles } = useFileManagerActions();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [bulkPermissionsOpen, setBulkPermissionsOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [authDebug, setAuthDebug] = useState<{ isLoggedIn: boolean; isAdminUser: boolean; userId: string | null }>();

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
  }, [isAdmin, currentRole]);

  const handleBulkDelete = async () => {
    await deleteMultipleFiles(selectedFiles);
    setBulkDeleteDialogOpen(false);
    clearSelection();
    setMultiSelectMode(false);
  };

  const onBulkPermissionsApply = async (roles: string[]) => {
    const success = await handleBulkPermissions(selectedFiles, roles);
    if (success) {
      clearSelection();
      setMultiSelectMode(false);
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
      {/* Filters - Mobile & Desktop */}
      <div className={isMobile ? "block" : "hidden sm:block"}>
        <FileManagerFilters
          filters={filters}
          searchQuery={searchQuery}
          viewMode={viewMode}
          isAdmin={isAdmin}
          isMobile={isMobile}
          isFilterOpen={isFilterOpen}
          multiSelectMode={multiSelectMode}
          onFiltersChange={setFilters}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onFilterOpenChange={setIsFilterOpen}
          onMultiSelectToggle={toggleMultiSelectMode}
        />
      </div>

      {/* Multi-Select Actions Bar */}
      {isMultiSelectActive && (
        <FileManagerActionsBar
          selectedCount={selectedFiles.length}
          isAdmin={isAdmin}
          onBulkPermissions={() => setBulkPermissionsOpen(true)}
          onBulkDelete={() => setBulkDeleteDialogOpen(true)}
          onClearSelection={clearSelection}
        />
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

        <FileManagerGrid
          files={files}
          viewMode={viewMode}
          loading={loading}
          hasMore={hasMore}
          selectedFiles={selectedFiles}
          multiSelectMode={multiSelectMode}
          onFileSelect={toggleFileSelection}
          onFileView={setSelectedFileId}
          onLoadMore={loadMore}
          onUploadClick={() => setUploadDialogOpen(true)}
        />
      </div>

      {/* Upload FAB (Mobile) */}
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

      {/* Dialogs */}
      <FileUploadDrawer open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
      <FileDetailDrawer fileId={selectedFileId} open={!!selectedFileId} onOpenChange={(open) => !open && setSelectedFileId(null)} />
      <BulkPermissionsDialog open={bulkPermissionsOpen} onOpenChange={setBulkPermissionsOpen} selectedCount={selectedFiles.length} onApply={onBulkPermissionsApply} />
      <DeleteConfirmationDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen} onConfirm={handleBulkDelete} description={`${selectedFiles.length} Dateien wirklich löschen?`} />
    </div>
  );
}