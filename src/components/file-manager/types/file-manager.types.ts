// Central type definitions for file manager module

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

export interface FileFilters {
  category?: string;
  file_type?: string;
  tags?: string[];
  linked_user_id?: string;
  date_from?: string;
  date_to?: string;
  owner_id?: string;
}

export type SortBy = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface FileCardProps {
  file: FileMetadata;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  multiSelectActive: boolean;
}

export interface FileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface FileUploadDrawerProps extends FileDrawerProps {
  preselectedCategory?: 'login_media' | 'user_document' | 'general' | 'shared';
  preselectedUserId?: string;
}

export interface FileDetailDrawerProps extends FileDrawerProps {
  fileId: string | null;
}

export interface FileSelectorDrawerProps extends FileDrawerProps {
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
