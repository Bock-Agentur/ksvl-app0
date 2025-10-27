import { useRole } from "./use-role";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing file permissions
 * Provides centralized permission checking for file operations
 * Mobile-optimized with lightweight logic
 */
export const useFilePermissions = () => {
  const { currentUser } = useRole();
  const isAdmin = currentUser?.roles.includes('admin') || false;

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
   * Check if user can view a file
   * @param file - File metadata object
   */
  const canView = async (fileId: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return false;

      const userId = session.session.user.id;

      // Admins can view all files
      if (isAdmin) return true;

      // Check file metadata
      const { data: file, error } = await supabase
        .from('file_metadata')
        .select('owner_id, linked_user_id, is_public')
        .eq('id', fileId)
        .single();

      if (error || !file) return false;

      // Public files are viewable by all authenticated users
      if (file.is_public) return true;

      // Users can view their own files
      if (file.owner_id === userId) return true;

      // Users can view files linked to them
      if (file.linked_user_id === userId) return true;

      return false;
    } catch (error) {
      console.error('Error checking view permission:', error);
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
      console.error('Error checking edit permission:', error);
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
      console.error('Error checking delete permission:', error);
      return false;
    }
  };

  /**
   * Check if current user is admin
   */
  const checkIsAdmin = (): boolean => {
    return isAdmin;
  };

  return {
    canUpload,
    canView,
    canEdit,
    canDelete,
    isAdmin: checkIsAdmin,
  };
};
