import { SlotCard, SlotAction } from "@/components/slots";
import { useSlotViewModel } from "@/hooks";
import { useRole } from "@/hooks";
import { Slot } from "@/types";

interface SlotListItemProps {
  slot: Slot;
  allSlots: Slot[];
  onEdit: (slot: Slot, mode?: 'book' | 'manage') => void;
  onDelete: (slotId: string) => void;
  onCancel: (slotId: string) => void;
  onShowDetails: (slot: Slot) => void;
}

export function SlotListItem({ slot, allSlots, onEdit, onDelete, onCancel, onShowDetails }: SlotListItemProps) {
  const { mapSlot } = useSlotViewModel();
  const { currentRole, currentUser } = useRole();
  
  // Map to SlotViewModel
  const slotViewModel = mapSlot(slot, allSlots);

  // Handle actions from SlotCard
  const handleAction = (action: SlotAction) => {
    switch (action) {
      case 'edit':
        // 'Verwalten' Button: Öffnet Drawer im manage-Modus
        onEdit(slot, 'manage');
        break;
      case 'delete':
        onDelete(slot.id);
        break;
      case 'cancel':
        onCancel(slot.id);
        break;
      case 'book':
        // 'Buchen' Button: Öffnet Drawer im book-Modus
        onEdit(slot, 'book');
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
