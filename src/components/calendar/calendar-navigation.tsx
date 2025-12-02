/**
 * Calendar Navigation Component
 * 
 * Extracted from calendar-view.tsx for better maintainability.
 * Handles all navigation controls: week nav, view toggles, day selectors.
 */

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, CalendarDays, CircleDot, Grid3x3, ChevronLeft, ChevronRight, Plus, Layers } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Slot } from "@/types";

export type CalendarViewMode = "day" | "week" | "month" | "list";

interface CalendarNavigationProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  selectedDay: Date;
  onSelectedDayChange: (day: Date) => void;
  weekDays: Date[];
  weekSlots: Slot[];
  isMobile: boolean;
  canManageSlots: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onCreateSlot: () => void;
}

export function CalendarNavigation({
  viewMode,
  onViewModeChange,
  selectedDay,
  onSelectedDayChange,
  weekDays,
  weekSlots,
  isMobile,
  canManageSlots,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onCreateSlot,
}: CalendarNavigationProps) {
  
  // Check if day has slots
  const dayHasSlots = (day: Date) => {
    return weekSlots.some(slot => {
      const slotDate = parseISO(slot.date);
      return isSameDay(day, slotDate);
    });
  };

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader>
        <CardTitle>Krankalender</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Week Navigation - Hidden in list view */}
          {viewMode !== "list" && (
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size={isMobile ? "icon" : "sm"}
                onClick={onPreviousWeek} 
                title="Vorherige Woche"
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToday} 
                className="h-9 px-3"
              >
                {isMobile ? <CircleDot className="h-4 w-4" /> : "Heute"}
              </Button>
              <Button 
                variant="outline" 
                size={isMobile ? "icon" : "sm"}
                onClick={onNextWeek} 
                title="Nächste Woche"
                className="h-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* View Toggle Buttons */}
          <div className="flex gap-1">
            <Button 
              variant={viewMode === "day" ? "default" : "outline"} 
              size={isMobile ? "icon" : "sm"}
              onClick={() => onViewModeChange("day")}
              title="Tagesansicht"
              className="h-9"
            >
              <Calendar className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Tag</span>}
            </Button>
            {!isMobile && (
              <Button 
                variant={viewMode === "week" ? "default" : "outline"} 
                size="sm"
                onClick={() => onViewModeChange("week")}
                title="Wochenansicht"
                className="h-9"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="ml-1">Woche</span>
              </Button>
            )}
            <Button 
              variant={viewMode === "month" ? "default" : "outline"} 
              size={isMobile ? "icon" : "sm"}
              onClick={() => onViewModeChange("month")}
              title="Monatsansicht"
              className="h-9"
            >
              <Grid3x3 className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Monat</span>}
            </Button>
            {/* Liste Button - Only for crane operators, vorstand, admin */}
            {canManageSlots && (
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size={isMobile ? "icon" : "sm"}
                onClick={() => onViewModeChange("list")}
                title="Listenansicht"
                className="h-9"
              >
                <Layers className="h-4 w-4" />
                {!isMobile && <span className="ml-1">Liste</span>}
              </Button>
            )}
          </div>

          {/* Add Slot Button - Only for authorized users */}
          {canManageSlots && (
            <Button 
              onClick={onCreateSlot} 
              size={isMobile ? "icon" : "sm"}
              title="Slot erstellen"
              className="h-9"
            >
              <Plus className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Erstellen</span>}
            </Button>
          )}
        </div>

        {/* Mobile Day Selector - Only for week/day views */}
        {(viewMode === "day" || viewMode === "week") && (
          <MobileDaySelector
            weekDays={weekDays}
            selectedDay={selectedDay}
            onSelectedDayChange={onSelectedDayChange}
            dayHasSlots={dayHasSlots}
          />
        )}

        {/* Desktop Day Selector - Only for day view */}
        {viewMode === "day" && (
          <DesktopDaySelector
            weekDays={weekDays}
            selectedDay={selectedDay}
            onSelectedDayChange={onSelectedDayChange}
            dayHasSlots={dayHasSlots}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Mobile Day Selector
function MobileDaySelector({
  weekDays,
  selectedDay,
  onSelectedDayChange,
  dayHasSlots,
}: {
  weekDays: Date[];
  selectedDay: Date;
  onSelectedDayChange: (day: Date) => void;
  dayHasSlots: (day: Date) => boolean;
}) {
  return (
    <div className="md:hidden">
      <div className="grid grid-cols-7 gap-1 w-full">
        {weekDays.map((day, index) => {
          const hasSlots = dayHasSlots(day);
          return (
            <div key={index} className="relative">
              <Button 
                variant={isSameDay(day, selectedDay) ? "default" : "outline"} 
                size="sm" 
                onClick={() => onSelectedDayChange(day)} 
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
  );
}

// Desktop Day Selector
function DesktopDaySelector({
  weekDays,
  selectedDay,
  onSelectedDayChange,
  dayHasSlots,
}: {
  weekDays: Date[];
  selectedDay: Date;
  onSelectedDayChange: (day: Date) => void;
  dayHasSlots: (day: Date) => boolean;
}) {
  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const hasSlots = dayHasSlots(day);
          const isSelectedDay = isSameDay(day, selectedDay);
          return (
            <Button 
              key={index} 
              variant={isSelectedDay ? "default" : "outline"} 
              size="sm" 
              onClick={() => onSelectedDayChange(day)} 
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
  );
}
