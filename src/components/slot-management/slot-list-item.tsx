import { SlotCard, SlotAction } from "@/components/slots";
import { useSlotViewModel } from "@/hooks";
import { useRole } from "@/hooks";
import { Slot } from "@/types";

interface SlotListItemProps {
  slot: Slot;
  allSlots: Slot[];
  onEdit: (slot: Slot) => void;
  onDelete: (slotId: string) => void;
  onCancel: (slotId: string) => void;
  onShowDetails: (slot: Slot) => void;
}

export function SlotListItem({ slot, allSlots, onEdit, onDelete, onCancel, onShowDetails }: SlotListItemProps) {
  const { mapSlot } = useSlotViewModel();
  const { currentRole, currentUser } = useRole();
  
  // Map to SlotViewModel
  const slotViewModel = mapSlot(slot, allSlots);

  // Handle actions from SlotCard - neue Action-Types
  const handleAction = (action: SlotAction) => {
    switch (action) {
      case 'manage':
        // Öffnet den Verwaltungs-Drawer (ersetzt 'details' und 'edit')
        onEdit(slot);
        break;
      case 'delete':
        onDelete(slot.id);
        break;
      case 'cancel':
        onCancel(slot.id);
        break;
      case 'book':
        onEdit(slot);
        break;
    }
  };

  return (
    <SlotCard
      slot={slotViewModel}
      variant="list"
      onAction={handleAction}
      showActions
      userRole={currentRole}
      currentUserId={currentUser?.id}
    />
  );
}
