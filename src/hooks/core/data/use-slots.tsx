import { useSlotsContext } from '@/contexts/slots-context';
import { CraneOperator } from '@/types';

/**
 * CreateSlotData interface - exported for use by slots-context and other components
 */
export interface CreateSlotData {
  date: string;
  time: string;
  duration: number;
  craneOperator: CraneOperator;
  notes?: string;
  isBooked?: boolean;
  bookedBy?: string;
  blockId?: string;
}

/**
 * Bridge-Hook for slot data access
 * 
 * This hook provides backwards compatibility while internally using SlotsContext
 * as the single source of truth. All slot data and operations are delegated
 * to the context which uses React Query for caching and a single Realtime subscription.
 * 
 * Benefits:
 * - Single Realtime subscription (instead of duplicate)
 * - Unified React Query cache
 * - Consistent data across all consumers
 * - ~300 lines of code reduction
 */
export function useSlots(options?: { enabled?: boolean }) {
  const context = useSlotsContext();
  
  // The enabled option is handled by SlotsProvider internally
  // We still expose it for API compatibility but it's managed at context level
  
  return {
    slots: context.slots,
    isLoading: context.isLoading,
    addSlot: context.addSlot,
    addSlotBlock: context.addSlotBlock,
    updateSlot: context.updateSlot,
    deleteSlot: context.deleteSlot,
    bookSlot: context.bookSlot,
    cancelBooking: context.cancelBooking,
    refetchSlots: context.refetchSlots
  };
}

/**
 * Alias for backwards compatibility
 * @deprecated Use useSlots instead
 */
export const useSlotsData = useSlots;
