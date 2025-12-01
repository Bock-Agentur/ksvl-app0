import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks";
import { fileService, FileMetadata, UploadMetadata, FileServiceError } from "@/lib/services/file-service";

// Re-export types for backward compatibility
export type { FileMetadata, UploadMetadata };

// Filters type
export interface FileFilters {
  category?: string;
  file_type?: string;
  tags?: string[];
  linked_user_id?: string;
  date_from?: string;
  date_to?: string;
  owner_id?: string;
}

// Sort options
export type SortBy = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';

/**
 * Main hook for file management
 * Mobile-optimized with pagination and efficient queries
 */
export const useFileManager = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filters, setFilters] = useState<FileFilters>({ category: undefined }); // Start with all files
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Load from localStorage
    return (localStorage.getItem('fileManagerViewMode') as 'grid' | 'list') || 'grid';
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;
  
  // Cache for preview URLs
  const previewUrlCache = useRef<Map<string, string>>(new Map());

  /**
   * Fetch files with filters and pagination
   * Mobile-optimized with limit
   */
  const fetchFiles = useCallback(async (loadMore = false) => {
    try {
      setLoading(true);
      const currentPage = loadMore ? page + 1 : 0;
      
      let query = supabase
        .from('file_metadata')
        .select('*', { count: 'exact' })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.file_type) {
        query = query.eq('file_type', filters.file_type);
      }
      if (filters.linked_user_id) {
        query = query.eq('linked_user_id', filters.linked_user_id);
      }
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`filename.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      const orderColumn = sortBy === 'name' ? 'filename' : 
                         sortBy === 'date' ? 'created_at' :
                         sortBy === 'size' ? 'file_size' :
                         'file_type';
      query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) throw error;

      // Type cast the data to FileMetadata[]
      const typedData = (data || []) as unknown as FileMetadata[];

      if (loadMore) {
        setFiles(prev => [...prev, ...typedData]);
        setPage(currentPage);
      } else {
        setFiles(typedData);
        setPage(0);
      }

      setHasMore((count || 0) > (currentPage + 1) * ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, sortOrder, toast]);

  /**
   * Upload single file - delegates to fileService
   */
  const uploadFile = async (file: File, metadata: UploadMetadata): Promise<FileMetadata | null> => {
    setUploading(true);
    try {
      const result = await fileService.uploadFile(file, metadata);
      
      toast({
        title: "Erfolg",
        description: "Datei erfolgreich hochgeladen",
      });

      // Add to current files list immediately for instant UI update
      setFiles(prev => [result, ...prev]);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Datei konnte nicht hochgeladen werden";
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload multiple files - delegates to fileService
   */
  const uploadMultipleFiles = async (
    files: File[], 
    metadata: UploadMetadata
  ): Promise<FileMetadata[]> => {
    setUploading(true);
    try {
      const results = await fileService.uploadMultipleFiles(files, metadata);
      
      // Add to files list
      setFiles(prev => [...results, ...prev]);
      
      toast({
        title: "Erfolg",
        description: `${results.length} Datei(en) hochgeladen`,
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Dateien konnten nicht hochgeladen werden";
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setUploading(false);
    }
  };

  /**
   * Delete single file - delegates to fileService
   */
  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      await fileService.deleteFile(fileId);
      
      toast({
        title: "Erfolg",
        description: "Datei gelöscht",
      });

      // Refresh files list
      await fetchFiles();
      return true;
    } catch (error) {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Datei konnte nicht gelöscht werden";
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Delete multiple files - delegates to fileService
   */
  const deleteMultipleFiles = async (fileIds: string[]): Promise<void> => {
    try {
      await fileService.deleteMultipleFiles(fileIds);
      
      toast({
        title: "Erfolg",
        description: `${fileIds.length} Datei(en) gelöscht`,
      });
      
      await fetchFiles();
      clearSelection();
    } catch (error) {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Dateien konnten nicht gelöscht werden";
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Update file metadata - delegates to fileService
   */
  const updateFileMetadata = async (
    fileId: string,
    updates: Partial<Pick<FileMetadata, 'description' | 'tags' | 'is_public' | 'allowed_roles'>>
  ): Promise<boolean> => {
    try {
      await fileService.updateMetadata(fileId, updates);
      
      toast({
        title: "Erfolg",
        description: "Metadaten aktualisiert",
      });

      // Refresh files list
      await fetchFiles();
      return true;
    } catch (error) {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Metadaten konnten nicht aktualisiert werden";
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Get download URL for a file - delegates to fileService
   */
  const getFileUrl = async (storagePath: string, category?: string): Promise<string | null> => {
    return fileService.getFileUrl(storagePath, category);
  };

  /**
   * Get preview URL for a file with caching - delegates to fileService
   */
  const getFilePreviewUrl = async (file: FileMetadata): Promise<string | null> => {
    // Check cache first
    if (previewUrlCache.current.has(file.id)) {
      const cachedUrl = previewUrlCache.current.get(file.id)!;
      console.log('💾 Using cached preview URL for:', file.filename);
      return cachedUrl;
    }

    // Get URL from service
    const url = await fileService.getPreviewUrl(file);
    
    // Cache the result
    if (url) {
      previewUrlCache.current.set(file.id, url);
    }

    return url;
  };

  /**
   * Download file
   */
  const downloadFile = async (fileId: string): Promise<void> => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const url = await getFileUrl(file.storage_path, file.category);
      if (!url) throw new Error("URL konnte nicht generiert werden");

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Fehler",
        description: "Datei konnte nicht heruntergeladen werden",
        variant: "destructive",
      });
    }
  };

  /**
   * Toggle file selection for multi-select
   */
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    setSelectedFiles([]);
  };

  /**
   * Update view mode and persist to localStorage
   */
  const updateViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('fileManagerViewMode', mode);
  };

  /**
   * Load more files (infinite scroll)
   */
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFiles(true);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    // State
    files,
    loading,
    uploading,
    selectedFiles,
    filters,
    searchQuery,
    sortBy,
    sortOrder,
    viewMode,
    hasMore,

    // Actions
    fetchFiles,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    deleteMultipleFiles,
    updateFileMetadata,
    downloadFile,
    getFileUrl,
    getFilePreviewUrl,
    toggleFileSelection,
    clearSelection,
    loadMore,

    // Setters
    setFilters,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setViewMode: updateViewMode,
  };
};
