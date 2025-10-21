/**
 * Slot-related Type Definitions
 * Extracted from main types file for better organization
 */

// ===== SLOT TYPES =====
export interface CraneOperator {
  id: string;
  name: string;
  email: string;
}

export interface SlotMember {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
}

export interface Slot {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:mm format
  duration: 15 | 30 | 45 | 60; // Duration in minutes - now supports 15-minute mini-slots
  craneOperator: CraneOperator;
  memberId?: string;
  memberName?: string;
  member?: SlotMember; // Legacy field
  bookedBy?: string; // Legacy field for simple display
  isBooked: boolean;
  notes?: string;
  blockId?: string; // ID für zusammengehörige Slots in einem Block
  // New mini-slot properties
  isMiniSlot?: boolean; // True if this is a 15-minute mini-slot
  miniSlotCount?: number; // Number of consecutive 15-min slots (1-4)
  startMinute?: 0 | 15 | 30 | 45; // Starting minute within the hour
}

export type SlotStatus = 'available' | 'booked' | 'blocked';

export interface SlotFormData {
  date: Date | undefined;
  time: string;
  duration: 15 | 30 | 45 | 60;
  craneOperatorId: string;
  notes?: string;
  memberName?: string;
  memberEmail?: string;
  memberNumber?: string;
  isBooked?: boolean;
  isSlotBlock?: boolean;
  slotCount?: number;
  // New mini-slot properties
  isMiniSlot?: boolean;
  miniSlotCount?: number; // 1-4 mini-slots per booking
}

// ===== API TYPES =====
export interface CreateSlotRequest {
  date: string;
  time: string;
  duration: 15 | 30 | 45 | 60;
  craneOperatorId: string;
  notes?: string;
  isMiniSlot?: boolean;
  miniSlotCount?: number;
}

export interface UpdateSlotRequest {
  date?: string;
  time?: string;
  duration?: 15 | 30 | 45 | 60;
  craneOperatorId?: string;
  notes?: string;
  isMiniSlot?: boolean;
  miniSlotCount?: number;
}

export interface BookSlotRequest {
  slotId: string;
  memberId: string;
  memberName: string;
}

// ===== CONTEXT TYPES =====
export interface ConsecutiveSlotsContextType {
  consecutiveSlotsEnabled: boolean;
  setConsecutiveSlotsEnabled: (enabled: boolean) => void;
  validateConsecutiveSlots: (
    newSlot: { date: string; time: string; duration: number; craneOperatorId: string },
    existingSlots: Slot[],
    excludeSlotId?: string
  ) => { isValid: boolean; message?: string };
  getSlotBlocks: (slots: Slot[]) => Slot[][];
  getSlotStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  isSlotBookable: (slot: Slot, allSlots: Slot[]) => boolean;
}

// ===== CALENDAR TYPES =====
export interface MonthCalendarProps {
  onDayClick: (date: Date) => void;
  onSlotCreate?: (dateTime?: { date: string; time: string }) => void;
}

export interface WeekCalendarProps {
  onSlotEdit: (slot?: Slot, dateTime?: { date: string; time: string }) => void;
  selectedDate?: Date;
  viewMode?: "day" | "week";
}

export interface DayStats {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  blockedSlots: number;
}

export interface SlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: Slot | null;
  onSave?: (slotData: SlotFormData, slotId?: string) => void;
  defaultDate?: string;
  defaultTime?: string;
  prefilledDateTime?: { date: string; time: string } | null;
  onClose: (navigateToDate?: Date) => void;
}