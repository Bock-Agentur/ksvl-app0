import { SlotCard, SlotAction } from "@/components/slots";
import { useSlotViewModel } from "@/hooks";
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
  
  // Map to SlotViewModel
  const slotViewModel = mapSlot(slot, allSlots);

  // Handle actions from SlotCard
  const handleAction = (action: SlotAction) => {
    switch (action) {
      case 'details':
        onShowDetails(slot);
        break;
      case 'edit':
        onEdit(slot);
        break;
      case 'delete':
        onDelete(slot.id);
        break;
      case 'cancel':
        onCancel(slot.id);
        break;
    }
  };

  return (
    <SlotCard
      slot={slotViewModel}
      variant="list"
      onAction={handleAction}
      showActions
    />
  );
}
