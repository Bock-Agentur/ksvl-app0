import { useState } from "react";
import { useToast, useUsers } from "@/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Slot } from "@/types";
import { useSlotFilters } from "../slot-management/use-slot-filters";
import { SlotStatsSection } from "../slot-management/slot-stats-section";
import { SlotFiltersSection } from "../slot-management/slot-filters-section";
import { SlotListItem } from "../slot-management/slot-list-item";

interface SlotListViewProps {
  slots: Slot[];
  onSlotEdit: (slot?: Slot) => void;
  onDialogOpen: (slot: Slot | null) => void;
}

export function SlotListView({ slots, onSlotEdit, onDialogOpen }: SlotListViewProps) {
  const { toast } = useToast();
  const { users } = useUsers();

  // Use slot filters hook
  const {
    activeFilter,
    setActiveFilter,
    selectedDate,
    setSelectedDate,
    selectedCraneOperator,
    setSelectedCraneOperator,
    filteredSlots,
    stats,
  } = useSlotFilters(slots);

  // Get crane operators for filters
  const craneOperators = users.filter(
    (u) =>
      u.roles?.includes("kranfuehrer") ||
      u.roles?.includes("admin") ||
      u.roles?.includes("vorstand") ||
      u.role === "kranfuehrer" ||
      u.role === "admin" ||
      u.role === "vorstand"
  );

  return (
    <div className="space-y-2 px-4">
      {/* Stats and Filters */}
      <SlotStatsSection
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <SlotFiltersSection
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedCraneOperator={selectedCraneOperator}
        onCraneOperatorChange={setSelectedCraneOperator}
        craneOperators={craneOperators.map((op) => ({ id: op.id, name: op.name }))}
      />

      {/* Slot List */}
      {filteredSlots.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Keine Slots gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 pb-4">
          {filteredSlots.map((slot) => (
            <SlotListItem
              key={slot.id}
              slot={slot}
              allSlots={slots}
              onEdit={onSlotEdit}
              onDelete={(slotId) => {
                const slotToDelete = slots.find((s) => s.id === slotId);
                if (slotToDelete?.isBooked) {
                  toast({
                    title: "Fehler",
                    description: "Gebuchte Slots können nicht gelöscht werden.",
                    variant: "destructive",
                  });
                  return;
                }
                onDialogOpen(slotToDelete || null);
              }}
              onCancel={(slotId) => {
                const slotToCancel = slots.find((s) => s.id === slotId);
                if (slotToCancel) {
                  onDialogOpen(slotToCancel);
                }
              }}
              onShowDetails={(slot) => {
                onDialogOpen(slot);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
