import { useState } from "react";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface BulkPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onApply: (roles: string[]) => Promise<void>;
}

const AVAILABLE_ROLES = [
  { value: "mitglied", label: "Mitglied" },
  { value: "kranfuehrer", label: "Kranführer" },
  { value: "vorstand", label: "Vorstand" },
  { value: "admin", label: "Admin" },
];

export function BulkPermissionsDialog({
  open,
  onOpenChange,
  selectedCount,
  onApply,
}: BulkPermissionsDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedRoles);
      onOpenChange(false);
      setSelectedRoles([]);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Berechtigungen für {selectedCount} Dateien zuweisen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie die Rollen aus, die Zugriff auf die ausgewählten Dateien erhalten sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.value}`}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => handleRoleToggle(role.value)}
                />
                <Label
                  htmlFor={`role-${role.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {role.label}
                </Label>
              </div>
            ))}
          </div>

          {selectedRoles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Hinweis: Wenn keine Rollen ausgewählt sind, werden die Berechtigungen für die ausgewählten Dateien entfernt.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Abbrechen
          </Button>
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? "Wird angewendet..." : "Anwenden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
