import { useState } from "react";
import { useStickyHeaderLayout, useToast, useUsers, useRole } from "@/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSlotsContext } from "@/contexts/slots-context";
import { Slot } from "@/types";
import { useSlotFilters } from "./slot-management/use-slot-filters";
import { SlotHeroSection } from "./slot-management/slot-hero-section";
import { SlotStatsSection } from "./slot-management/slot-stats-section";
import { SlotFiltersSection } from "./slot-management/slot-filters-section";
import { SlotListItem } from "./slot-management/slot-list-item";
import { SlotFormDialog } from "./slot-form-dialog";

export function SlotManagement() {
  const { toast } = useToast();
  const { users } = useUsers();
  const { slots, isLoading: slotsLoading } = useSlotsContext();
  const { isPageSticky, isLoading: stickyLoading } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky("slotManagement");
  const isLoading = slotsLoading || stickyLoading;

  // Unified dialog state - one dialog for all operations
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const { currentUser } = useRole();

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

  // Open dialog for creating a new slot
  const handleOpenForm = (slot?: Slot) => {
    setSelectedSlot(slot || null);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSlot(null);
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-background max-w-7xl mx-auto",
          isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-2"
        )}
      >
        <div className="pt-4 pb-0 my-0 px-4 space-y-2">
          <Card className="animate-pulse card-maritime-hero">
            <CardContent className="p-6">
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
          <Card className="animate-pulse card-maritime-hero">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/4 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="animate-pulse card-maritime-hero">
            <CardContent className="p-4">
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-background max-w-7xl mx-auto",
        isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-2"
      )}
    >
      {/* Hero Section */}
      <div
        className={cn(
          "pt-4 pb-0 my-0 px-4 space-y-2",
          isStickyEnabled ? "flex-shrink-0 relative z-10" : ""
        )}
      >
        <SlotHeroSection onAddSlot={() => handleOpenForm()} />

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
      </div>

      {/* Scrollable Content Area */}
      <div
        className={cn(
          "px-4",
          isStickyEnabled ? "flex-1 overflow-y-auto overflow-x-hidden pb-6" : "space-y-4"
        )}
      >
        {/* Slot List */}
        {filteredSlots.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Keine Slots gefunden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSlots.map((slot) => (
              <SlotListItem
                key={slot.id}
                slot={slot}
                allSlots={slots}
                onEdit={handleOpenForm}
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
                  // Open dialog with slot to show delete option
                  setSelectedSlot(slotToDelete || null);
                  setIsDialogOpen(true);
                }}
                onCancel={(slotId) => {
                  const slotToCancel = slots.find((s) => s.id === slotId);
                  if (slotToCancel) {
                    setSelectedSlot(slotToCancel);
                    setIsDialogOpen(true);
                  }
                }}
                onShowDetails={(slot) => {
                  setSelectedSlot(slot);
                  setIsDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unified Slot Dialog - handles create, edit, view, book, cancel, delete */}
      <SlotFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        slot={selectedSlot}
        onClose={handleDialogClose}
      />
    </div>
  );
}
