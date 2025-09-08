import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTestData } from "@/hooks/use-test-data";
import { Slot, SlotFormDialogProps } from "@/types";
import { useRole } from "@/hooks/use-role";
import { useConsecutiveSlots } from "@/hooks/use-consecutive-slots";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, Clock, User, Trash2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlotForm, SlotFormData } from "@/components/common/slot-form";

export function SlotFormDialog({ open, onOpenChange, slot, prefilledDateTime, onClose }: SlotFormDialogProps) {
  const { toast } = useToast();
  const { currentRole } = useRole();
  const { addSlot, addSlotBlock, updateSlot, deleteSlot, users, slots } = useTestData();
  const { validateConsecutiveSlots } = useConsecutiveSlots();
  
  // Get crane operators from test data - Alle mit Kranführer oder Admin Rollen (neue Multi-Role Logik)
  const craneOperators = users.filter(u => 
    u.roles?.includes("kranfuehrer") || 
    u.roles?.includes("admin") || 
    u.role === "kranfuehrer" || 
    u.role === "admin"  // Fallback für bestehende Nutzer ohne roles Array
  );

  // CRITICAL FIX: Add current user to crane operators if eligible (same as in SlotForm)
  const { currentUser } = useRole();
  const currentUserAsCraneOperator = currentUser && (
    currentUser.roles?.includes("kranfuehrer") || 
    currentUser.roles?.includes("admin") ||
    currentUser.role === "kranfuehrer" || 
    currentUser.role === "admin"  
  ) ? currentUser : null;

  // Ensure current user is included in crane operators list
  const allCraneOperators = currentUserAsCraneOperator && 
    !craneOperators.find(op => op.id === currentUserAsCraneOperator.id)
    ? [...craneOperators, currentUserAsCraneOperator]
    : craneOperators;
  
  const [isEditing, setIsEditing] = useState(false);

  const canManageSlots = currentUser?.roles?.includes("kranfuehrer") || 
                         currentUser?.roles?.includes("admin") ||
                         currentRole === "kranfuehrer" || 
                         currentRole === "admin";
  const canBookSlots = currentUser?.roles?.includes("mitglied") || 
                       currentUser?.roles?.includes("kranfuehrer") || 
                       currentUser?.roles?.includes("admin") ||
                       currentRole === "mitglied" || 
                       currentRole === "kranfuehrer" || 
                       currentRole === "admin";

  const handleFormSubmit = (formData: SlotFormData) => {
    console.log('🚀 HANDLE_FORM_SUBMIT called with:', formData);
    
    if (!formData.date || !formData.time || !formData.craneOperatorId) {
      console.log('❌ Missing required fields:', { 
        date: !!formData.date, 
        time: !!formData.time, 
        craneOperatorId: !!formData.craneOperatorId 
      });
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    console.log('📋 Form validation passed, proceeding...');
    
    // Prepare date string for validation
    const dateString = format(formData.date, 'yyyy-MM-dd');
    
    // Check if any slot already exists at this date and time range
    const startTime = formData.time;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + formData.slotBlockDurations[0];
    
    const overlappingSlot = slots.find(s => {
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
        description: "Es existiert bereits ein Slot in diesem Zeitraum.",
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
      slots,
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
      console.log('❌ Crane operator not found for ID:', formData.craneOperatorId, 'Available operators:', allCraneOperators.map(op => `${op.name} (${op.id})`));
      return;
    }
    
    if (slot) {
      // Update existing slot
      updateSlot(slot.id, {
        date: format(formData.date, 'yyyy-MM-dd'),
        time: formData.time,
        duration: formData.slotBlockDurations[0],
        craneOperator: {
          id: craneOperator.id,
          name: craneOperator.name,
          email: craneOperator.email
        },
        isBooked: slot.isBooked,
        bookedBy: slot.bookedBy,
        notes: formData.notes || ""
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
        
        console.log('🔧 SLOT BLOCK CREATION:', {
          dateString,
          startTime: formData.time,
          durations: formData.slotBlockDurations
        });
        
        const slotsToCreate: Partial<Slot>[] = [];
        
        for (let i = 0; i < formData.slotBlockDurations.length; i++) {
          const duration = formData.slotBlockDurations[i];
          const slotHour = Math.floor(currentMinutes / 60);
          const slotMinute = currentMinutes % 60;
          const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
          
          // Check for existing overlapping slots
          const slotEndMinutes = currentMinutes + duration;
          const hasOverlap = slots.some(s => {
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
            isBooked: false,
            bookedBy: "",
            notes: formData.notes || ""
          });
          
          currentMinutes += duration; // Move to next slot start time
        }
        
        console.log('📝 CREATING SLOT BLOCK with slots:', slotsToCreate.map(s => `${s.time} (${s.duration}min)`));
        
        // Create all slots as a block
        addSlotBlock(slotsToCreate);
        
        toast({
          title: "Slotblock erstellt",
          description: `${slotsToCreate.length} aufeinanderfolgende Termine wurden erfolgreich erstellt.`
        });
      } else {
        // Create single slot
        addSlot({
          date: dateString,
          time: formData.time,
          duration: formData.slotBlockDurations[0],
          craneOperator: {
            id: craneOperator.id,
            name: craneOperator.name,
            email: craneOperator.email
          },
          isBooked: false,
          bookedBy: "",
          notes: formData.notes || ""
        });
        toast({
          title: "Termin erstellt",
          description: "Der neue Termin wurde erfolgreich erstellt."
        });
      }
      
      // Nach der Erstellung zum erstellten Datum navigieren
      console.log('📅 NAVIGATING TO CREATED DATE:', formData.date);
      onClose(formData.date);
    }
  };

  const handleBookSlot = () => {
    if (!slot) return;
    
    updateSlot(slot.id, {
      isBooked: true,
      bookedBy: currentRole
    });
    toast({
      title: "Slot gebucht",
      description: "Der Slot wurde erfolgreich gebucht."
    });
    onClose();
  };

  const handleCancelSlot = () => {
    if (!slot) return;
    
    updateSlot(slot.id, {
      isBooked: false,
      bookedBy: ""
    });
    toast({
      title: "Buchung storniert",
      description: "Die Buchung wurde erfolgreich storniert."
    });
    onClose();
  };

  const handleDeleteSlot = () => {
    if (!slot) return;
    
    deleteSlot(slot.id);
    toast({
      title: "Slot gelöscht",
      description: "Der Slot wurde erfolgreich gelöscht."
    });
    onClose();
  };

  // Wenn bereits ein Slot existiert, zeige Slot-Details an
  if (slot && !canManageSlots && slot.isBooked && slot.bookedBy !== currentRole) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Slot-Details</DialogTitle>
            <DialogDescription className="sr-only">
              Zeigt Details eines bereits gebuchten Slots
            </DialogDescription>
          </DialogHeader>
          
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
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto p-2 sm:p-4 md:p-6 bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
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
          </DialogTitle>
          <DialogDescription className="sr-only">
            {slot ? "Verwalten Sie einen bestehenden Slot" : "Erstellen Sie einen neuen Slot"}
          </DialogDescription>
        </DialogHeader>
        
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
                  
                  {slot.isBooked && (slot.bookedBy === currentRole || canManageSlots) && (
                    <Button onClick={handleCancelSlot} variant="outline" size="lg" className="w-full">
                      Buchung stornieren
                    </Button>
                  )}
                </div>
                
                {/* Secondary Actions */}
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
      </DialogContent>
    </Dialog>
  );
}
