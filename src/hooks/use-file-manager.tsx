import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// File metadata type
export interface FileMetadata {
  id: string;
  filename: string;
  storage_path: string;
  file_type: 'image' | 'pdf' | 'video' | 'other';
  mime_type: string;
  file_size: number;
  owner_id: string | null;
  linked_user_id: string | null;
  category: 'login_media' | 'user_document' | 'general' | 'shared';
  document_type: 'bfa' | 'insurance' | 'berth_contract' | 'member_photo' | null;
  tags: string[];
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Upload metadata schema for validation
const uploadMetadataSchema = z.object({
  category: z.enum(['login_media', 'user_document', 'general', 'shared']),
  document_type: z.enum(['bfa', 'insurance', 'berth_contract', 'member_photo']).nullable().optional(),
  linked_user_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().optional(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

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
  const [filters, setFilters] = useState<FileFilters>({});
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
  }, [filters, searchQuery, sortBy, sortOrder, page, toast]);

  /**
   * Upload single file
   * Mobile-optimized with progress tracking
   */
  const uploadFile = async (file: File, metadata: UploadMetadata): Promise<FileMetadata | null> => {
    try {
      // Validate metadata
      const validatedMetadata = uploadMetadataSchema.parse(metadata);
      
      // Validate file size (20MB for images/videos, 10MB for PDFs)
      const maxSize = file.type.startsWith('image/') || file.type.startsWith('video/') 
        ? 20 * 1024 * 1024 
        : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        toast({
          title: "Datei zu groß",
          description: `Maximale Dateigröße: ${maxSize / (1024 * 1024)}MB`,
          variant: "destructive",
        });
        return null;
      }

      setUploading(true);

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Nicht angemeldet");

      // Determine storage path based on category
      const userId = session.user.id;
      let storagePath = '';
      
      if (validatedMetadata.category === 'user_document' && validatedMetadata.linked_user_id) {
        storagePath = `user_documents/${validatedMetadata.linked_user_id}/${validatedMetadata.document_type || 'general'}/${file.name}`;
      } else {
        storagePath = `${userId}/general/${file.name}`;
      }

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Determine file type
      let fileType: 'image' | 'pdf' | 'video' | 'other' = 'other';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type.startsWith('video/')) fileType = 'video';

      // Create metadata entry
      const { data: metadataData, error: metadataError } = await supabase
        .from('file_metadata')
        .insert({
          filename: file.name,
          storage_path: uploadData.path,
          file_type: fileType,
          mime_type: file.type,
          file_size: file.size,
          owner_id: userId,
          linked_user_id: validatedMetadata.linked_user_id || null,
          category: validatedMetadata.category,
          document_type: validatedMetadata.document_type || null,
          tags: validatedMetadata.tags || [],
          description: validatedMetadata.description || null,
          is_public: validatedMetadata.is_public || false,
        })
        .select()
        .single() as { data: FileMetadata | null; error: any };

      if (metadataError) {
        // Rollback storage upload
        await supabase.storage.from('documents').remove([uploadData.path]);
        throw metadataError;
      }

      toast({
        title: "Erfolg",
        description: "Datei erfolgreich hochgeladen",
      });

      // Refresh files list
      await fetchFiles();

      return metadataData;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Fehler",
        description: "Datei konnte nicht hochgeladen werden",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload multiple files
   */
  const uploadMultipleFiles = async (
    files: File[], 
    metadata: UploadMetadata
  ): Promise<FileMetadata[]> => {
    const uploadedFiles: FileMetadata[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, metadata);
      if (result) uploadedFiles.push(result);
    }
    
    return uploadedFiles;
  };

  /**
   * Delete single file
   */
  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      // Get file metadata
      const { data: file, error: fetchError } = await supabase
        .from('file_metadata')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError || !file) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('id', fileId);

      if (metadataError) throw metadataError;

      toast({
        title: "Erfolg",
        description: "Datei gelöscht",
      });

      // Refresh files list
      await fetchFiles();

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Fehler",
        description: "Datei konnte nicht gelöscht werden",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Delete multiple files
   */
  const deleteMultipleFiles = async (fileIds: string[]): Promise<void> => {
    for (const fileId of fileIds) {
      await deleteFile(fileId);
    }
    clearSelection();
  };

  /**
   * Update file metadata
   */
  const updateFileMetadata = async (
    fileId: string,
    updates: Partial<Pick<FileMetadata, 'description' | 'tags' | 'is_public'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('file_metadata')
        .update(updates)
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Metadaten aktualisiert",
      });

      // Refresh files list
      await fetchFiles();

      return true;
    } catch (error) {
      console.error('Error updating metadata:', error);
      toast({
        title: "Fehler",
        description: "Metadaten konnten nicht aktualisiert werden",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Get download URL for a file
   */
  const getFileUrl = async (storagePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  /**
   * Download file
   */
  const downloadFile = async (fileId: string): Promise<void> => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const url = await getFileUrl(file.storage_path);
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
  }, [filters, searchQuery, sortBy, sortOrder]);

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
