import { useState, useEffect, useMemo } from "react";
import { WeekCalendar } from "./week-calendar";
import { MonthCalendar } from "./month-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, CalendarDays, Home, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { SlotFormDialog } from "./slot-form-dialog";
import { Slot } from "@/types";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { useSlots } from "@/hooks/use-slots";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  initialDate?: Date | null;
}

export function CalendarView({ initialDate }: CalendarViewProps) {
  const { currentRole, currentUser } = useRole();
  const { slots } = useSlots();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [prefilledDateTime, setPrefilledDateTime] = useState<{ date: string; time: string } | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Calculate week boundaries
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
      console.log("📅 CalendarView: Navigating to date from chatbot:", initialDate);
      setSelectedDate(initialDate);
      setSelectedDay(initialDate);
      setViewMode("day");
    }
  }, [initialDate]);

  const handleSlotEdit = (slot?: Slot, dateTime?: { date: string; time: string }) => {
    console.log('🎯 HANDLE_SLOT_EDIT called:', { slot: slot?.id, dateTime });
    setSelectedSlot(slot || null);
    setPrefilledDateTime(dateTime || null);
    setIsDialogOpen(true);
    console.log('📱 Dialog opened, state updated');
  };

  const handleDialogClose = (navigateToDate?: Date) => {
    console.log('🔄 Dialog closing, navigate to date:', navigateToDate);
    setIsDialogOpen(false);
    setSelectedSlot(null);
    setPrefilledDateTime(null);
    
    // Wenn ein Datum übergeben wurde, navigiere dorthin
    if (navigateToDate) {
      console.log('📅 Navigating to new date:', navigateToDate);
      setSelectedDate(navigateToDate);
      setViewMode("day"); // Wechsle zur Tagesansicht um den neuen Slot zu sehen
    }
  };


  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("week");
  };

  // FIXED: Multi-Role System - Admin, Vorstand und Kranführer können Slots verwalten
  const canManageSlots = currentUser?.roles?.includes("kranfuehrer") || 
                         currentUser?.roles?.includes("admin") ||
                         currentUser?.roles?.includes("vorstand") ||
                         currentRole === "kranfuehrer" || 
                         currentRole === "admin" ||
                         currentRole === "vorstand";
  const canBookSlots = currentUser?.roles?.includes("mitglied") || 
                       currentUser?.roles?.includes("kranfuehrer") || 
                       currentUser?.roles?.includes("admin") ||
                       currentUser?.roles?.includes("vorstand") ||
                       currentRole === "mitglied" || 
                       currentRole === "kranfuehrer" || 
                       currentRole === "admin" ||
                       currentRole === "vorstand";

  console.log('🔐 CALENDAR VIEW PERMISSIONS:', {
    currentUser: currentUser?.name,
    currentRole,
    userRoles: currentUser?.roles,
    canManageSlots,
    canBookSlots
  });

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Sticky Navigation Card with soft fade */}
      <div className="relative flex-shrink-0">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 mx-4 mt-4 mb-0 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle>Kalender</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Toggle - Responsive */}
          <div className="flex items-center justify-center gap-2">
            {/* Mobile: Only Day and Month */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Tagesansicht
              </Button>
              {/* Show Week button on tablet (md) but not mobile (sm) */}
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="hidden sm:flex items-center gap-2 lg:hidden"
              >
                <Calendar className="w-4 h-4" />
                Wochenansicht
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                Monatsansicht
              </Button>
            </div>

            {/* Desktop: All three buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Tagesansicht
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Wochenansicht
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                Monatsansicht
              </Button>
            </div>
          </div>

          {/* Week Navigation & Actions - Only for week/day views */}
          {(viewMode === "day" || viewMode === "week") && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousWeek}
                  className="flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-sm font-medium min-w-[140px] text-center">
                  KW {format(currentWeek, "w", { locale: de })} · {format(currentWeek, "yyyy", { locale: de })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleToday}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Heute
                </Button>
                {canManageSlots && (
                  <Button 
                    onClick={() => handleSlotEdit(undefined, { 
                      date: format(viewMode === "day" ? selectedDate : new Date(), 'yyyy-MM-dd'), 
                      time: "08:00" 
                    })}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Neuer Slot</span>
                    <span className="sm:hidden">Slot</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Mobile Day Selector - Only for week/day views */}
          {(viewMode === "day" || viewMode === "week") && (
            <div className="md:hidden">
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
                        <div 
                          className={cn(
                            "w-2 h-2 rounded-full border transition-colors",
                            hasSlots 
                              ? "bg-pink-500 border-pink-500" 
                              : "bg-white border-gray-300"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Soft fade overlay at bottom of navigation card */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
    </div>

      {/* Scrollable Calendar Card */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        <Card className="bg-card/75 backdrop-blur-xl border-border/50 shadow-xl">
          <CardContent className="p-4">
          {/* Calendar Content */}
          {viewMode === "day" || viewMode === "week" ? (
            <WeekCalendar 
              key={selectedDate.toISOString()} // Force re-render when date changes
              onSlotEdit={handleSlotEdit} 
              selectedDate={selectedDate}
              selectedDay={selectedDay}
              viewMode={viewMode === "day" ? "day" : "week"}
            />
          ) : (
            <MonthCalendar 
              onDayClick={handleDayClick}
              onSlotCreate={handleSlotEdit}
            />
          )}
          </CardContent>
        </Card>
      </div>

      {/* Slot Form Dialog */}
      <SlotFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        slot={selectedSlot}
        prefilledDateTime={prefilledDateTime}
        onClose={handleDialogClose}
      />
    </div>
  );
}