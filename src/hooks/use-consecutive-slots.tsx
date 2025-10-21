import { createContext, useContext, ReactNode, useMemo } from "react";
import { parseISO, addMinutes } from "date-fns";
import { Slot, ConsecutiveSlotsContextType, SlotStatus } from "@/types";
import { useAppSettings } from "./use-app-settings";

const ConsecutiveSlotsContext = createContext<ConsecutiveSlotsContextType | undefined>(undefined);

export function ConsecutiveSlotsProvider({ children }: { children: ReactNode }) {
  const { value: consecutiveSlotsEnabled, setValue: setConsecutiveSlotsEnabled } = useAppSettings<boolean>(
    "consecutiveSlotsEnabled",
    true,
    true // Global
  );

  // Memoized slot blocks calculation - ALL slots of same crane operator on same day form a block
  const getSlotBlocks = useMemo(() => (slots: Slot[]) => {
    console.log('🔍 GET_SLOT_BLOCKS called with', slots.length, 'slots');
    
    if (!slots || slots.length === 0) {
      console.log('❌ No slots provided, returning empty blocks');
      return [];
    }

    // Group slots by crane operator and date - ALL slots of same operator on same day form ONE block
    const groupedSlots: { [key: string]: Slot[] } = {};
    
    slots.forEach(slot => {
      if (!slot || !slot.craneOperator || !slot.craneOperator.id) {
        console.warn('Invalid slot data:', slot);
        return;
      }
      
      const key = `${slot.craneOperator.id}-${slot.date}`;
      if (!groupedSlots[key]) {
        groupedSlots[key] = [];
      }
      groupedSlots[key].push(slot);
    });

    const blocks: Slot[][] = [];
    
    Object.values(groupedSlots).forEach(operatorSlots => {
      if (operatorSlots.length === 0) return;
      
      // Sort slots by time
      const sortedSlots = [...operatorSlots].sort((a, b) => {
        const timeA = parseISO(`${a.date}T${a.time}`);
        const timeB = parseISO(`${b.date}T${b.time}`);
        return timeA.getTime() - timeB.getTime();
      });

      // ALL slots of the same crane operator on the same day form ONE block
      console.log('📦 Found crane operator block with', sortedSlots.length, 'slots:', sortedSlots.map(s => `${s.time}(${s.id})`));
      blocks.push(sortedSlots);
    });
    
    console.log('🎯 FOUND', blocks.length, 'crane operator blocks total');
    console.log('📊 BLOCKS BREAKDOWN:', blocks.map(block => `Block with ${block.length} slots: ${block.map(s => s.time).join(', ')}`));
    
    return blocks;
  }, []);

  // Unified slot status logic - ALL slots of same crane operator form a block
  const getSlotStatus = (slot: Slot, allSlots: Slot[]): SlotStatus => {
    console.log('🎯 GET_SLOT_STATUS for slot:', slot.id, slot.time);
    
    // Safety checks
    if (!slot || !allSlots) {
      console.log('❌ Invalid input -> status: available');
      return 'available';
    }

    // If slot is booked, it's always "booked"
    if (slot.isBooked) {
      console.log('✅ Slot is booked -> status: booked');
      return 'booked';
    }

    // If consecutive slots is disabled, all unbooked slots are "available"
    if (!consecutiveSlotsEnabled) {
      console.log('⚪ Consecutive slots disabled -> status: available');
      return 'available';
    }

    // Get all slot blocks (ALL slots of same crane operator on same day)
    const blocks = getSlotBlocks(allSlots);
    const blockContainingSlot = blocks.find(block => 
      block.some(s => s.id === slot.id)
    );

    console.log('🔍 Slot block for', slot.id, ':', blockContainingSlot ? `Found block with ${blockContainingSlot.length} slots` : 'No block found');

    // If slot is not in any block, it's available (should not happen with new logic)
    if (!blockContainingSlot) {
      console.log('⚪ Not in block -> status: available');
      return 'available';
    }

    // Single slot in block (no other slots for this crane operator on this day)
    if (blockContainingSlot.length === 1) {
      console.log('⚪ Single slot in block -> status: available');
      return 'available';
    }

    // Multi-slot block: only slots can be booked from earliest time onwards without gaps
    const sortedBlock = [...blockContainingSlot].sort((a, b) => {
      const timeA = parseISO(`${a.date}T${a.time}`);
      const timeB = parseISO(`${b.date}T${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });

    // Find the position of current slot in the sorted block
    const slotIndex = sortedBlock.findIndex(s => s.id === slot.id);
    if (slotIndex === -1) {
      console.log('❌ Slot not found in block -> status: available');
      return 'available';
    }

    console.log('📍 Slot position in block:', slotIndex, 'of', sortedBlock.length);

    // Check if all previous slots in the block are booked (no gaps allowed)
    for (let i = 0; i < slotIndex; i++) {
      if (!sortedBlock[i].isBooked) {
        // There's an unbooked slot before this one, so this slot is blocked
        console.log('🔒 For crane operator blocks: Unbooked slot', sortedBlock[i].id, 'before current slot -> status: blocked');
        return 'blocked';
      }
    }

    // All previous slots are booked (or this is the first slot), so this slot is available
    console.log('🟢 All previous slots booked or first slot -> status: available');
    return 'available';
  };

  // Legacy function for backwards compatibility
  const isSlotBookable = (slot: Slot, allSlots: Slot[]) => {

    return getSlotStatus(slot, allSlots) === 'available';
  };

  const validateConsecutiveSlots = (
    newSlot: { date: string; time: string; duration: number; craneOperatorId: string },
    existingSlots: Slot[],
    excludeSlotId?: string
  ) => {
    if (!consecutiveSlotsEnabled) {
      return { isValid: true };
    }

    // Filter slots for same crane operator and same day, excluding the slot being edited
    const operatorSlots = existingSlots.filter(slot => 
      slot.craneOperator.id === newSlot.craneOperatorId &&
      slot.date === newSlot.date &&
      slot.id !== excludeSlotId
    );

    if (operatorSlots.length === 0) {
      return { isValid: true };
    }

    // Parse new slot times
    const newSlotStart = parseISO(`${newSlot.date}T${newSlot.time}`);
    const newSlotEnd = addMinutes(newSlotStart, newSlot.duration);


    // Create temporary slot for validation
    const tempSlot: Slot = {
      id: 'temp',
      date: newSlot.date,
      time: newSlot.time,
      duration: newSlot.duration as 30 | 45 | 60,
      craneOperator: { id: newSlot.craneOperatorId, name: '', email: '' },
      notes: '',
      isBooked: false
    };

    // Get all slots including the new one
    const allSlots = [...operatorSlots, tempSlot];
    const blocks = getSlotBlocks(allSlots);

    // Find which block the new slot would belong to
    const blockWithNewSlot = blocks.find(block => 
      block.some(slot => slot.id === 'temp')
    );

    if (!blockWithNewSlot) {
      // New slot doesn't create or join a block, it's valid
      return { isValid: true };
    }

    // Check if the new slot would create a gap in bookings within the block
    const sortedBlock = [...blockWithNewSlot].sort((a, b) => {
      const timeA = parseISO(`${a.date}T${a.time}`);
      const timeB = parseISO(`${b.date}T${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });

    // Find position of new slot in the block
    const newSlotIndex = sortedBlock.findIndex(slot => slot.id === 'temp');
    
    // Check if there are any booked slots after an unbooked slot in the block
    // (This prevents gaps - you can only book from top to bottom)
    let foundUnbooked = false;
    for (let i = 0; i < sortedBlock.length; i++) {
      const slot = sortedBlock[i];
      
      if (slot.id === 'temp') {
        // Skip the temporary slot in validation
        continue;
      }
      
      if (!slot.isBooked) {
        foundUnbooked = true;
      } else if (foundUnbooked) {
        // Found a booked slot after an unbooked one - this would create a gap
        return {
          isValid: false,
          message: "In Slot-Blöcken können nur aufeinanderfolgende Slots von oben nach unten gebucht werden. Es dürfen keine Lücken entstehen."
        };
      }
    }

    return { isValid: true };
  };

  return (
    <ConsecutiveSlotsContext.Provider value={{
      consecutiveSlotsEnabled,
      setConsecutiveSlotsEnabled,
      validateConsecutiveSlots,
      getSlotBlocks,
      getSlotStatus,
      isSlotBookable
    }}>
      {children}
    </ConsecutiveSlotsContext.Provider>
  );
}

export function useConsecutiveSlots() {
  const context = useContext(ConsecutiveSlotsContext);
  if (context === undefined) {
    throw new Error("useConsecutiveSlots must be used within a ConsecutiveSlotsProvider");
  }
  return context;
}