/**
 * File Card Component
 * 
 * Wrapper that renders the appropriate variant based on viewMode.
 * Logic extracted to file-card-shared.tsx for reusability.
 * 
 * Refactored from ~430 LOC to ~30 LOC by splitting into:
 * - file-card-shared.tsx (shared logic, hooks, utilities)
 * - file-card-list.tsx (list view rendering)
 * - file-card-grid.tsx (grid view rendering)
 */

import { FileMetadata } from "@/hooks";
import { FileCardList } from "./components/file-card-list";
import { FileCardGrid } from "./components/file-card-grid";

interface FileCardProps {
  file: FileMetadata;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  multiSelectActive: boolean;
}

export function FileCard({
  file,
  viewMode,
  isSelected,
  onSelect,
  onView,
  multiSelectActive,
}: FileCardProps) {
  const baseProps = {
    file,
    isSelected,
    onSelect,
    onView,
    multiSelectActive,
  };

  if (viewMode === 'list') {
    return <FileCardList {...baseProps} />;
  }

  return <FileCardGrid {...baseProps} />;
}
