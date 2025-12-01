import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Eye } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays, 
  addMonths, 
  subMonths, 
  isSameDay, 
  parseISO,
  isSameMonth,
  isToday
} from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTestData, usePermissions, useConsecutiveSlots } from "@/hooks";
import { useSlotsContext } from "@/contexts/slots-context";
import { cn } from "@/lib/utils";
import { Slot, MonthCalendarProps, DayStats } from "@/types";

// MonthCalendarProps and DayStats are now imported from @/types

export function MonthCalendar({ onDayClick, onSlotCreate, slots: propSlots, isLoading: propIsLoading }: MonthCalendarProps) {
  // Use props if provided, otherwise fall back to context
  const context = useSlotsContext();
  const slots = propSlots ?? context.slots;
  const isLoading = propIsLoading ?? context.isLoading;
  const { getSlotStatus } = useConsecutiveSlots();
  const { canManageSlots } = usePermissions();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate month boundaries
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Generate all days to display in the calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    let currentDay = calendarStart;
    
    while (currentDay <= calendarEnd) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }
    
    return days;
  }, [calendarStart, calendarEnd]);

  // Calculate statistics for each day using proper slot status logic
  const getDayStats = (day: Date): DayStats => {
    const daySlots = slots.filter(slot => {
      const slotDate = parseISO(slot.date);
      return isSameDay(day, slotDate);
    });

    const bookedSlots = daySlots.filter(slot => slot.isBooked).length;
    const availableSlots = daySlots.filter(slot => {
      const status = getSlotStatus(slot, slots);
      return status === 'available';
    }).length;
    const blockedSlots = daySlots.filter(slot => {
      const status = getSlotStatus(slot, slots);
      return status === 'blocked';
    }).length;

    return {
      totalSlots: daySlots.length,
      bookedSlots,
      availableSlots,
      blockedSlots
    };
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    onDayClick(day);
  };

  const formatMonthYear = () => {
    return format(currentMonth, "MMMM yyyy", { locale: de });
  };

  const weekDayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <div className="w-full space-y-4">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            className="hidden md:flex"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Vorheriger
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            className="md:hidden flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground text-center sm:text-left min-w-0 capitalize">
            {formatMonthYear()}
          </h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="hidden md:flex"
          >
            Nächster
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="md:hidden flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {canManageSlots && onSlotCreate && (
          <Button 
            onClick={() => onSlotCreate({ 
              date: format(new Date(), 'yyyy-MM-dd'), 
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

      {/* Calendar Grid */}
      <div className="space-y-4">
      <Card className="card-maritime-hero">
        <CardContent className="p-0">
          {/* Calendar Header - Weekday Names - Sticky */}
          <div className="sticky top-0 z-10 grid grid-cols-7 border-b bg-muted/30 backdrop-blur-sm">
            {weekDayNames.map((dayName) => (
              <div
                key={dayName}
                className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayStats = getDayStats(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);
              const hasSlots = dayStats.totalSlots > 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer transition-colors hover:bg-muted/20 relative",
                    !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                    isDayToday && "bg-accent/20",
                    hasSlots && "hover:bg-primary/5"
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-center mb-2">
                    <span 
                      className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center",
                        isDayToday && "bg-primary text-primary-foreground rounded-full text-xs",
                        !isCurrentMonth && "opacity-50"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Slot Statistics - Circles Vertical */}
                  {hasSlots && (
                    <div className="flex flex-col items-center gap-1 mt-1">
                      {/* Total Slots - Outline Circle */}
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-muted-foreground text-muted-foreground text-xs font-medium">
                        {dayStats.totalSlots}
                      </div>
                      
                        {/* Available Slots - Green Circle */}
                        {dayStats.availableSlots > 0 && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--status-available))] text-[hsl(var(--status-available-foreground))] text-xs font-medium">
                            {dayStats.availableSlots}
                          </div>
                      )}
                      
                        {/* Booked Slots - Blue Circle */}
                        {dayStats.bookedSlots > 0 && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--status-booked))] text-[hsl(var(--status-booked-foreground))] text-xs font-medium">
                            {dayStats.bookedSlots}
                          </div>
                       )}
                       
                        {/* Blocked Slots - Red Circle */}
                        {dayStats.blockedSlots > 0 && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--status-blocked))] text-[hsl(var(--status-blocked-foreground))] text-xs font-medium">
                            {dayStats.blockedSlots}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!hasSlots && isCurrentMonth && (
                    <div className="text-xs text-muted-foreground/50 italic">
                      Keine Slots
                    </div>
                  )}

                  {/* Hover indicator */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-muted-foreground"></div>
              <span>Gesamt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-available))]"></div>
              <span>Verfügbar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-booked))]"></div>
              <span>Gebucht</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--status-blocked))]"></div>
              <span>Gesperrt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span>Klicken für Wochenansicht</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Month Summary */}
      <div className="lg:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-base">
              Monatsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {calendarDays
              .filter(day => isSameMonth(day, currentMonth))
              .map(day => {
                const dayStats = getDayStats(day);
                if (dayStats.totalSlots === 0) return null;
                
                return (
                  <Card
                    key={day.toISOString()}
                    className="p-3 cursor-pointer transition-all hover:shadow-sm border-l-4 border-l-primary/20"
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {format(day, "EEEE, dd.MM.", { locale: de })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dayStats.totalSlots} Slots gesamt
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {dayStats.availableSlots > 0 && (
                          <Badge variant="success" className="border-success/30">
                            {dayStats.availableSlots} frei
                          </Badge>
                        )}
                        {dayStats.bookedSlots > 0 && (
                          <Badge variant="default" className="border-primary/30">
                            {dayStats.bookedSlots} gebucht
                          </Badge>
                        )}
                        {dayStats.blockedSlots > 0 && (
                          <Badge variant="destructive" className="border-destructive/30">
                            {dayStats.blockedSlots} gesperrt
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}