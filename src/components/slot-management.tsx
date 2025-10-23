import { useState } from "react";
import { Plus, Edit, Trash2, Clock, CalendarDays as Calendar, UserCheck, User, Mail, Filter, CalendarDays, X, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { format, parse, addMinutes, parseISO, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUsers } from "@/hooks/use-users";
import { useSlots } from "@/hooks/use-slots";
import { useRole } from "@/hooks/use-role";
import { Slot } from "@/types";
import { useConsecutiveSlots } from "@/hooks/use-consecutive-slots";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { StatusLabel } from "@/components/ui/status-label";
import { SlotForm, SlotFormData as SharedSlotFormData } from "@/components/common/slot-form";
export function SlotManagement() {
  const {
    toast
  } = useToast();
  const {
    users
  } = useUsers();
  const {
    slots,
    addSlot,
    addSlotBlock,
    updateSlot,
    deleteSlot
  } = useSlots();
  const {
    getSlotStatus
  } = useConsecutiveSlots();
  const {
    settings
  } = useSlotDesign();
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "booked" | "available">("all");
  const [selectedSlotForDetails, setSelectedSlotForDetails] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedCraneOperator, setSelectedCraneOperator] = useState<string>("");
  const [showMySlots, setShowMySlots] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Helper function to get slot colors based on current design
  const getSlotColors = (status: 'available' | 'booked' | 'blocked') => {
    return settings[status];
  };

  // Get crane operators from database - Admin, Vorstand und Kranführer
  const craneOperators = users.filter(u => u.roles?.includes("kranfuehrer") || u.roles?.includes("admin") || u.roles?.includes("vorstand") || u.role === "kranfuehrer" || u.role === "admin" || u.role === "vorstand");

  // CRITICAL FIX: Add current user to crane operators if eligible (same as in SlotForm)
  const {
    currentUser
  } = useRole();
  const currentUserAsCraneOperator = currentUser && (currentUser.roles?.includes("kranfuehrer") || currentUser.roles?.includes("admin") || currentUser.roles?.includes("vorstand") || currentUser.role === "kranfuehrer" || currentUser.role === "admin" || currentUser.role === "vorstand") ? currentUser : null;

  // Ensure current user is included in crane operators list
  const allCraneOperators = currentUserAsCraneOperator && !craneOperators.find(op => op.id === currentUserAsCraneOperator.id) ? [...craneOperators, currentUserAsCraneOperator] : craneOperators;
  console.log('🔐 SLOT MANAGEMENT CRANE OPERATORS:', allCraneOperators.map(op => `${op.name} (${op.id})`));
  const handleOpenForm = (slot?: Slot) => {
    setEditingSlot(slot || null);
    setIsEditing(true);
  };
  const handleFormSubmit = async (formData: SharedSlotFormData) => {
    if (!formData.date || !formData.time || !formData.craneOperatorId) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }
    const craneOperator = allCraneOperators.find(op => op.id === formData.craneOperatorId);
    if (!craneOperator) {
      console.log('❌ Crane operator not found for ID:', formData.craneOperatorId, 'Available operators:', allCraneOperators.map(op => `${op.name} (${op.id})`));
      return;
    }
    if (editingSlot) {
      // Update existing slot with new booking status and member data
      // Use the member ID from formData if provided (from role-switched user), otherwise from editingSlot
      const memberId = formData.isBooked ? formData.memberId || editingSlot.member?.id || currentUser?.id : undefined;
      const memberData = formData.isBooked && formData.memberName ? {
        id: memberId || `member-${Date.now()}`,
        name: formData.memberName,
        email: formData.memberEmail || "",
        memberNumber: formData.memberNumber || ""
      } : undefined;
      updateSlot(editingSlot.id, {
        date: format(formData.date!, 'yyyy-MM-dd'),
        time: formData.time,
        duration: formData.slotBlockDurations?.[0] || 60,
        // Use first duration from block
        craneOperator,
        notes: formData.notes,
        isBooked: formData.isBooked || false,
        memberName: memberData?.name,
        memberId: memberId
      });
      toast({
        title: "Slot aktualisiert",
        description: "Der Slot wurde erfolgreich aktualisiert."
      });
    } else {
      // Create new slot(s) - always as block now
      const durations = formData.slotBlockDurations || [60];
      const dateString = format(formData.date!, 'yyyy-MM-dd');
      console.log('📝 CREATING NEW SLOTS:', {
        date: dateString,
        time: formData.time,
        durations,
        operator: craneOperator.name
      });

      // Build slots array
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
            email: craneOperator.email || ''
          },
          notes: formData.notes || ''
        });

        // Calculate next time slot
        const nextTime = addMinutes(parse(`${dateString} ${currentTime}`, 'yyyy-MM-dd HH:mm', new Date()), duration);
        currentTime = format(nextTime, 'HH:mm');
      }
      console.log('📤 Slots to create:', slotsToCreate);

      // Create all slots as a block
      try {
        await addSlotBlock(slotsToCreate);
        const message = durations.length === 1 ? 'Termin erfolgreich erstellt.' : `Terminblock mit ${durations.length} Terminen erfolgreich erstellt.`;
        toast({
          title: "Erfolg",
          description: message
        });
      } catch (error) {
        console.error('❌ Error creating slots:', error);
        toast({
          title: "Fehler",
          description: "Die Termine konnten nicht erstellt werden.",
          variant: "destructive"
        });
        return;
      }
    }
    setIsEditing(false);
    setEditingSlot(null);
  };
  const handleDeleteSlot = (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot?.isBooked) {
      toast({
        title: "Fehler",
        description: "Gebuchte Slots können nicht gelöscht werden.",
        variant: "destructive"
      });
      return;
    }
    deleteSlot(slotId);
    toast({
      title: "Slot gelöscht",
      description: "Der Slot wurde erfolgreich gelöscht."
    });
  };
  const handleCancelSlot = (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot?.isBooked) {
      toast({
        title: "Fehler",
        description: "Nur gebuchte Slots können storniert werden.",
        variant: "destructive"
      });
      return;
    }
    updateSlot(slotId, {
      isBooked: false,
      memberName: undefined,
      memberId: undefined
    });
    toast({
      title: "Slot storniert",
      description: "Die Buchung wurde erfolgreich storniert."
    });
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-AT', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter and sort slots
  const filteredSlots = slots.filter(slot => {
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
    return passesStatusFilter && passesDateFilter && passesOperatorFilter && passesMySlotFilter;
  }).sort((a, b) => {
    // Primary sort: by date
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;

    // Secondary sort: by time
    return a.time.localeCompare(b.time);
  });
  const getFilterTitle = () => {
    switch (activeFilter) {
      case "booked":
        return "Gebuchte Slots";
      case "available":
        return "Verfügbare Slots";
      default:
        return "Alle Slots";
    }
  };
  const stats = {
    total: slots.length,
    booked: slots.filter(s => s.isBooked).length,
    available: slots.filter(s => !s.isBooked).length
  };
  return <div className="flex flex-col h-screen overflow-hidden bg-background max-w-7xl mx-auto">
      {/* Fixed Top Card */}
      <div className="flex-shrink-0 pt-4 pb-0 relative z-10 my-0 px-4">
        <Card className="relative bg-card/95 backdrop-blur-xl border-border/50 shadow-[0_12px_50px_-8px_rgba(0,0,0,0.2)]">
          <CardHeader>
            <CardTitle>Slot-Verwaltung</CardTitle>
            <CardDescription>
              Verwalten Sie alle Kranführer-Slots
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isEditing && <Button onClick={() => handleOpenForm()} size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Neuer Slot</span>
                <span className="sm:hidden">Slot</span>
              </Button>}

            {/* Slot Form - Same layout as Profile */}
            {isEditing && <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingSlot ? "Slot bearbeiten" : "Neuen Slot erstellen"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingSlot ? "Bearbeiten Sie die Slot-Informationen" : "Erstellen Sie einen neuen Kranführer-Slot"}
                  </p>
                </div>
                
                <SlotForm slot={editingSlot || undefined} onSubmit={handleFormSubmit} onCancel={() => {
              setIsEditing(false);
              setEditingSlot(null);
            }} />
              </div>}

            {/* Show stats and filters only when not editing */}
            {!isEditing && <>
                {/* Stats Cards - Collapsible */}
                <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Statistiken
                      </span>
                      {isStatsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    <div className="grid grid-cols-3 gap-3">
                      <Card className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${activeFilter === "all" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveFilter("all")}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Gesamt Slots</p>
                              <p className="text-lg font-bold text-foreground">{stats.total}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${activeFilter === "booked" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveFilter("booked")}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Gebucht</p>
                              <p className="text-lg font-bold text-status-booked">{stats.booked}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${activeFilter === "available" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveFilter("available")}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Verfügbar</p>
                              <p className="text-lg font-bold text-status-available">{stats.available}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Filters - Collapsible */}
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter & Sortierung
                        {(selectedDate || selectedCraneOperator) && <Badge variant="secondary" className="ml-2">
                            {[selectedDate && "Datum", selectedCraneOperator && "Kranführer"].filter(Boolean).length}
                          </Badge>}
                      </span>
                      {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Date Filter */}
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("justify-start text-left font-normal flex-1 sm:flex-initial min-w-[200px]", !selectedDate && "text-muted-foreground")}>
                            <CalendarDays className="w-4 h-4 mr-2" />
                            {selectedDate ? format(selectedDate, "dd. MMMM yyyy", {
                          locale: de
                        }) : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <UICalendar mode="single" selected={selectedDate} onSelect={date => {
                        setSelectedDate(date);
                        setIsDatePickerOpen(false);
                      }} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>

                      {/* Crane Operator Filter */}
                      <Select value={selectedCraneOperator} onValueChange={setSelectedCraneOperator}>
                        <SelectTrigger className="flex-1 sm:flex-initial min-w-[200px]">
                          <SelectValue placeholder="Alle Kranführer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Kranführer</SelectItem>
                          {allCraneOperators.map(operator => <SelectItem key={operator.id} value={operator.id}>
                              {operator.name}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* My Slots Button */}
                      <Button variant={showMySlots ? "default" : "outline"} size="sm" onClick={() => {
                    setShowMySlots(!showMySlots);
                    if (!showMySlots) {
                      setSelectedCraneOperator("");
                    }
                  }} className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Meine Slots
                      </Button>

                      {/* Clear Filters */}
                      {(selectedDate || selectedCraneOperator || showMySlots) && <Button variant="outline" size="sm" onClick={() => {
                    setSelectedDate(undefined);
                    setSelectedCraneOperator("");
                    setShowMySlots(false);
                  }} className="flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Filter löschen
                        </Button>}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>}
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Slots Area */}
      {!isEditing && <div className="flex-1 overflow-y-auto pb-4 pt-2 px-[16px] py-[20px]">
          {/* Desktop/Tablet: Card wrapper */}
          <Card className="hidden md:block border rounded-lg overflow-hidden bg-background">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-foreground border-b pb-2 mb-3">
                {getFilterTitle()} 
                {filteredSlots.length > 0 && <span className="text-muted-foreground ml-2">
                    ({filteredSlots.length} {filteredSlots.length === 1 ? 'Slot' : 'Slots'})
                  </span>}
              </h3>
              
              {filteredSlots.length === 0 ? <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    {selectedDate || selectedCraneOperator ? "Keine Slots mit den gewählten Filtern gefunden" : activeFilter === "all" ? "Keine Slots vorhanden" : "Keine Slots in dieser Kategorie"}
                  </p>
                </div> : <div className="space-y-2">
                {filteredSlots.map(slot => {
              const slotStatus = getSlotStatus(slot, slots);
              const isExpanded = expandedSlotId === slot.id;
              return <Card key={slot.id} className={cn("border transition-all hover:shadow-sm w-full border-2 rounded-lg shadow-sm")} style={(() => {
                const colors = getSlotColors(slotStatus);
                return {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                };
              })()}>
                      {/* Compact Header - Always Visible - Now with Two Lines */}
                      <CardContent className="p-4 cursor-pointer" onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}>
                        <div className="space-y-3">
                          {/* First Line: Time, Duration, and Expand Icon */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" style={{
                            color: getSlotColors(slotStatus).text
                          }} />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-lg" style={{
                              color: getSlotColors(slotStatus).text
                            }}>{slot.time}</span>
                                  <span className="text-xs opacity-75" style={{
                              color: getSlotColors(slotStatus).text
                            }}>
                                    bis {format(addMinutes(parseISO(`${slot.date}T${slot.time}`), slot.duration), 'HH:mm')}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs" style={{
                            backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                            color: getSlotColors(slotStatus).text
                          }}>
                                  {slot.duration}min
                                </Badge>
                              </div>
                               <div className="text-sm font-medium truncate" style={{
                          color: getSlotColors(slotStatus).text
                        }}>
                                 Kranführer: {slot.craneOperator.name}
                                 {slot.isBooked && (slot.memberName || slot.member) && <div className="text-xs opacity-90">
                                     Mitglied: {slot.memberName || slot.member?.name}
                                   </div>}
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp className="w-4 h-4" style={{
                          color: getSlotColors(slotStatus).text
                        }} /> : <ChevronDown className="w-4 h-4" style={{
                          color: getSlotColors(slotStatus).text
                        }} />}
                            </div>
                          </div>

                          {/* Second Line: Date and Booking Status */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm" style={{
                        color: getSlotColors(slotStatus).text
                      }}>
                              {format(parseISO(slot.date), "EEEE, dd. MMMM yyyy", {
                          locale: de
                        })}
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      {/* Expanded Content - Shows on Click */}
                      <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                        <CardContent className="pt-0 pb-3 px-3">
                          <Separator className="mb-3" />
                          
                          <div className="space-y-3">

                             {/* Crane Operator Details */}
                             <div className="flex items-center gap-2 text-sm" style={{
                        color: getSlotColors(slotStatus).text
                      }}>
                               <UserCheck className="w-4 h-4" style={{
                          color: getSlotColors(slotStatus).text
                        }} />
                               <div>
                                 <div>Kranführer: <strong>{slot.craneOperator.name}</strong></div>
                                 {slot.craneOperator.email && <div className="text-xs opacity-80">{slot.craneOperator.email}</div>}
                               </div>
                             </div>
                            
                            {/* Member Info if booked */}
                            {slot.isBooked && slot.member && <div className="flex items-center gap-2 text-sm" style={{
                        color: getSlotColors(slotStatus).text
                      }}>
                                <User className="w-4 h-4" style={{
                          color: getSlotColors(slotStatus).text
                        }} />
                                <div>
                                  <div>Gebucht von: <strong>{slot.member.name}</strong></div>
                                  <div className="flex items-center gap-2 text-xs">
                                    {slot.member.email && <span>{slot.member.email}</span>}
                                    {slot.member.memberNumber && <Badge variant="secondary" className="text-xs" style={{
                              backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                              color: getSlotColors(slotStatus).text
                            }}>
                                        {slot.member.memberNumber}
                                      </Badge>}
                                  </div>
                                </div>
                              </div>}

                            {/* Notes */}
                            {slot.notes && <div className="text-sm rounded-md p-2 opacity-90" style={{
                        color: getSlotColors(slotStatus).text,
                        backgroundColor: "hsl(var(--primary-foreground) / 0.1)"
                      }}>
                                {slot.notes}
                              </div>}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button variant="secondary" size="sm" onClick={e => {
                          e.stopPropagation();
                          handleOpenForm(slot);
                        }} className="flex-1" style={{
                          backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                          color: getSlotColors(slotStatus).text,
                          borderColor: "hsl(var(--primary-foreground) / 0.3)"
                        }}>
                                <Edit className="w-4 h-4 mr-1" />
                                Bearbeiten
                              </Button>
                              
                              {slot.isBooked ? <Button variant="secondary" size="sm" onClick={e => {
                          e.stopPropagation();
                          handleCancelSlot(slot.id);
                        }} className="flex-1" style={{
                          backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                          color: getSlotColors(slotStatus).text,
                          borderColor: "hsl(var(--primary-foreground) / 0.3)"
                        }}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Stornieren
                                </Button> : <Button variant="secondary" size="sm" onClick={e => {
                          e.stopPropagation();
                          handleDeleteSlot(slot.id);
                        }} className="flex-1" style={{
                          backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                          color: getSlotColors(slotStatus).text,
                          borderColor: "hsl(var(--primary-foreground) / 0.3)"
                        }}>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Löschen
                                </Button>}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>;
            })}
              </div>}
            </CardContent>
          </Card>

          {/* Mobile: No card wrapper */}
          <div className="md:hidden space-y-3">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">
              {getFilterTitle()} 
              {filteredSlots.length > 0 && <span className="text-muted-foreground ml-2">
                  ({filteredSlots.length} {filteredSlots.length === 1 ? 'Slot' : 'Slots'})
                </span>}
            </h3>
            
            {filteredSlots.length === 0 ? <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  {selectedDate || selectedCraneOperator ? "Keine Slots mit den gewählten Filtern gefunden" : activeFilter === "all" ? "Keine Slots vorhanden" : "Keine Slots in dieser Kategorie"}
                </p>
              </div> : <div className="space-y-2">
              {filteredSlots.map(slot => {
            const slotStatus = getSlotStatus(slot, slots);
            const isExpanded = expandedSlotId === slot.id;
            return <Card key={slot.id} className={cn("border transition-all hover:shadow-sm w-full border-2 rounded-lg shadow-sm")} style={(() => {
              const colors = getSlotColors(slotStatus);
              return {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              };
            })()}>
                    {/* Compact Header - Always Visible - Now with Two Lines */}
                    <CardContent className="p-4 cursor-pointer" onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}>
                      <div className="space-y-3">
                        {/* First Line: Time, Duration, and Expand Icon */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" style={{
                          color: getSlotColors(slotStatus).text
                        }} />
                              <div className="flex flex-col">
                                <span className="font-semibold text-lg" style={{
                            color: getSlotColors(slotStatus).text
                          }}>{slot.time}</span>
                                <span className="text-xs opacity-75" style={{
                            color: getSlotColors(slotStatus).text
                          }}>
                                  bis {format(addMinutes(parseISO(`${slot.date}T${slot.time}`), slot.duration), 'HH:mm')}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs" style={{
                          backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                          color: getSlotColors(slotStatus).text
                        }}>
                                {slot.duration}min
                              </Badge>
                            </div>
                             <div className="text-sm font-medium truncate" style={{
                        color: getSlotColors(slotStatus).text
                      }}>
                               Kranführer: {slot.craneOperator.name}
                               {slot.isBooked && (slot.memberName || slot.member) && <div className="text-xs opacity-90">
                                   Mitglied: {slot.memberName || slot.member?.name}
                                 </div>}
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp className="w-4 h-4" style={{
                        color: getSlotColors(slotStatus).text
                      }} /> : <ChevronDown className="w-4 h-4" style={{
                        color: getSlotColors(slotStatus).text
                      }} />}
                          </div>
                        </div>

                        {/* Second Line: Date and Booking Status */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm" style={{
                      color: getSlotColors(slotStatus).text
                    }}>
                            {format(parseISO(slot.date), "EEEE, dd. MMMM yyyy", {
                        locale: de
                      })}
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Expanded Content - Shows on Click */}
                    <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                      <CardContent className="pt-0 pb-3 px-3">
                        <Separator className="mb-3" />
                        
                        <div className="space-y-3">

                           {/* Crane Operator Details */}
                           <div className="flex items-center gap-2 text-sm" style={{
                      color: getSlotColors(slotStatus).text
                    }}>
                             <UserCheck className="w-4 h-4" style={{
                        color: getSlotColors(slotStatus).text
                      }} />
                             <div>
                               <div>Kranführer: <strong>{slot.craneOperator.name}</strong></div>
                               {slot.craneOperator.email && <div className="text-xs opacity-80">{slot.craneOperator.email}</div>}
                             </div>
                           </div>
                          
                          {/* Member Info if booked */}
                          {slot.isBooked && slot.member && <div className="flex items-center gap-2 text-sm" style={{
                      color: getSlotColors(slotStatus).text
                    }}>
                              <User className="w-4 h-4" style={{
                        color: getSlotColors(slotStatus).text
                      }} />
                              <div>
                                <div>Gebucht von: <strong>{slot.member.name}</strong></div>
                                <div className="flex items-center gap-2 text-xs">
                                  {slot.member.email && <span>{slot.member.email}</span>}
                                  {slot.member.memberNumber && <Badge variant="secondary" className="text-xs" style={{
                            backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                            color: getSlotColors(slotStatus).text
                          }}>
                                      {slot.member.memberNumber}
                                    </Badge>}
                                </div>
                              </div>
                            </div>}

                          {/* Notes */}
                          {slot.notes && <div className="text-sm rounded-md p-2 opacity-90" style={{
                      color: getSlotColors(slotStatus).text,
                      backgroundColor: "hsl(var(--primary-foreground) / 0.1)"
                    }}>
                              {slot.notes}
                            </div>}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button variant="secondary" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleOpenForm(slot);
                      }} className="flex-1" style={{
                        backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                        color: getSlotColors(slotStatus).text,
                        borderColor: "hsl(var(--primary-foreground) / 0.3)"
                      }}>
                              <Edit className="w-4 h-4 mr-1" />
                              Bearbeiten
                            </Button>
                            
                            {slot.isBooked ? <Button variant="secondary" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleCancelSlot(slot.id);
                      }} className="flex-1" style={{
                        backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                        color: getSlotColors(slotStatus).text,
                        borderColor: "hsl(var(--primary-foreground) / 0.3)"
                      }}>
                                <XCircle className="w-4 h-4 mr-1" />
                                Stornieren
                              </Button> : <Button variant="secondary" size="sm" onClick={e => {
                        e.stopPropagation();
                        handleDeleteSlot(slot.id);
                      }} className="flex-1" style={{
                        backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                        color: getSlotColors(slotStatus).text,
                        borderColor: "hsl(var(--primary-foreground) / 0.3)"
                      }}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Löschen
                              </Button>}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>;
          })}
            </div>}
          </div>
        </div>}

      {/* Slot Details Dialog */}
      <Dialog open={!!selectedSlotForDetails} onOpenChange={() => setSelectedSlotForDetails(null)}>
        <DialogContent className="max-w-md">
          {selectedSlotForDetails && <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Slot Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex justify-center">
                  <StatusLabel status={getSlotStatus(selectedSlotForDetails, slots) as "available" | "booked" | "blocked"} size="md">
                    {getSlotStatus(selectedSlotForDetails, slots) === 'booked' ? "Gebucht" : getSlotStatus(selectedSlotForDetails, slots) === 'blocked' ? "Gesperrt" : "Verfügbar"}
                  </StatusLabel>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Datum
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {formatDate(selectedSlotForDetails.date)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Zeit
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {selectedSlotForDetails.time}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Dauer
                  </div>
                  <div className="pl-6">
                    <Badge variant="secondary" className="text-sm">
                      {selectedSlotForDetails.duration} Minuten
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Crane Operator Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    Kranführer
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{selectedSlotForDetails.craneOperator.name}</span>
                    </div>
                    {selectedSlotForDetails.craneOperator.email && <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{selectedSlotForDetails.craneOperator.email}</span>
                      </div>}
                  </div>
                </div>

                {/* Member Info - only if booked */}
                {selectedSlotForDetails.isBooked && selectedSlotForDetails.member && <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                        <UserCheck className="w-4 h-4" />
                        Gebucht von
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{selectedSlotForDetails.member.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedSlotForDetails.member.memberNumber}
                          </Badge>
                        </div>
                        {selectedSlotForDetails.member.email && <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{selectedSlotForDetails.member.email}</span>
                          </div>}
                      </div>
                    </div>
                  </>}

                {/* Notes */}
                {selectedSlotForDetails.notes && <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Notizen</div>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                        {selectedSlotForDetails.notes}
                      </p>
                    </div>
                  </>}

                {/* Action Buttons */}
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                setSelectedSlotForDetails(null);
                handleOpenForm(selectedSlotForDetails);
              }} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </Button>
                  {!selectedSlotForDetails.isBooked && <Button variant="outline" onClick={() => {
                setSelectedSlotForDetails(null);
                handleDeleteSlot(selectedSlotForDetails.id);
              }} className="flex-1">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </Button>}
                </div>
              </div>
            </>}
        </DialogContent>
      </Dialog>
    </div>;
}