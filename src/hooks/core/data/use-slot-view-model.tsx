/**
 * useSlotViewModel Hook
 * Kombiniert useSlotDesign und useConsecutiveSlots für einfaches Slot-Mapping
 */

import { useMemo, useCallback } from "react";
import { Slot } from "@/types";
import { useSlotDesign } from "@/hooks/core/settings/use-slot-design";
import { useConsecutiveSlots } from "@/hooks/use-consecutive-slots";
import { 
  SlotViewModel, 
  mapSlotToViewModel, 
  mapSlotsToViewModels,
  MapSlotOptions,
  STATUS_LABELS,
  formatDuration,
  formatTime,
  formatDateShort,
  formatDateLong
} from "@/lib/slots/slot-view-model";

export interface UseSlotViewModelReturn {
  // Mapping-Funktionen
  mapSlot: (slot: Slot, allSlots: Slot[]) => SlotViewModel;
  mapSlots: (slots: Slot[], allSlots: Slot[]) => SlotViewModel[];
  
  // Design Settings
  settings: ReturnType<typeof useSlotDesign>['settings'];
  
  // Status-Logik
  getSlotStatus: ReturnType<typeof useConsecutiveSlots>['getSlotStatus'];
  
  // Utilities (re-exported)
  STATUS_LABELS: typeof STATUS_LABELS;
  formatDuration: typeof formatDuration;
  formatTime: typeof formatTime;
  formatDateShort: typeof formatDateShort;
  formatDateLong: typeof formatDateLong;
}

/**
 * Hook für Slot View Model Mapping
 * Cached die Mapping-Options für Performance
 */
export function useSlotViewModel(): UseSlotViewModelReturn {
  const { settings } = useSlotDesign();
  const { getSlotStatus } = useConsecutiveSlots();
  
  // Stable mapping function
  const mapSlot = useCallback((slot: Slot, allSlots: Slot[]): SlotViewModel => {
    const options: MapSlotOptions = {
      allSlots,
      getSlotStatus,
      slotDesignSettings: settings,
    };
    return mapSlotToViewModel(slot, options);
  }, [settings, getSlotStatus]);
  
  // Batch mapping function
  const mapSlots = useCallback((slots: Slot[], allSlots: Slot[]): SlotViewModel[] => {
    const options: MapSlotOptions = {
      allSlots,
      getSlotStatus,
      slotDesignSettings: settings,
    };
    return mapSlotsToViewModels(slots, options);
  }, [settings, getSlotStatus]);
  
  return {
    mapSlot,
    mapSlots,
    settings,
    getSlotStatus,
    STATUS_LABELS,
    formatDuration,
    formatTime,
    formatDateShort,
    formatDateLong,
  };
}
