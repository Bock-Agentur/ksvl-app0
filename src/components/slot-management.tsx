import { useState } from "react";
import { Plus } from "lucide-react";
import { useStickyHeaderLayout, useToast, useUsers, useRole } from "@/hooks";
import { format, parse, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSlotsContext } from "@/contexts/slots-context";
import { Slot } from "@/types";
import { SlotForm, SlotFormData as SharedSlotFormData } from "@/components/common/slot-form";
import { useSlotFilters } from "./slot-management/use-slot-filters";
import { SlotStatsSection } from "./slot-management/slot-stats-section";
import { SlotFiltersSection } from "./slot-management/slot-filters-section";
import { SlotListItem } from "./slot-management/slot-list-item";
import { SlotDetailsDialog } from "./slot-management/slot-details-dialog";

export function SlotManagement() {
  const { toast } = useToast();
  const { users } = useUsers();
  const { slots, addSlotBlock, updateSlot, deleteSlot, isLoading: slotsLoading } = useSlotsContext();
  const { isPageSticky, isLoading: stickyLoading } = useStickyHeaderLayout();
  const isStickyEnabled = isPageSticky("slotManagement");
  const isLoading = slotsLoading || stickyLoading;

  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [selectedSlotForDetails, setSelectedSlotForDetails] = useState<Slot | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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

  // Get crane operators
  const craneOperators = users.filter(
    (u) =>
      u.roles?.includes("kranfuehrer") ||
      u.roles?.includes("admin") ||
      u.roles?.includes("vorstand") ||
      u.role === "kranfuehrer" ||
      u.role === "admin" ||
      u.role === "vorstand"
  );

  const currentUserAsCraneOperator =
    currentUser &&
    (currentUser.roles?.includes("kranfuehrer") ||
      currentUser.roles?.includes("admin") ||
      currentUser.roles?.includes("vorstand") ||
      currentUser.role === "kranfuehrer" ||
      currentUser.role === "admin" ||
      currentUser.role === "vorstand")
      ? currentUser
      : null;

  const allCraneOperators =
    currentUserAsCraneOperator && !craneOperators.find((op) => op.id === currentUserAsCraneOperator.id)
      ? [...craneOperators, currentUserAsCraneOperator]
      : craneOperators;

  const handleOpenForm = (slot?: Slot) => {
    setEditingSlot(slot || null);
    setIsEditing(true);
  };

  const handleFormSubmit = async (formData: SharedSlotFormData) => {
    if (!formData.date || !formData.time || !formData.craneOperatorId) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const craneOperator = allCraneOperators.find((op) => op.id === formData.craneOperatorId);
    if (!craneOperator) {
      return;
    }

    if (editingSlot) {
      // Update existing slot
      const memberId = formData.isBooked
        ? formData.memberId || editingSlot.member?.id || currentUser?.id
        : undefined;
      const memberData =
        formData.isBooked && formData.memberName
          ? {
              id: memberId || `member-${Date.now()}`,
              name: formData.memberName,
              email: formData.memberEmail || "",
              memberNumber: formData.memberNumber || "",
            }
          : undefined;

      updateSlot(editingSlot.id, {
        date: format(formData.date!, "yyyy-MM-dd"),
        time: formData.time,
        duration: formData.slotBlockDurations?.[0] || 60,
        craneOperator,
        notes: formData.notes,
        isBooked: formData.isBooked || false,
        memberName: memberData?.name,
        memberId: memberId,
      });

      toast({
        title: "Slot aktualisiert",
        description: "Der Slot wurde erfolgreich aktualisiert.",
      });
    } else {
      // Create new slot(s)
      const durations = formData.slotBlockDurations || [60];
      const dateString = format(formData.date!, "yyyy-MM-dd");

      const slotsToCreate = [];
      let currentTime = formData.time;
      for (let i = 0; i < durations.length; i++) {
        const duration = durations[i];
        slotsToCreate.push({
          date: dateString,
          time: currentTime,
          duration: duration,
          craneOperator: {
            id: craneOperator.id,
            name: craneOperator.name,
            email: craneOperator.email || "",
          },
          notes: formData.notes || "",
        });

        const nextTime = addMinutes(
          parse(`${dateString} ${currentTime}`, "yyyy-MM-dd HH:mm", new Date()),
          duration
        );
        currentTime = format(nextTime, "HH:mm");
      }

      try {
        await addSlotBlock(slotsToCreate);
        const message =
          durations.length === 1
            ? "Termin erfolgreich erstellt."
            : `Terminblock mit ${durations.length} Terminen erfolgreich erstellt.`;
        toast({
          title: "Erfolg",
          description: message,
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Die Termine konnten nicht erstellt werden.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsEditing(false);
    setEditingSlot(null);
  };

  const handleDeleteSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (slot?.isBooked) {
      toast({
        title: "Fehler",
        description: "Gebuchte Slots können nicht gelöscht werden.",
        variant: "destructive",
      });
      return;
    }
    deleteSlot(slotId);
    toast({
      title: "Slot gelöscht",
      description: "Der Slot wurde erfolgreich gelöscht.",
    });
  };

  const handleCancelSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot?.isBooked) {
      toast({
        title: "Fehler",
        description: "Nur gebuchte Slots können storniert werden.",
        variant: "destructive",
      });
      return;
    }
    updateSlot(slotId, {
      isBooked: false,
      memberName: undefined,
      memberId: undefined,
    });
    toast({
      title: "Slot storniert",
      description: "Die Buchung wurde erfolgreich storniert.",
    });
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-background max-w-7xl mx-auto",
          isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-6"
        )}
      >
        <div className="pt-4 pb-0 my-0 px-4">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
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
        isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : "space-y-6"
      )}
    >
      {/* Fixed Top Card */}
      <div
        className={cn(
          "pt-4 pb-0 my-0 px-4",
          isStickyEnabled ? "flex-shrink-0 relative z-10" : ""
        )}
      >
        <Card className="card-maritime-hero">
          <CardHeader>
            <CardTitle>Slot-Verwaltung</CardTitle>
            <CardDescription>Verwalten Sie alle Kranführer-Slots</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isEditing && (
              <Button onClick={() => handleOpenForm()} size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Neuer Slot</span>
                <span className="sm:hidden">Slot</span>
              </Button>
            )}

            {/* Slot Form */}
            {isEditing && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingSlot ? "Slot bearbeiten" : "Neuen Slot erstellen"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingSlot
                      ? "Bearbeiten Sie die Slot-Informationen"
                      : "Erstellen Sie einen neuen Kranführer-Slot"}
                  </p>
                </div>

                <SlotForm
                  slot={editingSlot || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={() => {
                    setIsEditing(false);
                    setEditingSlot(null);
                  }}
                />
              </div>
            )}

            {/* Show stats and filters only when not editing */}
            {!isEditing && (
              <>
                {/* Stats Cards */}
                <SlotStatsSection
                  stats={stats}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  isOpen={isStatsOpen}
                  onOpenChange={setIsStatsOpen}
                />

                {/* Filters */}
                <SlotFiltersSection
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedCraneOperator={selectedCraneOperator}
                  onCraneOperatorChange={setSelectedCraneOperator}
                  craneOperators={craneOperators.map((op) => ({ id: op.id, name: op.name }))}
                  isOpen={isFiltersOpen}
                  onOpenChange={setIsFiltersOpen}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Content Area */}
      {!isEditing && (
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
                  onDelete={handleDeleteSlot}
                  onCancel={handleCancelSlot}
                  onShowDetails={setSelectedSlotForDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slot Details Dialog */}
      <SlotDetailsDialog
        slot={selectedSlotForDetails}
        open={!!selectedSlotForDetails}
        onOpenChange={(open) => !open && setSelectedSlotForDetails(null)}
      />
    </div>
  );
}
