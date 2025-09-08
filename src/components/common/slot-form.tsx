import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slot } from "@/types";
import { useRole } from "@/hooks/use-role";
import { useTestData } from "@/hooks/use-test-data";

// Generate 15-minute interval time slots for mini-slot support
const generateMiniTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
    slots.push(`${hourStr}:15`);
    slots.push(`${hourStr}:30`);
    slots.push(`${hourStr}:45`);
  }
  return slots;
};

const timeSlots = generateMiniTimeSlots();

export interface SlotFormData {
  date: Date | undefined;
  time: string;
  craneOperatorId: string;
  notes: string;
  slotBlockDurations: (15 | 30 | 45 | 60)[]; // Array für unterschiedliche Slot-Längen im Block
}

interface SlotFormProps {
  slot?: Slot;
  prefilledDateTime?: { date: string; time: string } | null;
  onSubmit: (data: SlotFormData) => void;
  onCancel: () => void;
  className?: string;
}

export function SlotForm({ slot, prefilledDateTime, onSubmit, onCancel, className }: SlotFormProps) {
  const { currentRole, currentUser } = useRole();
  const { users } = useTestData();
  
  // Get crane operators from test data - Alle mit Kranführer oder Admin Rollen
  const craneOperators = users.filter(u => 
    u.roles?.includes("kranfuehrer") || 
    u.roles?.includes("admin") || 
    u.role === "kranfuehrer" || 
    u.role === "admin"  // Fallback für bestehende Nutzer ohne roles Array
  );
  
  // CRITICAL FIX: Ensure current user is included in crane operators if eligible
  // Even if not in testData users list, the current user should be available for selection
  const currentUserAsCraneOperator = currentUser && (
    currentUser.roles?.includes("kranfuehrer") || 
    currentUser.roles?.includes("admin") ||
    currentUser.role === "kranfuehrer" || 
    currentUser.role === "admin"  // Fallback für bestehende Nutzer
  ) ? currentUser : null;

  // Add current user to crane operators if not already included
  const finalCraneOperators = currentUserAsCraneOperator && 
    !craneOperators.find(op => op.id === currentUserAsCraneOperator.id)
    ? [...craneOperators, currentUserAsCraneOperator]
    : craneOperators;

  // Popover states for auto-close functionality
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);

  const [formData, setFormData] = useState<SlotFormData>({
    date: new Date(), // Heutiges Datum als Standard
    time: "",
    craneOperatorId: currentUserAsCraneOperator?.id || "", // Aktueller Nutzer vorausgewählt
    notes: "",
    slotBlockDurations: [60] // Standard: 1 x 60 Min Slot
  });

  // Automatische Vorauswahl des aktuellen Nutzers als Kranführer

  useEffect(() => {
    if (slot) {
      setFormData({
        date: new Date(slot.date),
        time: slot.time,
        craneOperatorId: slot.craneOperator.id,
        notes: slot.notes || "",
        slotBlockDurations: [slot.duration] // Bestehender Slot als einzelner Block
      });
    } else {
      // Initialize with prefilledDateTime if available, otherwise defaults
      const initialDate = prefilledDateTime?.date ? new Date(prefilledDateTime.date) : new Date();
      const initialTime = prefilledDateTime?.time || "";
      
      setFormData(prev => ({
        ...prev,
        date: initialDate,
        time: initialTime,
        craneOperatorId: currentUserAsCraneOperator?.id || "", // Aktueller Nutzer vorausgewählt
        notes: "",
        slotBlockDurations: [60] // Standard: 1 x 60 Min Slot
      }));
    }
  }, [slot, currentUserAsCraneOperator, prefilledDateTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditing = !!slot;
  const canManageSlots = currentUser?.roles?.includes("kranfuehrer") || 
                        currentUser?.roles?.includes("admin") ||
                        currentRole === "kranfuehrer" || 
                        currentRole === "admin";

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Grunddaten */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-medium text-foreground border-b pb-2">Grunddaten</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Datum */}
            <div className="space-y-1">
              <Label>Datum</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "dd.MM.yyyy") : <span>Datum auswählen</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, date }));
                      setDatePopoverOpen(false); // Auto-close after selection
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Zeit */}
            <div className="space-y-1">
              <Label>Zeit</Label>
              <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !formData.time && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {formData.time ? formData.time : <span>Zeit auswählen</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[9999] bg-popover border" 
                  align="center"
                  side="bottom"
                  sideOffset={4}
                  avoidCollisions={true}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command className="w-[200px]">
                    <CommandInput placeholder="Zeit suchen..." className="h-9" />
                    <CommandList className="max-h-[240px] overflow-y-auto">
                      <CommandEmpty>Keine Zeit gefunden.</CommandEmpty>
                      <CommandGroup>
                        {timeSlots.map((time) => (
                          <CommandItem
                            key={time}
                            value={time}
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, time }));
                              setTimePopoverOpen(false);
                            }}
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-accent"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                formData.time === time ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="flex-1">{time}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Slot-Konfiguration */}
          {!isEditing && canManageSlots && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
              <Label className="text-xs sm:text-sm font-medium">
                Termine konfigurieren
              </Label>
              
              <div className="space-y-4">
                {formData.slotBlockDurations.map((duration, index) => {
                  // Berechne Start- und Endzeit für diesen Slot
                  const calculateSlotTimes = () => {
                    if (!formData.time) return { startTime: '00:00', endTime: '00:00' };
                    
                    const [startHour, startMinute] = formData.time.split(':').map(Number);
                    let currentMinutes = startHour * 60 + startMinute;
                    
                    // Addiere die Dauern aller vorherigen Slots
                    for (let i = 0; i < index; i++) {
                      currentMinutes += formData.slotBlockDurations[i];
                    }
                    
                    const slotStartHour = Math.floor(currentMinutes / 60);
                    const slotStartMinute = currentMinutes % 60;
                    const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
                    
                    const endMinutes = currentMinutes + duration;
                    const slotEndHour = Math.floor(endMinutes / 60);
                    const slotEndMinute = endMinutes % 60;
                    const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
                    
                    return { startTime: slotStartTime, endTime: slotEndTime };
                  };
                  
                  const { startTime, endTime } = calculateSlotTimes();
                  
                  return (
                    <div key={index} className="flex items-center gap-2 p-3 bg-background border rounded-lg">
                      <div className="flex flex-col min-w-[100px]">
                        <span className="text-sm font-medium">Termin {index + 1}</span>
                        <span className="text-xs text-muted-foreground">
                          {startTime} - {endTime}
                        </span>
                      </div>
                      
                      <Select 
                        value={duration.toString()} 
                        onValueChange={(value) => {
                          const newDurations = [...formData.slotBlockDurations];
                          newDurations[index] = parseInt(value) as 15 | 30 | 45 | 60;
                          setFormData(prev => ({ 
                            ...prev, 
                            slotBlockDurations: newDurations
                          }));
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Min.</SelectItem>
                          <SelectItem value="30">30 Min.</SelectItem>
                          <SelectItem value="45">45 Min.</SelectItem>
                          <SelectItem value="60">60 Min.</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.slotBlockDurations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full bg-trendy-pink hover:bg-trendy-pink/80 text-primary-foreground"
                          onClick={() => {
                            const newDurations = formData.slotBlockDurations.filter((_, i) => i !== index);
                            setFormData(prev => ({ 
                              ...prev, 
                              slotBlockDurations: newDurations
                            }));
                          }}
                        >
                          <Minus className="h-3 w-3 stroke-[3]" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    slotBlockDurations: [...prev.slotBlockDurations, 60]
                  }))}
                  className="w-full sm:w-auto"
                >
                  + Weiteren Termin hinzufügen
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Erstellt {formData.slotBlockDurations.length} aufeinanderfolgende Termine ab {formData.time || "der gewählten Zeit"}.
                  <br />
                  Gesamtdauer: {formData.slotBlockDurations.reduce((sum, d) => sum + d, 0)} Minuten
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* Kranführer */}
            <div className="space-y-1">
              <Label>Kranführer</Label>
              <Select 
                value={formData.craneOperatorId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, craneOperatorId: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Kranführer auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[9999]">
                  {finalCraneOperators.map((operator) => {
                    const isAdmin = operator.roles?.includes("admin") || operator.role === "admin";
                    const isCurrentUser = currentUserAsCraneOperator?.id === operator.id;
                    
                    return (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name}
                        {isAdmin && " (Admin)"}
                        {isCurrentUser && " (Sie)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Wählen Sie den verantwortlichen Kranführer für diesen Slot aus.
              </p>
            </div>
          </div>
        </div>

        {/* Zusätzliche Informationen */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-medium text-foreground border-b pb-2">Zusätzliche Informationen</h3>
          
          <div className="space-y-4">
            {/* Notizen */}
            <div className="space-y-1">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                placeholder="Optionale Notizen zum Slot..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col gap-2 pt-3 sm:pt-4 border-t">
          <Button type="submit" className="w-full order-1">
            <span className="text-sm">
              {isEditing ? "Aktualisieren" : 
                `${formData.slotBlockDurations.length === 1 ? 'Termin erstellen' : `${formData.slotBlockDurations.length} Termine erstellen`}`
              }
            </span>
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="w-full order-2">
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}