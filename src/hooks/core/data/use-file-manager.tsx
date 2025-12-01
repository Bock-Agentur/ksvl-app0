import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks";
import { fileService, FileMetadata, UploadMetadata, FileServiceError } from "@/lib/services/file-service";
import { QUERY_KEYS, FileQueryFilters } from "@/lib/query-keys";

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

const ITEMS_PER_PAGE = 20;

/**
 * Fetch files from Supabase with filters, search, and pagination
 */
async function fetchFilesFromDB(params: {
  filters: FileFilters;
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
}): Promise<{ files: FileMetadata[]; totalCount: number }> {
  const { filters, searchQuery, sortBy, sortOrder, page } = params;
  
  let query = supabase
    .from('file_metadata')
    .select('*', { count: 'exact' })
    .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

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

  return {
    files: (data || []) as unknown as FileMetadata[],
    totalCount: count || 0
  };
}

/**
 * Main hook for file management
 * React Query powered with optimistic updates
 */
export const useFileManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local UI state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filters, setFilters] = useState<FileFilters>({ category: undefined });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('fileManagerViewMode') as 'grid' | 'list') || 'grid';
  });
  const [page, setPage] = useState(0);
  
  // Cache for preview URLs
  const previewUrlCache = useRef<Map<string, string>>(new Map());

  // Build query key for caching
  const queryFilters: FileQueryFilters = {
    ...filters,
    searchQuery,
    sortBy,
    sortOrder,
    page
  };

  // ============ QUERY: Fetch Files ============
  const {
    data: filesData,
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.fileMetadata(queryFilters),
    queryFn: () => fetchFilesFromDB({ filters, searchQuery, sortBy, sortOrder, page }),
    staleTime: 30 * 1000, // 30 seconds
  });

  const files = filesData?.files || [];
  const hasMore = filesData ? filesData.totalCount > (page + 1) * ITEMS_PER_PAGE : false;

  // ============ MUTATION: Upload File ============
  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: UploadMetadata }) => {
      return fileService.uploadFile(file, metadata);
    },
    onSuccess: (newFile) => {
      toast({ title: "Erfolg", description: "Datei erfolgreich hochgeladen" });
      // Invalidate all file queries to refresh
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
    },
    onError: (error) => {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Datei konnte nicht hochgeladen werden";
      toast({ title: "Fehler", description: errorMessage, variant: "destructive" });
    }
  });

  // ============ MUTATION: Upload Multiple Files ============
  const uploadMultipleMutation = useMutation({
    mutationFn: async ({ files, metadata }: { files: File[]; metadata: UploadMetadata }) => {
      return fileService.uploadMultipleFiles(files, metadata);
    },
    onSuccess: (results) => {
      toast({ title: "Erfolg", description: `${results.length} Datei(en) hochgeladen` });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
    },
    onError: (error) => {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Dateien konnten nicht hochgeladen werden";
      toast({ title: "Fehler", description: errorMessage, variant: "destructive" });
    }
  });

  // ============ MUTATION: Delete File ============
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await fileService.deleteFile(fileId);
      return fileId;
    },
    onSuccess: () => {
      toast({ title: "Erfolg", description: "Datei gelöscht" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
    },
    onError: (error) => {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Datei konnte nicht gelöscht werden";
      toast({ title: "Fehler", description: errorMessage, variant: "destructive" });
    }
  });

  // ============ MUTATION: Delete Multiple Files ============
  const deleteMultipleMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      await fileService.deleteMultipleFiles(fileIds);
      return fileIds;
    },
    onSuccess: (deletedIds) => {
      toast({ title: "Erfolg", description: `${deletedIds.length} Datei(en) gelöscht` });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
      clearSelection();
    },
    onError: (error) => {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Dateien konnten nicht gelöscht werden";
      toast({ title: "Fehler", description: errorMessage, variant: "destructive" });
    }
  });

  // ============ MUTATION: Update Metadata ============
  const updateMetadataMutation = useMutation({
    mutationFn: async ({ fileId, updates }: { 
      fileId: string; 
      updates: Partial<Pick<FileMetadata, 'description' | 'tags' | 'is_public' | 'allowed_roles'>>
    }) => {
      return fileService.updateMetadata(fileId, updates);
    },
    onSuccess: () => {
      toast({ title: "Erfolg", description: "Metadaten aktualisiert" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fileMetadataBase });
    },
    onError: (error) => {
      const errorMessage = error instanceof FileServiceError 
        ? error.message 
        : "Metadaten konnten nicht aktualisiert werden";
      toast({ title: "Fehler", description: errorMessage, variant: "destructive" });
    }
  });

  // ============ Helper Functions ============

  /**
   * Upload single file - wraps mutation
   */
  const uploadFile = async (file: File, metadata: UploadMetadata): Promise<FileMetadata | null> => {
    try {
      return await uploadMutation.mutateAsync({ file, metadata });
    } catch {
      return null;
    }
  };

  /**
   * Upload multiple files - wraps mutation
   */
  const uploadMultipleFiles = async (files: File[], metadata: UploadMetadata): Promise<FileMetadata[]> => {
    try {
      return await uploadMultipleMutation.mutateAsync({ files, metadata });
    } catch {
      return [];
    }
  };

  /**
   * Delete single file - wraps mutation
   */
  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(fileId);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Delete multiple files - wraps mutation
   */
  const deleteMultipleFiles = async (fileIds: string[]): Promise<void> => {
    await deleteMultipleMutation.mutateAsync(fileIds);
  };

  /**
   * Update file metadata - wraps mutation
   */
  const updateFileMetadata = async (
    fileId: string,
    updates: Partial<Pick<FileMetadata, 'description' | 'tags' | 'is_public' | 'allowed_roles'>>
  ): Promise<boolean> => {
    try {
      await updateMetadataMutation.mutateAsync({ fileId, updates });
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Get download URL for a file
   */
  const getFileUrl = async (storagePath: string, category?: string): Promise<string | null> => {
    return fileService.getFileUrl(storagePath, category);
  };

  /**
   * Get preview URL with caching
   */
  const getFilePreviewUrl = async (file: FileMetadata): Promise<string | null> => {
    if (previewUrlCache.current.has(file.id)) {
      return previewUrlCache.current.get(file.id)!;
    }

    const url = await fileService.getPreviewUrl(file);
    
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

      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Datei konnte nicht heruntergeladen werden",
        variant: "destructive",
      });
    }
  };

  /**
   * Toggle file selection
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
   * Update view mode with persistence
   */
  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode);
    localStorage.setItem('fileManagerViewMode', mode);
  };

  /**
   * Load more files (infinite scroll)
   */
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  /**
   * Manual refetch
   */
  const fetchFiles = useCallback(() => {
    setPage(0);
    refetch();
  }, [refetch]);

  return {
    // State
    files,
    loading,
    uploading: uploadMutation.isPending || uploadMultipleMutation.isPending,
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
    setViewMode,
  };
};
