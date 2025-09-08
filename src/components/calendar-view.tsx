import { useState } from "react";
import { WeekCalendar } from "./week-calendar";
import { MonthCalendar } from "./month-calendar";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays } from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { SlotFormDialog } from "./slot-form-dialog";
import { Slot } from "@/types";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const { currentRole, currentUser } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [prefilledDateTime, setPrefilledDateTime] = useState<{ date: string; time: string } | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
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
      setViewMode("week"); // Wechsle zur Wochenansicht um den neuen Slot zu sehen
    }
  };


  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("week");
  };

  // FIXED: Multi-Role System Implementation
  const canManageSlots = currentUser?.roles?.includes("kranfuehrer") || 
                         currentUser?.roles?.includes("admin") ||
                         currentRole === "kranfuehrer" || 
                         currentRole === "admin";
  const canBookSlots = currentUser?.roles?.includes("mitglied") || 
                       currentUser?.roles?.includes("kranfuehrer") || 
                       currentUser?.roles?.includes("admin") ||
                       currentRole === "mitglied" || 
                       currentRole === "kranfuehrer" || 
                       currentRole === "admin";

  console.log('🔐 CALENDAR VIEW PERMISSIONS & STATE:', {
    currentUser: currentUser?.name,
    currentRole,
    userRoles: currentUser?.roles,
    canManageSlots,
    canBookSlots,
    viewMode,
    selectedDate
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
            onClick={() => {
              console.log('📱 Mobile Tagesansicht clicked, setting viewMode to day');
              setViewMode("day");
            }}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              viewMode === "day" 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700 font-semibold" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Calendar className="w-4 h-4" />
            Tagesansicht
          </Button>
          {/* Show Week button on tablet (md) but not mobile (sm) */}
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
            className={cn(
              "hidden sm:flex items-center gap-2 lg:hidden transition-all duration-200",
              viewMode === "week" 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700 font-semibold" 
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Calendar className="w-4 h-4" />
            Wochenansicht
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              viewMode === "month" 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700 font-semibold" 
                : "border-gray-300 hover:bg-gray-50"
            )}
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