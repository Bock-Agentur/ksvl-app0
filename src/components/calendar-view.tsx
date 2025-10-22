import { useState } from "react";
import { WeekCalendar } from "./week-calendar";
import { MonthCalendar } from "./month-calendar";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays } from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { SlotFormDialog } from "./slot-form-dialog";
import { Slot } from "@/types";

export function CalendarView() {
  const { currentRole, currentUser } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [prefilledDateTime, setPrefilledDateTime] = useState<{ date: string; time: string } | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  return (
    <div className="h-full space-y-4">
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