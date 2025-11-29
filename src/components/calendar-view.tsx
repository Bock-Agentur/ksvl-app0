import { useState, useEffect, useMemo } from "react";
import { WeekCalendar } from "./week-calendar";
import { MonthCalendar } from "./month-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, CalendarDays, Home, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { SlotFormDialog } from "./slot-form-dialog";
import { Slot } from "@/types";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useSlotsContext } from "@/contexts/slots-context";
import { cn } from "@/lib/utils";
import { useStickyHeaderLayout } from "@/hooks/use-sticky-header-layout";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const { isPageSticky, isLoading: stickyLayoutLoading } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky('calendar');
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [prefilledDateTime, setPrefilledDateTime] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Calculate week boundaries
  const weekStart = startOfWeek(currentWeek, {
    weekStartsOn: 1
  }); // Monday
  const weekDays = Array.from({
    length: 7
  }, (_, i) => addDays(weekStart, i));

  // Filter slots for current week
  const weekSlots = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return weekDays.some(day => isSameDay(day, slotDate));
    });
  }, [slots, weekDays]);

  // Wenn ein initialDate übergeben wird, setze es als selectedDate und wechsle zur Tagesansicht
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      setSelectedDay(initialDate);
      setViewMode("day");
    }
  }, [initialDate]);
  
  const handleSlotEdit = (slot?: Slot, dateTime?: {
    date: string;
    time: string;
  }) => {
    setSelectedSlot(slot || null);
    setPrefilledDateTime(dateTime || null);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = (navigateToDate?: Date) => {
    setIsDialogOpen(false);
    setSelectedSlot(null);
    setPrefilledDateTime(null);

    // Wenn ein Datum übergeben wurde, navigiere dorthin
    if (navigateToDate) {
      setSelectedDate(navigateToDate);
      setViewMode("day"); // Wechsle zur Tagesansicht um den neuen Slot zu sehen
    }
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
  };

  // ✅ Show stable layout during sticky settings load to prevent layout shifts
  return (
    <div className={cn(
      "bg-background max-w-7xl mx-auto",
      // Use fixed layout class during loading to prevent shift
      stickyLayoutLoading ? "space-y-6" : (isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-6")
    )}>
      {/* Sticky Navigation Card with soft transparent shadow */}
      <div className={cn(
        "pt-4 pb-0 my-0 p-4",
        stickyLayoutLoading ? "" : (isStickyEnabled ? "flex-shrink-0 relative z-10" : "")
      )}>
        <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
          <CardHeader>
            <CardTitle>Kalender</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Week Navigation */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size={isMobile ? "icon" : "sm"}
                  onClick={handlePreviousWeek} 
                  title="Vorherige Woche"
                  className="h-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleToday} 
                  className="h-9 px-3"
                >
                  {isMobile ? <Home className="h-4 w-4" /> : "Heute"}
                </Button>
                <Button 
                  variant="outline" 
                  size={isMobile ? "icon" : "sm"}
                  onClick={handleNextWeek} 
                  title="Nächste Woche"
                  className="h-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* View Toggle Buttons */}
              <div className="flex gap-1">
                <Button 
                  variant={viewMode === "day" ? "default" : "outline"} 
                  size={isMobile ? "icon" : "sm"}
                  onClick={() => setViewMode("day")}
                  title="Tagesansicht"
                  className="h-9"
                >
                  <Calendar className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Tag</span>}
                </Button>
                <Button 
                  variant={viewMode === "week" ? "default" : "outline"} 
                  size={isMobile ? "icon" : "sm"}
                  onClick={() => setViewMode("week")}
                  title="Wochenansicht"
                  className="h-9"
                >
                  <CalendarDays className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Woche</span>}
                </Button>
                <Button 
                  variant={viewMode === "month" ? "default" : "outline"} 
                  size={isMobile ? "icon" : "sm"}
                  onClick={() => setViewMode("month")}
                  title="Monatsansicht"
                  className="h-9"
                >
                  <Home className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Monat</span>}
                </Button>
              </div>

              {/* Add Slot Button - Only for authorized users */}
              {canManageSlots && (
                <Button 
                  onClick={() => handleSlotEdit()} 
                  size={isMobile ? "icon" : "sm"}
                  title="Slot erstellen"
                  className="h-9"
                >
                  <Plus className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Erstellen</span>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Day Selector - Only for week/day views */}
      {(viewMode === "day" || viewMode === "week") && (
        <div className="md:hidden px-4">
          <div className="grid grid-cols-7 gap-1 w-full">
            {weekDays.map((day, index) => {
              // Check if this day has slots
              const daySlots = weekSlots.filter(slot => {
                const slotDate = parseISO(slot.date);
                return isSameDay(day, slotDate);
              });
              const hasSlots = daySlots.length > 0;
              return (
                <div key={index} className="relative">
                  <Button 
                    variant={isSameDay(day, selectedDay) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedDate(day);
                    }} 
                    className="text-xs px-1 py-2 h-auto flex-col w-full"
                  >
                    <div className="text-center">
                      <div className="text-xs">
                        {format(day, "EEE", { locale: de })}
                      </div>
                      <div className="font-semibold">
                        {format(day, "dd")}
                      </div>
                    </div>
                  </Button>
                  
                  {/* Day indicator below button */}
                  <div className="flex justify-center mt-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full border transition-colors", 
                      hasSlots ? "bg-pink-500 border-pink-500" : "bg-white border-gray-300"
                    )} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Day Selector - Only for day view */}
      {viewMode === "day" && (
        <div className="hidden md:block px-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              // Check if this day has slots
              const daySlots = weekSlots.filter(slot => {
                const slotDate = parseISO(slot.date);
                return isSameDay(day, slotDate);
              });
              const hasSlots = daySlots.length > 0;
              const isSelectedDay = isSameDay(day, selectedDay);
              return (
                <Button 
                  key={index} 
                  variant={isSelectedDay ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedDate(day);
                  }} 
                  className="relative flex flex-col h-auto py-3"
                >
                  <div className="text-xs mb-1">
                    {format(day, "EEE", { locale: de })}
                  </div>
                  <div className="text-base font-semibold">
                    {format(day, "dd")}
                  </div>
                  
                  {/* Day indicator */}
                  {hasSlots && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        isSelectedDay ? "bg-primary-foreground" : "bg-pink-500"
                      )} />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Content */}
      <div className={cn(
        "px-4",
        stickyLayoutLoading ? "" : (isStickyEnabled ? "flex-1 overflow-y-auto overflow-x-hidden pb-6" : "")
      )}>
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
      />
    </div>
  );
}