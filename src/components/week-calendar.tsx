import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, addMinutes, getWeek } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { usePermissions, useRole, useToast, useConsecutiveSlots, useSlotDesign, STATUS_LABELS, formatDuration } from "@/hooks";
import { Slot, WeekCalendarProps } from "@/types";
import { useSlotsContext } from "@/contexts/slots-context";
import { StatusLabel } from "@/components/ui/status-label";
import { cn } from "@/lib/utils";
import { CalendarErrorBoundary } from "@/components/common/error-boundary";
import { DayViewContent } from "@/components/calendar/day-view-content";

// WeekCalendarProps is now imported from @/types

export function WeekCalendar({ onSlotEdit, selectedDate, selectedDay: propSelectedDay, viewMode = "week" }: WeekCalendarProps) {
  return (
    <CalendarErrorBoundary>
      <WeekCalendarContent onSlotEdit={onSlotEdit} selectedDate={selectedDate} selectedDay={propSelectedDay} viewMode={viewMode} />
    </CalendarErrorBoundary>
  );
}

function WeekCalendarContent({ onSlotEdit, selectedDate, selectedDay: propSelectedDay, viewMode = "week", slots: propSlots, isLoading: propIsLoading }: WeekCalendarProps) {
  const { toast } = useToast();
  const { canManageSlots, canBookSlots, currentRole, currentUser } = usePermissions();
  const context = useSlotsContext();
  const { deleteSlot, updateSlot } = context;
  
  // Use props if provided, otherwise fall back to context
  const slots = propSlots ?? context.slots;
  const isLoading = propIsLoading ?? context.isLoading;
  
  const { consecutiveSlotsEnabled, getSlotBlocks, getSlotStatus, isSlotBookable } = useConsecutiveSlots();
  const { settings } = useSlotDesign();
  const [currentWeek, setCurrentWeek] = useState(selectedDate || new Date());
  const [selectedDay, setSelectedDay] = useState(propSelectedDay || selectedDate || new Date());
  
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
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<Slot | null>(null);

  // Helper function to get slot colors based on current design
  const getSlotColors = (status: 'available' | 'booked' | 'blocked') => {
    return settings[status];
  };

  // Calculate week boundaries
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

  // Filter slots for current week - CRITICAL: Must re-compute when slots change
  const weekSlots = useMemo(() => {
    const filtered = slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      const isInWeek = weekDays.some(day => isSameDay(day, slotDate));
      return isInWeek;
    });
    
    // Force a new array reference to ensure React detects the change
    return [...filtered];
  }, [slots, weekDays, weekStart]);

  // Helper function to detect if a slot is part of a consecutive block
  const isSlotInBlock = (slot: Slot, allSlots: Slot[]) => {
    if (!consecutiveSlotsEnabled) return false;
    const blocks = getSlotBlocks(allSlots);
    return blocks.some(block => block.some(s => s.id === slot.id));
  };

  // Get slots for a specific day and hour - now supports mini-slots
  const getSlotsForDayAndHour = (day: Date, hour: number) => {
    const daySlots = weekSlots.filter(slot => {
      const slotDate = parseISO(slot.date);
      const slotHour = parseInt(slot.time.split(':')[0]);
      const matches = isSameDay(day, slotDate) && slotHour === hour;
      return matches;
    });
    
    return daySlots;
  };

  // Get mini-slots for a specific day, hour and minute interval (0, 15, 30, 45)
  const getMiniSlotsForDayHourMinute = (day: Date, hour: number, minute: number) => {
    return weekSlots.filter(slot => {
      const slotDate = parseISO(slot.date);
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      
      if (!isSameDay(day, slotDate) || slotHour !== hour) {
        return false;
      }
      
      // Check exact time match for ANY slot (not just mini-slots)
      if (slotMinute === minute) {
        return true;
      }
      
      // For slots that don't start at this exact minute, check if they cover this time interval
      const slotStartMinute = slotMinute;
      const slotEndMinute = slotMinute + slot.duration;
      const matches = minute >= slotStartMinute && minute < slotEndMinute;
      
      return matches;
    });
  };

  // Check if a specific 15-minute slot is available (not covered by any existing slot)
  const isMiniSlotAvailable = (day: Date, hour: number, minute: number) => {
    // Check if this exact time already has a slot
    const existingSlots = getMiniSlotsForDayHourMinute(day, hour, minute);
    if (existingSlots.length > 0) return false;
    
    // Check if this time is already covered by any existing slot in the same day
    const daySlots = weekSlots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return isSameDay(day, slotDate);
    });
    
    return !daySlots.some(slot => {
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      
      // Skip if different hour
      if (slotHour !== hour) return false;
      
      // For mini-slots, check exact overlap
      if (slot.isMiniSlot && slot.duration === 15) {
        return slotMinute === minute;
      }
      
      // For regular slots, check if they cover this minute interval
      if (!slot.isMiniSlot && slotMinute === 0) {
        const slotEndMinute = slotMinute + slot.duration;
        return minute >= slotMinute && minute < slotEndMinute;
      }
      
      return false;
    });
  };

  // Get slots for selected day (mobile)
  const selectedDaySlots = useMemo(() => {
    return weekSlots
      .filter(slot => {
        const slotDate = parseISO(slot.date);
        return isSameDay(selectedDay, slotDate);
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [weekSlots, selectedDay]);

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleDeleteSlot = (slotId: string) => {
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
  };

  const handleCancelSlot = (slot: Slot) => {
    setSelectedSlotForAction(slot);
    setCancelDialogOpen(true);
  };

  const handleDeleteSlotConfirm = (slot: Slot) => {
    setSelectedSlotForAction(slot);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSlotForAction) {
      handleDeleteSlot(selectedSlotForAction.id);
      setDeleteDialogOpen(false);
      setSelectedSlotForAction(null);
    }
  };

  const confirmCancel = () => {
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
  };

  const handleHourClick = (day: Date, hour: number, minute?: number) => {
    if (!canManageSlots) {
      toast({
        title: "Keine Berechtigung",
        description: "Nur Kranführer und Administratoren können neue Slots erstellen. Wechseln Sie Ihre Rolle im Menü oben rechts.",
        variant: "destructive"
      });
      return;
    }
    
    // Create time string based on minute parameter (for mini-slots)
    const timeString = minute !== undefined 
      ? `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      : `${hour.toString().padStart(2, '0')}:00`;
    
    // Check if there's already a slot at this exact time for mini-slots
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
    } else {
      // Check if there's already a slot at this hour for regular slots
      const existingSlots = getSlotsForDayAndHour(day, hour);
      if (existingSlots.length > 0) {
        toast({
          title: "Stunde bereits belegt",
          description: "Zu dieser Stunde ist bereits ein Slot vergeben. Pro Stunde ist nur ein Slot möglich.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Create new slot for this time
    const dateString = format(day, 'yyyy-MM-dd');
    onSlotEdit(undefined, { date: dateString, time: timeString });
  };

  const formatWeekRange = () => {
    const start = format(weekStart, "dd.", { locale: de });
    const end = format(addDays(weekStart, 6), "dd. MMMM yyyy", { locale: de });
    const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
    return `${start} - ${end}`;
  };

  const getWeekNumber = () => {
    return getWeek(weekStart, { weekStartsOn: 1 });
  };

  // Helper function to check if a day has any slots
  const dayHasSlots = (day: Date) => {
    return weekSlots.some(slot => {
      const slotDate = parseISO(slot.date);
      return isSameDay(day, slotDate);
    });
  };

  // Handler for DayViewContent - slot click
  const handleDayViewSlotClick = useCallback((slot: Slot) => {
    if (slot.isBooked && (canManageSlots || slot.bookedBy === currentRole)) {
      onSlotEdit(slot);
    } else if (!slot.isBooked && canBookSlots) {
      onSlotEdit(slot);
    }
  }, [canManageSlots, canBookSlots, currentRole, onSlotEdit]);

  // Handler for DayViewContent - create slot
  const handleCreateSlot = useCallback((date: string, time: string) => {
    onSlotEdit(undefined, { date, time });
  }, [onSlotEdit]);

  // Handler for DayViewContent - blocked slot toast
  const handleBlockedSlotToast = useCallback(() => {
    toast({
      title: "Slot nicht buchbar",
      description: "In Slot-Blöcken können nur aufeinanderfolgende Slots von oben nach unten gebucht werden.",
      variant: "destructive"
    });
  }, [toast]);

  return (
    <div className="w-full space-y-4">

      {/* Desktop Calendar View - Week or Day Calendar */}
      <div className="hidden md:block">
        {viewMode === "week" ? (
          <div className="border rounded-lg overflow-hidden bg-background">
          {/* Calendar Header - Sticky */}
          <div className="sticky top-0 z-10 grid grid-cols-7 bg-muted/30 backdrop-blur-sm border-b">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="p-2 sm:p-3 border-r last:border-r-0 text-center min-w-0 relative">
                <div className="text-xs font-medium text-muted-foreground truncate">
                  {format(day, "EEE", { locale: de })}
                </div>
                <div className="text-sm sm:text-lg font-semibold truncate">
                  {format(day, "dd.MM", { locale: de })}
                </div>
                {/* Day indicator dot */}
                <div className="absolute top-1 right-1">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      dayHasSlots(day) 
                        ? "bg-pink-500" 
                        : "bg-white border border-gray-300"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Grid - Card-based Slots */}
          <div className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto">
            <div className="grid grid-cols-7 gap-1.5 p-4 min-w-[700px]">
              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => (
                <div key={`day-${dayIndex}`} className="space-y-2">
                  {timeSlots.map(({ hour, minute }) => {
                    const miniSlots = getMiniSlotsForDayHourMinute(day, hour, minute);
                    const isAvailable = isMiniSlotAvailable(day, hour, minute);
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    
                    // Don't render if not available (covered by existing slot) and no existing slot at this exact time
                    if (!isAvailable && miniSlots.length === 0) {
                      return (
                        <div 
                          key={`${dayIndex}-${hour}-${minute}`} 
                          className="h-[80px]"
                        >
                          {/* Empty - time covered by existing slot */}
                        </div>
                      );
                    }
                    
                    return (
                      <div 
                        key={`${dayIndex}-${hour}-${minute}`} 
                        className="h-[80px]"
                      >
                        {miniSlots.length > 0 ? (
                          // Show existing mini-slot as card
                          <div className="h-full">
                            {miniSlots.map((slot) => {
                              const slotStatus = getSlotStatus(slot, weekSlots);
                              const isBookable = slotStatus === 'available';
                              
                              return (
                                 <Card
                                   key={slot.id}
                                   className={cn(
                                       "h-full p-3 cursor-pointer transition-all hover:shadow-md rounded-lg",
                                      !isBookable && !slot.isBooked ? "opacity-60 cursor-not-allowed" : ""
                                   )}
                                   style={{
                                     backgroundColor: getSlotColors(slotStatus).background,
                                     borderColor: getSlotColors(slotStatus).border
                                   }}
                                   onClick={(e) => {
                                    e.stopPropagation();
                                    if (slotStatus === 'blocked') {
                                      toast({
                                        title: "Slot nicht buchbar",
                                        description: "In Slot-Blöcken können nur aufeinanderfolgende Slots von oben nach unten gebucht werden.",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    if (slot.isBooked && (canManageSlots || slot.bookedBy === currentRole)) {
                                      onSlotEdit(slot);
                                    } else if (!slot.isBooked && canBookSlots) {
                                      onSlotEdit(slot);
                                    }
                                  }}
                                >
                                    {/* Crane Operator */}
                                    <div className="truncate text-xs font-medium leading-tight" style={{ color: getSlotColors(slotStatus).text }}>
                                      {slot.craneOperator.name}
                                    </div>
                                    {/* Member Info if booked */}
                                    {slot.isBooked && (slot.memberName || slot.member) && (
                                      <div className="truncate text-xs opacity-90 leading-tight" style={{ color: getSlotColors(slotStatus).text }}>
                                        {slot.memberName || slot.member?.name}
                                      </div>
                                    )}
                                    {/* Duration - einheitliches Format */}
                                    <div className="text-xs opacity-75" style={{ color: getSlotColors(slotStatus).text }}>
                                      {slot.duration} Min.
                                    </div>
                                   {/* Status indicator */}
                                   <div 
                                     className="absolute top-2 right-2 w-2 h-2 rounded-full opacity-75"
                                     style={{
                                       backgroundColor: getSlotColors(slotStatus).label
                                     }} 
                                   />
                                </Card>
                              );
                            })}
                          </div>
                        ) : isAvailable ? (
                          // Show empty slot card with dashed border
                          <Card 
                            className={cn(
                              "h-full border-2 border-dashed border-muted-foreground/20 transition-all rounded-lg",
                              canManageSlots ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:shadow-md" : "cursor-default"
                            )}
                            onClick={() => {
                              if (canManageSlots) {
                                handleHourClick(day, hour, minute);
                              }
                            }}
                          >
                            <div className="h-full flex flex-col items-center justify-center gap-1 p-2">
                              {canManageSlots && (
                                <>
                                  <Plus className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground text-center leading-tight">
                                    Slot für {timeString}
                                  </span>
                                </>
                              )}
                            </div>
                          </Card>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        ) : (
          /* Desktop Day View - Uses shared DayViewContent component */
          <Card className="card-maritime-hero">
            <CardHeader className="pb-2" />
            <CardContent className="space-y-2">
              <DayViewContent
                selectedDay={selectedDay}
                selectedDaySlots={selectedDaySlots}
                allSlots={weekSlots}
                getSlotStatus={getSlotStatus}
                getSlotColors={getSlotColors}
                canManageSlots={canManageSlots}
                canBookSlots={canBookSlots}
                currentUserId={currentUser?.id}
                onSlotClick={handleDayViewSlotClick}
                onSlotEdit={onSlotEdit}
                onSlotCancel={handleCancelSlot}
                onSlotDelete={handleDeleteSlotConfirm}
                onCreateSlot={handleCreateSlot}
                onBlockedSlotClick={handleBlockedSlotToast}
                showHeader={true}
                variant="desktop"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tablet/Mobile Calendar View - Uses shared DayViewContent component */}
      <div className="md:hidden">
        <DayViewContent
          selectedDay={selectedDay}
          selectedDaySlots={selectedDaySlots}
          allSlots={weekSlots}
          getSlotStatus={getSlotStatus}
          getSlotColors={getSlotColors}
          canManageSlots={canManageSlots}
          canBookSlots={canBookSlots}
          currentUserId={currentUser?.id}
          onSlotClick={handleDayViewSlotClick}
          onSlotEdit={onSlotEdit}
          onSlotCancel={handleCancelSlot}
          onSlotDelete={handleDeleteSlotConfirm}
          onCreateSlot={handleCreateSlot}
          onBlockedSlotClick={handleBlockedSlotToast}
          showHeader={true}
          variant="mobile"
        />
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slot löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Slot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slot stornieren</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Slot wirklich stornieren? Der Slot wird wieder verfügbar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Stornieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}