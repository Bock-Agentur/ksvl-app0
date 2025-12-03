/**
 * SlotBookingActions Component
 * 
 * Displays action buttons for slot operations.
 * Used in SlotFormDialog for booking, canceling, editing, deleting slots.
 */
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2 } from "lucide-react";
import { Slot } from "@/types";

interface SlotBookingActionsProps {
  slot: Slot;
  canBookSlots: boolean;
  canManageSlots: boolean;
  currentUserId?: string;
  mode: 'book' | 'manage';
  onBook: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SlotBookingActions({
  slot,
  canBookSlots,
  canManageSlots,
  currentUserId,
  mode,
  onBook,
  onCancel,
  onEdit,
  onDelete,
  onClose
}: SlotBookingActionsProps) {
  const canCancelBooking = slot.isBooked && (
    (slot.memberId === currentUserId && canBookSlots) || canManageSlots
  );

  return (
    <div className="space-y-3">
      {/* Primary Actions */}
      <div className="grid grid-cols-1 gap-3">
        {!slot.isBooked && canBookSlots && (
          <Button onClick={onBook} size="lg" className="w-full">
            <BookOpen className="w-4 h-4 mr-2" />
            Slot buchen
          </Button>
        )}
        
        {/* Cancel button for members (own booked slots) or admins/kranfuehrer */}
        {canCancelBooking && (
          <Button onClick={onCancel} variant="outline" size="lg" className="w-full">
            Buchung stornieren
          </Button>
        )}
      </div>
      
      {/* Secondary Actions - only for admins/kranfuehrer and only in 'manage' mode */}
      {canManageSlots && mode === 'manage' && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onEdit} variant="outline">
            Bearbeiten
          </Button>
          <Button onClick={onDelete} variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
        </div>
      )}
      
      {/* Close Button */}
      <div className="flex justify-center pt-2">
        <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
          Schließen
        </Button>
      </div>
    </div>
  );
}
