/**
 * Calendar View Component
 * 
 * Orchestrator for calendar display with multiple view modes.
 * Navigation extracted to CalendarNavigation component.
 */

import { useState, useEffect, useMemo } from "react";
import { WeekCalendar } from "./week-calendar";
import { MonthCalendar } from "./month-calendar";
import { SlotListView } from "./calendar/slot-list-view";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { usePermissions, useIsMobile } from "@/hooks";
import { SlotFormDialog } from "./slot-form-dialog";
import { Slot } from "@/types";
import { startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { useSlotsContext } from "@/contexts/slots-context";
import { cn } from "@/lib/utils";
import { CalendarNavigation, CalendarViewMode } from "./calendar/calendar-navigation";

interface CalendarViewProps {
  initialDate?: Date | null;
}

export function CalendarView({
  initialDate
}: CalendarViewProps) {
  const { canManageSlots, canBookSlots } = usePermissions();
  const {
    slots,
    isLoading: slotsLoading
  } = useSlotsContext();
  
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [prefilledDateTime, setPrefilledDateTime] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [dialogMode, setDialogMode] = useState<'book' | 'manage'>('book');
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Calculate week boundaries
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter slots for current week
  const weekSlots = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return weekDays.some(day => isSameDay(day, slotDate));
    });
  }, [slots, weekDays]);

  // Handle initial date from props
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      setSelectedDay(initialDate);
      setViewMode("day");
    }
  }, [initialDate]);
  
  const handleSlotEdit = (slot?: Slot, dateTime?: { date: string; time: string }, mode: 'book' | 'manage' = 'book') => {
    setSelectedSlot(slot || null);
    setPrefilledDateTime(dateTime || null);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = (navigateToDate?: Date) => {
    setIsDialogOpen(false);
    setSelectedSlot(null);
    setPrefilledDateTime(null);

    if (navigateToDate) {
      setSelectedDate(navigateToDate);
      setViewMode("day");
    }
  };

  const handleDialogOpen = (slot: Slot | null) => {
    setSelectedSlot(slot);
    setIsDialogOpen(true);
  };
  
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("week");
  };
  
  const handlePreviousWeek = () => {
    setCurrentWeek(prevWeek => {
      const newWeek = new Date(prevWeek);
      newWeek.setDate(newWeek.getDate() - 7);
      setSelectedDate(newWeek);
      return newWeek;
    });
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(prevWeek => {
      const newWeek = new Date(prevWeek);
      newWeek.setDate(newWeek.getDate() + 7);
      setSelectedDate(newWeek);
      return newWeek;
    });
  };
  
  const handleToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
    setSelectedDay(today);
  };

  const handleSelectedDayChange = (day: Date) => {
    setSelectedDay(day);
    setSelectedDate(day);
  };

  if (slotsLoading) {
    return (
      <div className="space-y-6">
        <div className="pt-4 pb-0 my-0 p-4">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/4 mb-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-32 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Card */}
      <div className="pt-4 pb-0 my-0 p-4">
        <CalendarNavigation
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedDay={selectedDay}
          onSelectedDayChange={handleSelectedDayChange}
          weekDays={weekDays}
          weekSlots={weekSlots}
          isMobile={isMobile}
          canManageSlots={canManageSlots}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          onCreateSlot={() => handleSlotEdit()}
        />
      </div>

      {/* Calendar Content */}
      <div className={viewMode !== "list" ? "px-4" : ""}>
        {(viewMode === "day" || viewMode === "week") && (
          <WeekCalendar 
            selectedDate={selectedDate} 
            onSlotEdit={handleSlotEdit} 
            viewMode={viewMode} 
            selectedDay={selectedDay}
            slots={slots}
            isLoading={slotsLoading}
          />
        )}
        {viewMode === "month" && (
          <MonthCalendar 
            onDayClick={handleDayClick}
            slots={slots}
            isLoading={slotsLoading}
          />
        )}
        {viewMode === "list" && canManageSlots && (
          <SlotListView 
            slots={slots}
            onSlotEdit={handleSlotEdit}
            onDialogOpen={handleDialogOpen}
          />
        )}
      </div>

      {/* Slot Form Dialog */}
      <SlotFormDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}
        onClose={handleDialogClose}
        slot={selectedSlot} 
        prefilledDateTime={prefilledDateTime}
        mode={dialogMode}
      />
    </div>
  );
}