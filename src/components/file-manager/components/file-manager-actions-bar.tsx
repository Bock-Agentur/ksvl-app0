/**
 * FileManagerActionsBar Component
 * 
 * Displays bulk actions when files are selected in multi-select mode.
 */

import { Button } from "@/components/ui/button";
import { Shield, Trash2 } from "lucide-react";

interface FileManagerActionsBarProps {
  selectedCount: number;
  isAdmin: boolean;
  onBulkPermissions: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function FileManagerActionsBar({
  selectedCount,
  isAdmin,
  onBulkPermissions,
  onBulkDelete,
  onClearSelection,
}: FileManagerActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-[60px] sm:top-[180px] z-10 bg-primary text-primary-foreground p-3 rounded-lg flex items-center justify-between shadow-lg">
      <span className="text-sm font-medium">{selectedCount} ausgewählt</span>
      <div className="flex gap-1 sm:gap-2">
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={onBulkPermissions} className="px-2 sm:px-3">
            <Shield className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Berechtigungen</span>
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onBulkDelete} className="px-2 sm:px-3">
          <Trash2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Löschen</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onClearSelection} className="px-2 sm:px-3">
          <span className="hidden sm:inline">Abbrechen</span>
          <span className="sm:hidden">×</span>
        </Button>
      </div>
    </div>
  );
}