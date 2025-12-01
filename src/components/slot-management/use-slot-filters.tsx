import { useState, useMemo } from "react";
import { Slot } from "@/types";
import { parseISO, isSameDay } from "date-fns";
import { useRole } from "@/hooks";

export type FilterStatus = "all" | "booked" | "available";

export function useSlotFilters(slots: Slot[]) {
  const { currentUser } = useRole();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedCraneOperator, setSelectedCraneOperator] = useState<string>("");
  const [showMySlots, setShowMySlots] = useState(false);

  const filteredSlots = useMemo(() => {
    return slots
      .filter((slot) => {
        // Filter by booking status
        let passesStatusFilter = true;
        switch (activeFilter) {
          case "booked":
            passesStatusFilter = slot.isBooked;
            break;
          case "available":
            passesStatusFilter = !slot.isBooked;
            break;
          default:
            passesStatusFilter = true;
        }

        // Filter by date if selected
        let passesDateFilter = true;
        if (selectedDate) {
          const slotDate = parseISO(slot.date);
          passesDateFilter = isSameDay(slotDate, selectedDate);
        }

        // Filter by crane operator if selected
        let passesOperatorFilter = true;
        if (selectedCraneOperator && selectedCraneOperator !== "all") {
          passesOperatorFilter = slot.craneOperator.id === selectedCraneOperator;
        }

        // Filter by "Meine Slots" if enabled
        let passesMySlotFilter = true;
        if (showMySlots && currentUser) {
          passesMySlotFilter = slot.craneOperator.id === currentUser.id;
        }

        return (
          passesStatusFilter &&
          passesDateFilter &&
          passesOperatorFilter &&
          passesMySlotFilter
        );
      })
      .sort((a, b) => {
        // Primary sort: by date
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;

        // Secondary sort: by time
        return a.time.localeCompare(b.time);
      });
  }, [slots, activeFilter, selectedDate, selectedCraneOperator, showMySlots, currentUser]);

  const stats = useMemo(
    () => ({
      total: slots.length,
      booked: slots.filter((s) => s.isBooked).length,
      available: slots.filter((s) => !s.isBooked).length,
    }),
    [slots]
  );

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedCraneOperator("");
    setShowMySlots(false);
  };

  return {
    activeFilter,
    setActiveFilter,
    selectedDate,
    setSelectedDate,
    selectedCraneOperator,
    setSelectedCraneOperator,
    showMySlots,
    setShowMySlots,
    filteredSlots,
    stats,
    clearFilters,
  };
}
