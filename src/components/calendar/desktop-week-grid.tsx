/**
 * DesktopWeekGrid - Desktop Week View Grid Component
 * Displays 7-day week grid with 15-minute slot intervals
 */

import React from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Slot, SlotStatus } from "@/types";
import { useToast } from "@/hooks";

interface SlotColors {
  background: string;
  text: string;
  border: string;
  label: string;
}

interface DesktopWeekGridProps {
  weekDays: Date[];
  timeSlots: { hour: number; minute: number }[];
  weekSlots: Slot[];
  canManageSlots: boolean;
  canBookSlots: boolean;
  currentRole?: string;
  getSlotStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  getSlotColors: (status: SlotStatus) => SlotColors;
  getMiniSlotsForDayHourMinute: (day: Date, hour: number, minute: number) => Slot[];
  isMiniSlotAvailable: (day: Date, hour: number, minute: number) => boolean;
  dayHasSlots: (day: Date) => boolean;
  onHourClick: (day: Date, hour: number, minute?: number) => void;
  onSlotEdit: (slot: Slot) => void;
  onBlockedSlotClick: () => void;
}

export function DesktopWeekGrid({
  weekDays,
  timeSlots,
  weekSlots,
  canManageSlots,
  canBookSlots,
  currentRole,
  getSlotStatus,
  getSlotColors,
  getMiniSlotsForDayHourMinute,
  isMiniSlotAvailable,
  dayHasSlots,
  onHourClick,
  onSlotEdit,
  onBlockedSlotClick,
}: DesktopWeekGridProps) {
  const { toast } = useToast();

  const handleSlotClick = (slot: Slot, status: SlotStatus) => {
    if (status === 'blocked') {
      onBlockedSlotClick();
      return;
    }
    if (slot.isBooked && (canManageSlots || slot.bookedBy === currentRole)) {
      onSlotEdit(slot);
    } else if (!slot.isBooked && canBookSlots) {
      onSlotEdit(slot);
    }
  };

  return (
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
                
                // Don't render if not available and no existing slot
                if (!isAvailable && miniSlots.length === 0) {
                  return (
                    <div 
                      key={`${dayIndex}-${hour}-${minute}`} 
                      className="h-[80px]"
                    />
                  );
                }
                
                return (
                  <div 
                    key={`${dayIndex}-${hour}-${minute}`} 
                    className="h-[80px]"
                  >
                    {miniSlots.length > 0 ? (
                      // Show existing slot as card
                      <div className="h-full">
                        {miniSlots.map((slot) => {
                          const slotStatus = getSlotStatus(slot, weekSlots);
                          const isBookable = slotStatus === 'available';
                          const colors = getSlotColors(slotStatus);
                          
                          return (
                            <Card
                              key={slot.id}
                              className={cn(
                                "h-full p-3 cursor-pointer transition-all hover:shadow-md rounded-lg relative",
                                !isBookable && !slot.isBooked ? "opacity-60 cursor-not-allowed" : ""
                              )}
                              style={{
                                backgroundColor: colors.background,
                                borderColor: colors.border
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlotClick(slot, slotStatus);
                              }}
                            >
                              {/* Crane Operator */}
                              <div className="truncate text-xs font-medium leading-tight" style={{ color: colors.text }}>
                                {slot.craneOperator.name}
                              </div>
                              {/* Member Info if booked */}
                              {slot.isBooked && (slot.memberName || slot.member) && (
                                <div className="truncate text-xs opacity-90 leading-tight" style={{ color: colors.text }}>
                                  {slot.memberName || slot.member?.name}
                                </div>
                              )}
                              {/* Duration */}
                              <div className="text-xs opacity-75" style={{ color: colors.text }}>
                                {slot.duration} Min.
                              </div>
                              {/* Status indicator */}
                              <div 
                                className="absolute top-2 right-2 w-2 h-2 rounded-full opacity-75"
                                style={{ backgroundColor: colors.label }} 
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
                            onHourClick(day, hour, minute);
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
  );
}
