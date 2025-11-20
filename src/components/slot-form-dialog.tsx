import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSlots, CreateSlotData } from "@/hooks/use-slots";
import { useUsers } from "@/hooks/use-users";
import { Slot, SlotFormDialogProps } from "@/types";
import { useRole } from "@/hooks/use-role";
import { useConsecutiveSlots } from "@/hooks/use-consecutive-slots";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, Clock, User, Trash2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlotForm, SlotFormData } from "@/components/common/slot-form";

export function SlotFormDialog({ open, onOpenChange, slot, prefilledDateTime, onClose }: SlotFormDialogProps) {
  const { toast } = useToast();
  const { currentRole, currentUser } = useRole();
  const { slots: allSlots, addSlot, addSlotBlock, updateSlot, deleteSlot, bookSlot, cancelBooking } = useSlots();
  const { users } = useUsers();
  const { validateConsecutiveSlots } = useConsecutiveSlots();
  
  const [isEditing, setIsEditing] = useState(false);
  const [existingBookedSlot, setExistingBookedSlot] = useState<Slot | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pendingBookingSlotId, setPendingBookingSlotId] = useState<string | null>(null);
  
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

  const canManageSlots = currentUser?.roles?.includes("kranfuehrer") || 
                         currentUser?.roles?.includes("admin") ||
                         currentUser?.roles?.includes("vorstand") ||
                         currentRole === "kranfuehrer" || 
                         currentRole === "admin" ||
                         currentRole === "vorstand";
  const canBookSlots = currentUser?.roles?.includes("mitglied") || 
                       currentUser?.roles?.includes("kranfuehrer") || 
                       currentUser?.roles?.includes("admin") ||
                       currentUser?.roles?.includes("vorstand") ||
                       currentRole === "mitglied" || 
                       currentRole === "kranfuehrer" || 
                       currentRole === "admin" ||
                       currentRole === "vorstand";

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
      console.error('Error in handleFormSubmit:', error);
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
      // Close dialog immediately - the optimistic update will show the change
      onClose();
    } catch (error) {
      console.error('Error booking slot:', error);
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
      
      // Close dialog immediately
      onClose();
    } catch (error) {
      console.error('Error rebooking slot:', error);
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
      // Close dialog immediately - the optimistic update will show the change
      onClose();
    } catch (error) {
      console.error('Error canceling slot:', error);
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
      console.error('Error deleting slot:', error);
    }
  };

  // Wenn bereits ein Slot existiert, zeige Slot-Details an
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
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Slot bereits gebucht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge 
                className="bg-status-booked text-status-booked-foreground border-status-booked"
              >
                Gebucht
              </Badge>
              <span className="text-sm text-muted-foreground">
                von {slot.bookedBy}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(slot.date), "EEEE, dd. MMMM yyyy", { locale: de })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{slot.time} Uhr ({slot.duration} Min.)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Kranführer: {slot.craneOperator.name}</span>
            </div>
          </CardContent>
        </Card>
        
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
                  {slot.isBooked ? "Buchung verwalten" : "Slot buchen"}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge 
                    className={cn(
                      "text-xs",
                      slot.isBooked 
                        ? "bg-status-booked text-status-booked-foreground border-status-booked" 
                        : "bg-status-available text-status-available-foreground border-status-available"
                    )}
                  >
                    {slot.isBooked ? "Gebucht" : "Verfügbar"}
                  </Badge>
                  {slot.isBooked && slot.bookedBy && (
                    <span className="text-sm text-muted-foreground">
                      von {slot.bookedBy}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(slot.date), "EEEE, dd. MMMM yyyy", { locale: de })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{slot.time} Uhr ({slot.duration} Min.)</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Kranführer: {slot.craneOperator.name}</span>
                </div>
                
                {slot.notes && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Beschreibung:</strong> {slot.notes}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isEditing ? (
              // Edit form - Use exact same Card layout as slot management
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
              // Action buttons - optimized layout
              <div className="space-y-3">
                {/* Primary Actions */}
                <div className="grid grid-cols-1 gap-3">
                  {!slot.isBooked && canBookSlots && (
                    <Button onClick={handleBookSlot} size="lg" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Slot buchen
                    </Button>
                  )}
                  
                  {/* Cancel button for members (own booked slots) or admins/kranfuehrer */}
                  {slot.isBooked && ((slot.memberId === currentUser?.id && canBookSlots) || canManageSlots) && (
                    <Button onClick={handleCancelSlot} variant="outline" size="lg" className="w-full">
                      Buchung stornieren
                    </Button>
                  )}
                </div>
                
                {/* Secondary Actions - only for admins/kranfuehrer */}
                {canManageSlots && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Bearbeiten
                    </Button>
                    <Button onClick={handleDeleteSlot} variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </Button>
                  </div>
                )}
                
                {/* Close Button */}
                <div className="flex justify-center pt-2">
                  <Button variant="ghost" onClick={() => onClose()} className="text-muted-foreground">
                    Schließen
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // New slot form - Use exact same Card layout as slot management
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
    <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bestehenden Termin stornieren?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Sie haben bereits einen Termin gebucht. Sie können nur einen Termin gleichzeitig buchen.
            </p>
            {existingBookedSlot && (
              <Card className="bg-muted">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {format(parseISO(existingBookedSlot.date), "dd. MMMM yyyy", { locale: de })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{existingBookedSlot.time} Uhr ({existingBookedSlot.duration} Min)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    <span>{existingBookedSlot.craneOperator.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="font-medium">
              Möchten Sie Ihren bestehenden Termin stornieren und den neuen Termin buchen?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelRebooking}>Nein, abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmCancelAndBook}>
            Ja, umbuchen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
