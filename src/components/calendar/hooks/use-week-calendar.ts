/**
 * useWeekCalendar Hook
 * Shared logic and state management for WeekCalendar component
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, parseISO, getWeek } from "date-fns";
import { de } from "date-fns/locale";
import { Slot, SlotStatus } from "@/types";
import { usePermissions, useToast, useConsecutiveSlots, useSlotDesign } from "@/hooks";
import { useSlotsContext } from "@/contexts/slots-context";

interface UseWeekCalendarProps {
  selectedDate?: Date;
  selectedDay?: Date;
  propSlots?: Slot[];
  propIsLoading?: boolean;
  onSlotEdit: (slot?: Slot, dateTime?: { date: string; time: string }, mode?: 'book' | 'manage') => void;
}

export function useWeekCalendar({
  selectedDate,
  selectedDay: propSelectedDay,
  propSlots,
  propIsLoading,
  onSlotEdit,
}: UseWeekCalendarProps) {
  const { toast } = useToast();
  const { canManageSlots, canBookSlots, currentRole, currentUser } = usePermissions();
  const context = useSlotsContext();
  const { deleteSlot, updateSlot } = context;
  
  // Use props if provided, otherwise fall back to context
  const slots = propSlots ?? context.slots;
  const isLoading = propIsLoading ?? context.isLoading;
  
  const { consecutiveSlotsEnabled, getSlotBlocks, getSlotStatus } = useConsecutiveSlots();
  const { settings } = useSlotDesign();
  
  const [currentWeek, setCurrentWeek] = useState(selectedDate || new Date());
  const [selectedDay, setSelectedDay] = useState(propSelectedDay || selectedDate || new Date());
  
  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<Slot | null>(null);

  // Synchronize with props when they change
  useEffect(() => {
    if (selectedDate) {
      setCurrentWeek(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (propSelectedDay) {
      setSelectedDay(propSelectedDay);
    }
  }, [propSelectedDay]);

  // Helper function to get slot colors based on current design
  const getSlotColors = useCallback((status: SlotStatus) => {
    return settings[status];
  }, [settings]);

  // Calculate week boundaries
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Generate 15-minute intervals from 6:00 to 21:00 (15 hours * 4 = 60 intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 21; hour++) {
      for (let minute = 0; minute <= 45; minute += 15) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  }, []);

  // Filter slots for current week
  const weekSlots = useMemo(() => {
    const filtered = slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return weekDays.some(day => isSameDay(day, slotDate));
    });
    return [...filtered];
  }, [slots, weekDays]);

  // Get slots for selected day (mobile/day view)
  const selectedDaySlots = useMemo(() => {
    return weekSlots
      .filter(slot => {
        const slotDate = parseISO(slot.date);
        return isSameDay(selectedDay, slotDate);
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [weekSlots, selectedDay]);

  // Get mini-slots for a specific day, hour and minute interval
  const getMiniSlotsForDayHourMinute = useCallback((day: Date, hour: number, minute: number) => {
    return weekSlots.filter(slot => {
      const slotDate = parseISO(slot.date);
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      
      if (!isSameDay(day, slotDate) || slotHour !== hour) {
        return false;
      }
      
      if (slotMinute === minute) {
        return true;
      }
      
      const slotStartMinute = slotMinute;
      const slotEndMinute = slotMinute + slot.duration;
      return minute >= slotStartMinute && minute < slotEndMinute;
    });
  }, [weekSlots]);

  // Check if a specific 15-minute slot is available
  const isMiniSlotAvailable = useCallback((day: Date, hour: number, minute: number) => {
    const existingSlots = getMiniSlotsForDayHourMinute(day, hour, minute);
    if (existingSlots.length > 0) return false;
    
    const daySlots = weekSlots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return isSameDay(day, slotDate);
    });
    
    return !daySlots.some(slot => {
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      if (slotHour !== hour) return false;
      
      if (slot.isMiniSlot && slot.duration === 15) {
        return slotMinute === minute;
      }
      
      if (!slot.isMiniSlot && slotMinute === 0) {
        const slotEndMinute = slotMinute + slot.duration;
        return minute >= slotMinute && minute < slotEndMinute;
      }
      
      return false;
    });
  }, [weekSlots, getMiniSlotsForDayHourMinute]);

  // Helper function to check if a day has any slots
  const dayHasSlots = useCallback((day: Date) => {
    return weekSlots.some(slot => {
      const slotDate = parseISO(slot.date);
      return isSameDay(day, slotDate);
    });
  }, [weekSlots]);

  // Navigation handlers
  const handlePreviousWeek = useCallback(() => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  }, []);

  const formatWeekRange = useCallback(() => {
    const start = format(weekStart, "dd.", { locale: de });
    const end = format(addDays(weekStart, 6), "dd. MMMM yyyy", { locale: de });
    return `${start} - ${end}`;
  }, [weekStart]);

  const getWeekNumber = useCallback(() => {
    return getWeek(weekStart, { weekStartsOn: 1 });
  }, [weekStart]);

  // Slot action handlers
  const handleDeleteSlot = useCallback((slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot?.isBooked) {
      toast({
        title: "Fehler",
        description: "Gebuchte Slots können nicht gelöscht werden.",
        variant: "destructive"
      });
      return;
    }

    deleteSlot(slotId);
    toast({
      title: "Slot gelöscht",
      description: "Der Slot wurde erfolgreich gelöscht."
    });
  }, [slots, deleteSlot, toast]);

  const handleCancelSlot = useCallback((slot: Slot) => {
    setSelectedSlotForAction(slot);
    setCancelDialogOpen(true);
  }, []);

  const handleDeleteSlotConfirm = useCallback((slot: Slot) => {
    setSelectedSlotForAction(slot);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedSlotForAction) {
      handleDeleteSlot(selectedSlotForAction.id);
      setDeleteDialogOpen(false);
      setSelectedSlotForAction(null);
    }
  }, [selectedSlotForAction, handleDeleteSlot]);

  const confirmCancel = useCallback(() => {
    if (selectedSlotForAction) {
      updateSlot(selectedSlotForAction.id, {
        isBooked: false,
        memberId: undefined,
        memberName: undefined
      });
      toast({
        title: "Slot storniert",
        description: "Der Slot wurde erfolgreich storniert."
      });
      setCancelDialogOpen(false);
      setSelectedSlotForAction(null);
    }
  }, [selectedSlotForAction, updateSlot, toast]);

  const handleHourClick = useCallback((day: Date, hour: number, minute?: number) => {
    if (!canManageSlots) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur Kranführer und Administratoren können neue Slots erstellen.",
        variant: "destructive"
      });
      return;
    }
    
    const timeString = minute !== undefined 
      ? `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      : `${hour.toString().padStart(2, '0')}:00`;
    
    if (minute !== undefined) {
      const existingMiniSlots = getMiniSlotsForDayHourMinute(day, hour, minute);
      if (existingMiniSlots.length > 0) {
        toast({
          title: "Zeitraum bereits belegt",
          description: "Zu dieser Zeit ist bereits ein Slot vergeben.",
          variant: "destructive"
        });
        return;
      }
    }
    
    const dateString = format(day, 'yyyy-MM-dd');
    onSlotEdit(undefined, { date: dateString, time: timeString });
  }, [canManageSlots, getMiniSlotsForDayHourMinute, onSlotEdit, toast]);

  // DayViewContent handlers
  const handleDayViewSlotClick = useCallback((slot: Slot) => {
    if (slot.isBooked && (canManageSlots || slot.bookedBy === currentRole)) {
      onSlotEdit(slot);
    } else if (!slot.isBooked && canBookSlots) {
      onSlotEdit(slot);
    }
  }, [canManageSlots, canBookSlots, currentRole, onSlotEdit]);

  const handleCreateSlot = useCallback((date: string, time: string) => {
    onSlotEdit(undefined, { date, time });
  }, [onSlotEdit]);

  const handleDayViewSlotEdit = useCallback((slot: Slot, mode?: 'book' | 'manage') => {
    onSlotEdit(slot, undefined, mode);
  }, [onSlotEdit]);

  const handleBlockedSlotToast = useCallback(() => {
    toast({
      title: "Slot nicht buchbar",
      description: "In Slot-Blöcken können nur aufeinanderfolgende Slots von oben nach unten gebucht werden.",
      variant: "destructive"
    });
  }, [toast]);

  return {
    // State
    currentWeek,
    selectedDay,
    deleteDialogOpen,
    cancelDialogOpen,
    setDeleteDialogOpen,
    setCancelDialogOpen,
    
    // Data
    slots,
    isLoading,
    weekSlots,
    selectedDaySlots,
    weekDays,
    weekStart,
    timeSlots,
    
    // Permissions
    canManageSlots,
    canBookSlots,
    currentRole,
    currentUser,
    
    // Settings
    getSlotStatus,
    getSlotColors,
    
    // Helpers
    getMiniSlotsForDayHourMinute,
    isMiniSlotAvailable,
    dayHasSlots,
    formatWeekRange,
    getWeekNumber,
    
    // Handlers
    handlePreviousWeek,
    handleNextWeek,
    handleHourClick,
    handleCancelSlot,
    handleDeleteSlotConfirm,
    confirmDelete,
    confirmCancel,
    handleDayViewSlotClick,
    handleCreateSlot,
    handleDayViewSlotEdit,
    handleBlockedSlotToast,
  };
}
