/**
 * DayViewContent - Shared Day View for Desktop and Mobile
 * Uses SlotCard variant="list" for consistent expand/collapse functionality
 */

import React from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Clock, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Slot, SlotStatus } from "@/types";
import { SlotCard, SlotAction } from "@/components/slots";
import { useSlotViewModel } from "@/hooks";

interface SlotColors {
  background: string;
  text: string;
  border: string;
  label: string;
}

interface DayViewContentProps {
  selectedDay: Date;
  selectedDaySlots: Slot[];
  allSlots: Slot[];
  getSlotStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  getSlotColors: (status: SlotStatus) => SlotColors;
  canManageSlots: boolean;
  canBookSlots: boolean;
  currentUserId?: string;
  onSlotClick: (slot: Slot) => void;
  onSlotEdit: (slot: Slot) => void;
  onSlotCancel: (slot: Slot) => void;
  onSlotDelete: (slot: Slot) => void;
  onCreateSlot: (date: string, time: string) => void;
  onBlockedSlotClick: () => void;
  showHeader?: boolean;
  variant?: "desktop" | "mobile";
}

export function DayViewContent({
  selectedDay,
  selectedDaySlots,
  allSlots,
  getSlotStatus,
  getSlotColors,
  canManageSlots,
  canBookSlots,
  currentUserId,
  onSlotClick,
  onSlotEdit,
  onSlotCancel,
  onSlotDelete,
  onCreateSlot,
  onBlockedSlotClick,
  showHeader = true,
  variant = "mobile",
}: DayViewContentProps) {
  const { mapSlot } = useSlotViewModel();
  
  // Function to check if a time slot is covered by any existing slot
  const isTimeCoveredBySlot = (checkTime: string) => {
    return selectedDaySlots.some(slot => {
      const slotHour = parseInt(slot.time.split(':')[0]);
      const slotMinute = parseInt(slot.time.split(':')[1]);
      const slotStartMinutes = slotHour * 60 + slotMinute;
      const slotEndMinutes = slotStartMinutes + slot.duration;
      
      const checkHour = parseInt(checkTime.split(':')[0]);
      const checkMinute = parseInt(checkTime.split(':')[1]);
      const checkMinutes = checkHour * 60 + checkMinute;
      
      return checkMinutes >= slotStartMinutes && checkMinutes < slotEndMinutes;
    });
  };

  // Find covering slot for a time
  const findCoveringSlot = (timeString: string) => {
    return selectedDaySlots.find(slot => {
      if (slot.time === timeString) return false;
      const slotHour = parseInt(slot.time.split(':')[0]);
      const slotMinute = parseInt(slot.time.split(':')[1]);
      const slotStartMinutes = slotHour * 60 + slotMinute;
      const slotEndMinutes = slotStartMinutes + slot.duration;
      
      const checkHour = parseInt(timeString.split(':')[0]);
      const checkMinute = parseInt(timeString.split(':')[1]);
      const checkMinutes = checkHour * 60 + checkMinute;
      
      return checkMinutes >= slotStartMinutes && checkMinutes < slotEndMinutes;
    });
  };

  // Handle SlotCard actions and map to existing handlers
  const handleSlotAction = (action: SlotAction, slot: Slot) => {
    const status = getSlotStatus(slot, allSlots);
    
    switch (action) {
      case 'manage':
        // Öffnet den Verwaltungs-Drawer
        if (status === 'blocked') {
          onBlockedSlotClick();
        } else {
          onSlotEdit(slot);
        }
        break;
      case 'book':
        onSlotEdit(slot);
        break;
      case 'cancel':
        onSlotCancel(slot);
        break;
      case 'delete':
        onSlotDelete(slot);
        break;
    }
  };

  // Determine if actions should be shown for a slot
  const shouldShowActions = (slot: Slot): boolean => {
    const status = getSlotStatus(slot, allSlots);
    // Show actions if user can manage slots, or if they can book/cancel their own booking
    return canManageSlots || 
           (canBookSlots && status === 'available') ||
           (slot.isBooked && slot.memberId === currentUserId);
  };

  return (
    <div>
      {showHeader && (
        <div className="pb-2">
          <p className="text-center text-lg font-bold text-muted-foreground mb-6">
            {format(selectedDay, "dd. MMMM yyyy", { locale: de })}
          </p>
        </div>
      )}
      <div className="space-y-2">
        {/* Show all 15-minute intervals from 6:00 to 20:45 */}
        {Array.from({ length: 15 * 4 }, (_, i) => {
          const totalMinutes = (6 * 60) + (i * 15);
          const hour = Math.floor(totalMinutes / 60);
          const minute = totalMinutes % 60;
          if (hour > 20) return null;
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const exactTimeSlots = selectedDaySlots.filter(slot => slot.time === timeString);
          const isCoveredByLongerSlot = isTimeCoveredBySlot(timeString);
          
          // Skip if covered by longer slot and no exact match
          if (isCoveredByLongerSlot && exactTimeSlots.length === 0) {
            return null;
          }
          
          const coveringSlot = findCoveringSlot(timeString);
          
          return (
            <div key={`${hour}-${minute}`} className="space-y-1">
              {exactTimeSlots.length > 0 ? (
                // Existing slots - use SlotCard with list variant
                exactTimeSlots.map((slot) => {
                  const slotViewModel = mapSlot(slot, allSlots);
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slotViewModel}
                      variant="list"
                      showActions={shouldShowActions(slot)}
                      onAction={(action) => handleSlotAction(action, slot)}
                    />
                  );
                })
              ) : isCoveredByLongerSlot && coveringSlot ? (
                // Covered slot indicator
                <CoveredSlotCard
                  coveringSlot={coveringSlot}
                  allSlots={allSlots}
                  getSlotStatus={getSlotStatus}
                  getSlotColors={getSlotColors}
                  onSlotClick={onSlotClick}
                />
              ) : (
                // Empty time slot
                <EmptySlotCard
                  timeString={timeString}
                  selectedDay={selectedDay}
                  canManageSlots={canManageSlots}
                  onCreateSlot={onCreateSlot}
                  variant={variant}
                />
              )}
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}

// Sub-component: Covered Slot Card
interface CoveredSlotCardProps {
  coveringSlot: Slot;
  allSlots: Slot[];
  getSlotStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  getSlotColors: (status: SlotStatus) => SlotColors;
  onSlotClick: (slot: Slot) => void;
}

function CoveredSlotCard({
  coveringSlot,
  allSlots,
  getSlotStatus,
  getSlotColors,
  onSlotClick,
}: CoveredSlotCardProps) {
  const status = getSlotStatus(coveringSlot, allSlots);
  const colors = getSlotColors(status);

  return (
    <Card 
      className={cn(
        "p-3 opacity-75 cursor-pointer transition-all hover:opacity-100 font-medium rounded-lg shadow-sm"
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.text
      }}
      onClick={() => onSlotClick(coveringSlot)}
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: colors.text }} />
        <span className="text-sm" style={{ color: colors.text }}>
          Teil des {coveringSlot.duration}-min Slots ab {coveringSlot.time}
        </span>
      </div>
      <div className="text-xs mt-1" style={{ color: colors.text }}>
        Kranführer: {coveringSlot.craneOperator.name}
      </div>
    </Card>
  );
}

// Sub-component: Empty Slot Card
interface EmptySlotCardProps {
  timeString: string;
  selectedDay: Date;
  canManageSlots: boolean;
  onCreateSlot: (date: string, time: string) => void;
  variant: "desktop" | "mobile";
}

function EmptySlotCard({
  timeString,
  selectedDay,
  canManageSlots,
  onCreateSlot,
  variant,
}: EmptySlotCardProps) {
  const dateString = format(selectedDay, 'yyyy-MM-dd');

  return (
    <Card 
      className={cn(
        "border-2 border-dashed border-muted-foreground/30 bg-muted/20 transition-all",
        variant === "desktop" ? "p-3" : "p-4",
        canManageSlots 
          ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5" 
          : "cursor-default"
      )}
      onClick={() => {
        if (canManageSlots) {
          onCreateSlot(dateString, timeString);
        }
      }}
    >
      <div className={cn(
        "flex items-center text-muted-foreground",
        variant === "mobile" ? "justify-center gap-2" : "gap-2"
      )}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">{timeString}</span>
        {canManageSlots && <Plus className="w-4 h-4 ml-auto" />}
      </div>
      {canManageSlots && variant === "desktop" && (
        <div className="text-xs text-muted-foreground mt-1">
          Klicken um neuen Slot zu erstellen
        </div>
      )}
      {variant === "mobile" && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
          {canManageSlots ? (
            <span className="text-xs">Slot für {timeString} hinzufügen</span>
          ) : (
            <span className="text-xs">Slot anlegen</span>
          )}
        </div>
      )}
    </Card>
  );
}
