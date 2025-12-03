/**
 * SlotFormDialog Component
 * 
 * Unified dialog for slot operations: create, edit, book, cancel, delete.
 * Refactored: Uses SlotInfoCard, SlotBookingActions, RebookConfirmDialog subcomponents.
 */
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSlotData, useUsers, usePermissions, useConsecutiveSlots, useToast } from "@/hooks";
import { useSlotsContext } from "@/contexts/slots-context";
import { Slot, SlotFormDialogProps } from "@/types";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { SlotForm, SlotFormData } from "@/components/common/slot-form";
import { SlotInfoCard } from "@/components/slots/slot-info-card";
import { SlotBookingActions } from "@/components/slots/slot-booking-actions";
import { RebookConfirmDialog } from "@/components/slots/rebook-confirm-dialog";
import { logger } from "@/lib/logger";

export function SlotFormDialog({ open, onOpenChange, slot, prefilledDateTime, onClose, mode = 'book' }: SlotFormDialogProps) {
  const { toast } = useToast();
  const { canManageSlots, canBookSlots, currentUser, currentRole } = usePermissions();
  const { slots: allSlots, addSlot, addSlotBlock, updateSlot, deleteSlot, bookSlot, cancelBooking } = useSlotsContext();
  const { users } = useUsers();
  const { validateConsecutiveSlots } = useConsecutiveSlots();
  
  // mode='manage' öffnet direkt das Bearbeitungs-Formular
  const [isEditing, setIsEditing] = useState(mode === 'manage');
  const [existingBookedSlot, setExistingBookedSlot] = useState<Slot | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingBookingSlotId, setPendingBookingSlotId] = useState<string | null>(null);
  
  // Reset isEditing wenn mode oder slot sich ändert
  useEffect(() => {
    if (open) {
      setIsEditing(mode === 'manage');
    }
  }, [mode, open]);
  
  // Get crane operators from users
  const craneOperators = users.filter(u => 
    u.roles?.includes("kranfuehrer") || 
    u.roles?.includes("admin") || 
    u.role === "kranfuehrer" || 
    u.role === "admin"
  );

  const currentUserAsCraneOperator = currentUser && (
    currentUser.roles?.includes("kranfuehrer") || 
    currentUser.roles?.includes("admin") ||
    currentUser.role === "kranfuehrer" || 
    currentUser.role === "admin"  
  ) ? currentUser : null;

  const allCraneOperators = currentUserAsCraneOperator && 
    !craneOperators.find(op => op.id === currentUserAsCraneOperator.id)
    ? [...craneOperators, currentUserAsCraneOperator]
    : craneOperators;

  const handleFormSubmit = async (formData: SlotFormData) => {
    if (!formData.date || !formData.time || !formData.craneOperatorId) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare date string for validation
    const dateString = format(formData.date, 'yyyy-MM-dd');
    
    // Check if any slot already exists at this date and time range
    const startTime = formData.time;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + formData.slotBlockDurations[0];
    
    const overlappingSlot = allSlots.find(s => {
      if (s.date !== dateString || s.id === slot?.id) return false;
      
      const [slotHour, slotMinute] = s.time.split(':').map(Number);
      const slotStartMinutes = slotHour * 60 + slotMinute;
      const slotEndMinutes = slotStartMinutes + s.duration;
      
      // Check for overlap
      return (startTotalMinutes < slotEndMinutes && endTotalMinutes > slotStartMinutes);
    });
    
    if (overlappingSlot) {
      toast({
        title: "Fehler", 
        description: `Es existiert bereits ein Slot in diesem Zeitraum (${overlappingSlot.time}, ${overlappingSlot.duration}min).`,
        variant: "destructive"
      });
      return;
    }

    // Validate consecutive slots
    const validationResult = validateConsecutiveSlots(
      {
        date: dateString,
        time: formData.time,
        duration: formData.slotBlockDurations[0],
        craneOperatorId: formData.craneOperatorId
      },
      allSlots,
      slot?.id
    );

    if (!validationResult.isValid) {
      toast({
        title: "Validierungsfehler",
        description: validationResult.message,
        variant: "destructive"
      });
      return;
    }

    const craneOperator = allCraneOperators.find(op => op.id === formData.craneOperatorId);
    if (!craneOperator) {
      return;
    }
    
    try {
      if (slot) {
        // Update existing slot
        await updateSlot(slot.id, {
          date: dateString,
          time: formData.time,
          duration: formData.slotBlockDurations[0],
          craneOperator: {
            id: craneOperator.id,
            name: craneOperator.name,
            email: craneOperator.email
          },
          notes: formData.notes
        });
        
        toast({
          title: "Slot aktualisiert",
          description: "Der Slot wurde erfolgreich aktualisiert."
        });
        onClose();
      } else {
        // Create slot/slot-block - always create as block now
        if (formData.slotBlockDurations.length > 1) {
          // Create slot-block with different durations
          const [startHour, startMinute] = formData.time.split(':').map(Number);
          let currentMinutes = startHour * 60 + startMinute;
          
          const slotsToCreate: CreateSlotData[] = [];
          
          for (let i = 0; i < formData.slotBlockDurations.length; i++) {
            const duration = formData.slotBlockDurations[i];
            const slotHour = Math.floor(currentMinutes / 60);
            const slotMinute = currentMinutes % 60;
            const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
            
            // Check for existing overlapping slots
            const slotEndMinutes = currentMinutes + duration;
            const hasOverlap = allSlots.some(s => {
              if (s.date !== dateString) return false;
              const [existingHour, existingMinute] = s.time.split(':').map(Number);
              const existingStart = existingHour * 60 + existingMinute;
              const existingEnd = existingStart + s.duration;
              return (currentMinutes < existingEnd && slotEndMinutes > existingStart);
            });
            
            if (hasOverlap) {
              toast({
                title: "Fehler",
                description: `Slot ${i + 1} (${slotTime}) würde mit einem bestehenden Slot überlappen.`,
                variant: "destructive"
              });
              return;
            }
            
            slotsToCreate.push({
              date: dateString,
              time: slotTime,
              duration: duration,
              craneOperator: {
                id: craneOperator.id,
                name: craneOperator.name,
                email: craneOperator.email
              },
              notes: formData.notes
            });
            
            currentMinutes += duration; // Move to next slot start time
          }
          
          // Create all slots as a block
          await addSlotBlock(slotsToCreate);
          
          toast({
            title: "Slotblock erstellt",
            description: `${slotsToCreate.length} aufeinanderfolgende Termine wurden erfolgreich erstellt.`
          });
          onClose(formData.date);
        } else {
          // Create single slot
          await addSlot({
            date: dateString,
            time: formData.time,
            duration: formData.slotBlockDurations[0],
            craneOperator: {
              id: craneOperator.id,
              name: craneOperator.name,
              email: craneOperator.email
            },
            notes: formData.notes
          });
          
          toast({
            title: "Termin erstellt",
            description: "Der neue Termin wurde erfolgreich erstellt."
          });
          onClose(formData.date);
        }
      }
    } catch (error) {
      logger.error('SLOTS', 'Error in handleFormSubmit', error);
      // Error toast already shown by use-slots hook
    }
  };

  const handleBookSlot = async () => {
    if (!slot || !currentUser) return;
    
    // Check if user is admin
    const isAdmin = currentUser.roles?.includes('admin') || currentRole === 'admin';
    
    // If not admin, check for existing bookings
    if (!isAdmin) {
      const userBookedSlots = allSlots.filter(s => 
        s.isBooked && s.memberId === currentUser.id && s.id !== slot.id
      );
      
      if (userBookedSlots.length > 0) {
        // User already has a booking, show warning dialog
        setExistingBookedSlot(userBookedSlots[0]);
        setPendingBookingSlotId(slot.id);
        setShowCancelDialog(true);
        return;
      }
    }
    
    // Proceed with booking
    try {
      await bookSlot(slot.id, currentUser.id);
      toast({
        title: "Slot gebucht",
        description: "Der Slot wurde erfolgreich gebucht."
      });
      onClose();
    } catch (error) {
      logger.error('SLOTS', 'Error booking slot', error);
    }
  };

  const handleConfirmCancelAndBook = async () => {
    if (!existingBookedSlot || !pendingBookingSlotId || !currentUser) return;
    
    try {
      // First, cancel the existing booking
      await cancelBooking(existingBookedSlot.id);
      
      // Then book the new slot
      await bookSlot(pendingBookingSlotId, currentUser.id);
      
      toast({
        title: "Termin umgebucht",
        description: "Ihr alter Termin wurde storniert und der neue Termin wurde gebucht."
      });
      
      // Reset dialog state
      setShowCancelDialog(false);
      setExistingBookedSlot(null);
      setPendingBookingSlotId(null);
      
      onClose();
    } catch (error) {
      logger.error('SLOTS', 'Error rebooking slot', error);
      toast({
        title: "Fehler",
        description: "Die Umbuchung konnte nicht durchgeführt werden.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRebooking = () => {
    setShowCancelDialog(false);
    setExistingBookedSlot(null);
    setPendingBookingSlotId(null);
  };

  const handleCancelSlot = async () => {
    if (!slot) return;
    
    try {
      await cancelBooking(slot.id);
      toast({
        title: "Buchung storniert",
        description: "Die Buchung wurde erfolgreich storniert."
      });
      onClose();
    } catch (error) {
      logger.error('SLOTS', 'Error canceling slot', error);
    }
  };

  const handleDeleteSlot = async () => {
    if (!slot) return;
    
    try {
      await deleteSlot(slot.id);
      toast({
        title: "Slot gelöscht",
        description: "Der Slot wurde erfolgreich gelöscht."
      });
      onClose();
    } catch (error) {
      logger.error('SLOTS', 'Error deleting slot', error);
    }
  };

  // Read-only view for non-admin users viewing a booked slot
  if (slot && !canManageSlots && slot.isBooked && slot.bookedBy !== currentRole) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Slot-Details</SheetTitle>
            <SheetDescription className="sr-only">
              Zeigt Details eines bereits gebuchten Slots
            </SheetDescription>
          </SheetHeader>
          
          <SlotInfoCard slot={slot} showTitle titleText="Slot bereits gebucht" />
          
          <div className="flex justify-center pt-2">
            <Button onClick={() => onClose()} variant="ghost" className="text-muted-foreground">
              Schließen
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-sm sm:text-base">
              {slot ? (
                <>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  {mode === 'manage' ? "Slot verwalten" : (slot.isBooked ? "Buchung verwalten" : "Slot buchen")}
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  Neuen Slot erstellen
                </>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {slot ? "Verwalten Sie einen bestehenden Slot" : "Erstellen Sie einen neuen Slot"}
            </SheetDescription>
          </SheetHeader>
          
          {slot ? (
            // Existing slot - Show details and actions
            <div className="space-y-4">
              <SlotInfoCard slot={slot} />
              
              {isEditing ? (
                // Edit form
                <Card className="border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg">
                      Slot bearbeiten
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Bearbeiten Sie die Slot-Informationen
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4 sm:space-y-6">
                    <SlotForm 
                      slot={slot} 
                      prefilledDateTime={prefilledDateTime}
                      onSubmit={handleFormSubmit}
                      onCancel={() => setIsEditing(false)}
                    />
                  </CardContent>
                </Card>
              ) : (
                // Action buttons
                <SlotBookingActions
                  slot={slot}
                  canBookSlots={canBookSlots}
                  canManageSlots={canManageSlots}
                  currentUserId={currentUser?.id}
                  mode={mode}
                  onBook={handleBookSlot}
                  onCancel={handleCancelSlot}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDeleteSlot}
                  onClose={() => onClose()}
                />
              )}
            </div>
          ) : (
            // New slot form
            <Card className="border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">
                  Neuen Slot erstellen
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Erstellen Sie einen neuen Kranführer-Slot
                </p>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4 sm:space-y-6">
                <SlotForm 
                  slot={undefined}
                  prefilledDateTime={prefilledDateTime}
                  onSubmit={handleFormSubmit}
                  onCancel={onClose}
                />
              </CardContent>
            </Card>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Cancel and Rebook Confirmation Dialog */}
      <RebookConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        existingSlot={existingBookedSlot}
        onConfirm={handleConfirmCancelAndBook}
        onCancel={handleCancelRebooking}
      />
    </>
  );
}
