// File Manager Module - Central Export
export { EnhancedFileManager } from './enhanced-file-manager';
export { FileCard } from './file-card';

// Drawer Components
export { FileUploadDrawer } from './components/file-upload-drawer';
export { FileDetailDrawer } from './components/file-detail-drawer';
export { FileSelectorDrawer } from './components/file-selector-drawer';
export { FilePreview } from './components/file-preview';
export { BulkPermissionsDialog } from './components/bulk-permissions-dialog';
export { DeleteConfirmationDialog } from './components/delete-confirmation-dialog';

// Types
export type * from './types/file-manager.types';

// Legacy exports for backwards compatibility (use Drawer versions)
export { FileUploadDrawer as FileUploadDialog } from './components/file-upload-drawer';
export { FileSelectorDrawer as FileSelectorDialog } from './components/file-selector-drawer';
