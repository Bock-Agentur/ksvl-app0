import { useState, useEffect } from "react";
import { WeekCalendar } from "./week-calendar";
import { MonthCalendar } from "./month-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, CalendarDays, Home, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { SlotFormDialog } from "./slot-form-dialog";
import { Slot } from "@/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface CalendarViewProps {
  initialDate?: Date | null;
}

export function CalendarView({ initialDate }: CalendarViewProps) {
  const { currentRole, currentUser } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [prefilledDateTime, setPrefilledDateTime] = useState<{ date: string; time: string } | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Wenn ein initialDate übergeben wird, setze es als selectedDate und wechsle zur Tagesansicht
  useEffect(() => {
    if (initialDate) {
      console.log("📅 CalendarView: Navigating to date from chatbot:", initialDate);
      setSelectedDate(initialDate);
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
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Sticky Navigation Card */}
      <Card className="sticky top-4 z-20 bg-card/75 backdrop-blur-xl border-border/50 shadow-xl">
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
        </CardContent>
      </Card>

      {/* Scrollable Calendar Card */}
      <Card className="bg-card/75 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-4">
          {/* Calendar Content */}
          {viewMode === "day" || viewMode === "week" ? (
            <WeekCalendar 
              key={selectedDate.toISOString()} // Force re-render when date changes
              onSlotEdit={handleSlotEdit} 
              selectedDate={selectedDate}
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