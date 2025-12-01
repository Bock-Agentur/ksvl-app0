import { useRef } from "react";
import { useRole } from "../auth/use-role";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Hook for managing file permissions
 * Provides centralized permission checking for file operations
 * Mobile-optimized with lightweight logic and caching
 */
export const useFilePermissions = () => {
  const { currentUser, currentRole } = useRole();
  
  // Make isAdmin reactive to role changes
  const isAdmin = currentUser?.roles.includes('admin') || false;

  // Cache for permission checks to avoid redundant queries
  const permissionCache = useRef<Map<string, { canView: boolean; canEdit: boolean; canDelete: boolean; timestamp: number }>>(new Map());
  const CACHE_TTL = 60000; // 1 minute cache

  /**
   * Check if user can upload files
   * @param category - File category (login_media, user_document, general, shared)
   * @param linkedUserId - Optional user ID for user_document category
   */
  const canUpload = (category?: string, linkedUserId?: string): boolean => {
    // Admins can always upload
    if (isAdmin) return true;

    // Regular users can upload to general and their own user_documents
    if (category === 'login_media' || category === 'shared') {
      return false; // Only admins can upload login media and shared files
    }

    // Users can upload their own documents
    if (category === 'user_document' && linkedUserId) {
      return false; // Only admins can upload for other users
    }

    return true; // Users can upload general files
  };

  /**
   * Clear cached permissions for a file
   */
  const clearCache = (fileId: string) => {
    permissionCache.current.delete(fileId);
  };

  /**
   * Check if user can view a file (with caching)
   * @param fileId - File ID
   */
  const canView = async (fileId: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return false;

      const userId = session.session.user.id;

      // Admins can view all files
      if (isAdmin) return true;

      // Check cache
      const cached = permissionCache.current.get(fileId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.canView;
      }

      // Check file metadata
      const { data: file, error } = await supabase
        .from('file_metadata')
        .select('owner_id, linked_user_id, is_public, allowed_roles')
        .eq('id', fileId)
        .single();

      if (error || !file) return false;

      // Public files are viewable by all authenticated users
      if (file.is_public) return true;

      // Users can view their own files
      if (file.owner_id === userId) return true;

      // Users can view files linked to them
      if (file.linked_user_id === userId) return true;

      // Check role-based access
      if (file.allowed_roles && file.allowed_roles.length > 0 && currentUser?.roles) {
        const hasRole = currentUser.roles.some(role => file.allowed_roles.includes(role));
        if (hasRole) return true;
      }

      return false;
    } catch (error) {
      logger.error('FILE', 'Error checking view permission', error);
      return false;
    }
  };

  /**
   * Check if user can edit a file
   * @param file - File metadata object
   */
  const canEdit = async (fileId: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return false;

      const userId = session.session.user.id;

      // Admins can edit all files
      if (isAdmin) return true;

      // Check file metadata
      const { data: file, error } = await supabase
        .from('file_metadata')
        .select('owner_id')
        .eq('id', fileId)
        .single();

      if (error || !file) return false;

      // Users can only edit their own files
      return file.owner_id === userId;
    } catch (error) {
      logger.error('FILE', 'Error checking edit permission', error);
      return false;
    }
  };

  /**
   * Check if user can delete a file
   * @param file - File metadata object
   */
  const canDelete = async (fileId: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return false;

      const userId = session.session.user.id;

      // Admins can delete all files
      if (isAdmin) return true;

      // Check file metadata
      const { data: file, error } = await supabase
        .from('file_metadata')
        .select('owner_id')
        .eq('id', fileId)
        .single();

      if (error || !file) return false;

      // Users can only delete their own files
      return file.owner_id === userId;
    } catch (error) {
      logger.error('FILE', 'Error checking delete permission', error);
      return false;
    }
  };

  /**
   * Batch check view permissions for multiple files
   * @param fileIds - Array of file IDs
   * @returns Map of fileId to boolean permission
   */
  const canViewMultiple = async (fileIds: string[]): Promise<Map<string, boolean>> => {
    const results = new Map<string, boolean>();
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        fileIds.forEach(id => results.set(id, false));
        return results;
      }

      const userId = session.session.user.id;

      // Admins can view all files
      if (isAdmin) {
        fileIds.forEach(id => results.set(id, true));
        return results;
      }

      // Separate cached and uncached IDs
      const uncachedIds: string[] = [];
      fileIds.forEach(id => {
        const cached = permissionCache.current.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          results.set(id, cached.canView);
        } else {
          uncachedIds.push(id);
        }
      });

      // Fetch uncached files in batch
      if (uncachedIds.length > 0) {
        const { data: files, error } = await supabase
          .from('file_metadata')
          .select('id, owner_id, linked_user_id, is_public, allowed_roles')
          .in('id', uncachedIds);

        if (!error && files) {
          files.forEach(file => {
            let canViewFile = false;

            if (file.is_public) canViewFile = true;
            else if (file.owner_id === userId) canViewFile = true;
            else if (file.linked_user_id === userId) canViewFile = true;
            else if (file.allowed_roles && file.allowed_roles.length > 0 && currentUser?.roles) {
              canViewFile = currentUser.roles.some(role => file.allowed_roles.includes(role));
            }

            results.set(file.id, canViewFile);

            // Update cache
            const existing = permissionCache.current.get(file.id);
            permissionCache.current.set(file.id, {
              canView: canViewFile,
              canEdit: existing?.canEdit ?? false,
              canDelete: existing?.canDelete ?? false,
              timestamp: Date.now()
            });
          });
        }

        // Mark failed fetches as false
        uncachedIds.forEach(id => {
          if (!results.has(id)) {
            results.set(id, false);
          }
        });
      }

      return results;
    } catch (error) {
      logger.error('FILE', 'Error checking batch view permissions', error);
      fileIds.forEach(id => results.set(id, false));
      return results;
    }
  };

  return {
    canUpload,
    canView,
    canEdit,
    canDelete,
    canViewMultiple,
    clearCache,
    isAdmin, // Return the reactive boolean value directly, not a function
  };
};
