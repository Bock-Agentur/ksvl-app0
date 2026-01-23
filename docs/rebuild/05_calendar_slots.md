# KSVL Slot Manager - Krankalender & Slot-System

## 1. Übersicht

Das Slot-System ist das Herzstück der KSVL App und ermöglicht:
- Krantermin-Buchungen für Bootsbesitzer
- 15-Minuten-Intervall-System für präzise Zeitplanung
- Kalenderansichten (Tag, Woche, Monat, Liste)
- Consecutive Slots Feature (Folgebuchungen)
- Slot-Block-Erstellung (mehrere Slots gleichzeitig)

## 2. Slot Datenmodell

**Datei:** `src/types/slot.ts`

```typescript
export interface CraneOperator {
  id: string;
  name: string;
  email?: string;
}

export interface SlotMember {
  id: string;
  name: string;
  boatName?: string;
  phone?: string;
}

export interface Slot {
  id: string;
  date: string;           // ISO Date (YYYY-MM-DD)
  time: string;           // HH:MM format
  duration: number;       // in Minuten (15, 30, 45, 60, etc.)
  craneOperator: CraneOperator;
  isBooked: boolean;
  member?: SlotMember;
  notes?: string;
  
  // Block/Mini-Slot Features
  blockId?: string;       // Gruppen-ID für Block-Buchungen
  isMiniSlot?: boolean;   // 15-Minuten-Intervall
  miniSlotCount?: number; // Anzahl der Mini-Slots
  startMinute?: number;   // Startminute (0, 15, 30, 45)
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export type SlotStatus = 'available' | 'booked' | 'blocked';

export interface SlotFormData {
  date: Date;
  time: string;
  duration: number;
  craneOperatorId: string;
  notes?: string;
  isBooked?: boolean;
  memberId?: string;
  slotDurations?: number[];
}
```

## 3. SlotsContext

**Datei:** `src/contexts/slots-context.tsx`

```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { slotService } from '@/lib/services/slot-service';
import { QUERY_KEYS } from '@/lib/query-keys';
import { Slot, CreateSlotData } from '@/types';

interface SlotsContextType {
  slots: Slot[];
  isLoading: boolean;
  addSlot: (data: CreateSlotData) => Promise<void>;
  addSlotBlock: (data: CreateSlotData[]) => Promise<void>;
  updateSlot: (id: string, data: Partial<Slot>) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;
  bookSlot: (slotId: string, memberId: string) => Promise<void>;
  cancelBooking: (slotId: string) => Promise<void>;
  refetchSlots: () => Promise<void>;
}

const SlotsContext = createContext<SlotsContextType | undefined>(undefined);

export function SlotsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch slots with user profiles
  const { data: slots = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.slots,
    queryFn: async () => {
      const rawSlots = await slotService.fetchSlots();
      
      // Fetch profiles for crane operators and members
      const userIds = new Set<string>();
      rawSlots.forEach(s => {
        if (s.crane_operator_id) userIds.add(s.crane_operator_id);
        if (s.member_id) userIds.add(s.member_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, first_name, last_name, email, boat_name, phone')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return rawSlots.map(slot => ({
        id: slot.id,
        date: slot.date,
        time: slot.time,
        duration: slot.duration,
        isBooked: slot.is_booked,
        notes: slot.notes,
        blockId: slot.block_id,
        isMiniSlot: slot.is_mini_slot,
        miniSlotCount: slot.mini_slot_count,
        startMinute: slot.start_minute,
        craneOperator: {
          id: slot.crane_operator_id,
          name: profileMap.get(slot.crane_operator_id)?.name || 'Unbekannt',
          email: profileMap.get(slot.crane_operator_id)?.email,
        },
        member: slot.member_id ? {
          id: slot.member_id,
          name: profileMap.get(slot.member_id)?.name || 'Unbekannt',
          boatName: profileMap.get(slot.member_id)?.boat_name,
          phone: profileMap.get(slot.member_id)?.phone,
        } : undefined,
      }));
    },
    staleTime: 60 * 1000,
  });

  // Mutations
  const addSlotMutation = useMutation({
    mutationFn: slotService.createSlot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots }),
  });

  const addSlotBlockMutation = useMutation({
    mutationFn: slotService.createSlotBlock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots }),
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => slotService.updateSlot(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots }),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: slotService.deleteSlot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots }),
  });

  const bookSlotMutation = useMutation({
    mutationFn: ({ slotId, memberId }: { slotId: string; memberId: string }) => 
      slotService.bookSlot(slotId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots }),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: slotService.cancelBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots }),
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('slots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <SlotsContext.Provider value={{
      slots,
      isLoading,
      addSlot: (data) => addSlotMutation.mutateAsync(data),
      addSlotBlock: (data) => addSlotBlockMutation.mutateAsync(data),
      updateSlot: (id, data) => updateSlotMutation.mutateAsync({ id, data }),
      deleteSlot: (id) => deleteSlotMutation.mutateAsync(id),
      bookSlot: (slotId, memberId) => bookSlotMutation.mutateAsync({ slotId, memberId }),
      cancelBooking: (slotId) => cancelBookingMutation.mutateAsync(slotId),
      refetchSlots: async () => {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.slots });
      },
    }}>
      {children}
    </SlotsContext.Provider>
  );
}

export function useSlotsContext() {
  const context = useContext(SlotsContext);
  if (!context) {
    throw new Error('useSlotsContext must be used within SlotsProvider');
  }
  return context;
}
```

## 4. useSlots Hook (Bridge)

**Datei:** `src/hooks/core/data/use-slots.tsx`

```typescript
import { useSlotsContext } from '@/contexts/slots-context';

export interface CreateSlotData {
  date: string;
  time: string;
  duration: number;
  craneOperator: CraneOperator;
  notes?: string;
  isBooked?: boolean;
  bookedBy?: string;
  blockId?: string;
}

/**
 * Bridge-Hook for backwards compatibility
 * All operations delegate to SlotsContext
 */
export function useSlots(options?: { enabled?: boolean }) {
  const context = useSlotsContext();
  
  return {
    slots: context.slots,
    isLoading: context.isLoading,
    addSlot: context.addSlot,
    addSlotBlock: context.addSlotBlock,
    updateSlot: context.updateSlot,
    deleteSlot: context.deleteSlot,
    bookSlot: context.bookSlot,
    cancelBooking: context.cancelBooking,
    refetchSlots: context.refetchSlots,
  };
}
```

## 5. Slot Service

**Datei:** `src/lib/services/slot-service.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import { CreateSlotData } from '@/hooks/core/data/use-slots';

class SlotService {
  async fetchSlots() {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createSlot(slotData: CreateSlotData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nicht angemeldet');

    const { error } = await supabase
      .from('slots')
      .insert({
        date: slotData.date,
        time: slotData.time,
        duration: slotData.duration,
        crane_operator_id: slotData.craneOperator.id,
        notes: slotData.notes,
        is_booked: slotData.isBooked || false,
        member_id: slotData.bookedBy,
      });

    if (error) throw error;
  }

  async createSlotBlock(slotsData: CreateSlotData[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nicht angemeldet');

    const blockId = crypto.randomUUID();

    const { error } = await supabase
      .from('slots')
      .insert(slotsData.map(slot => ({
        date: slot.date,
        time: slot.time,
        duration: slot.duration,
        crane_operator_id: slot.craneOperator.id,
        notes: slot.notes,
        is_booked: false,
        block_id: blockId,
      })));

    if (error) throw error;
  }

  async updateSlot(id: string, updates: any) {
    const { error } = await supabase
      .from('slots')
      .update({
        date: updates.date,
        time: updates.time,
        duration: updates.duration,
        crane_operator_id: updates.craneOperatorId,
        notes: updates.notes,
        is_booked: updates.isBooked,
        member_id: updates.memberId,
      })
      .eq('id', id);

    if (error) throw error;
  }

  async deleteSlot(id: string) {
    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async bookSlot(slotId: string, memberId: string) {
    const { error } = await supabase
      .from('slots')
      .update({ is_booked: true, member_id: memberId })
      .eq('id', slotId);

    if (error) throw error;
  }

  async cancelBooking(slotId: string) {
    const { error } = await supabase
      .from('slots')
      .update({ is_booked: false, member_id: null })
      .eq('id', slotId);

    if (error) throw error;
  }
}

export const slotService = new SlotService();
```

## 6. SlotViewModel Pattern

**Datei:** `src/lib/slots/slot-view-model.ts`

```typescript
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Slot, SlotStatus } from '@/types';

export const STATUS_LABELS: Record<SlotStatus, string> = {
  available: 'Verfügbar',
  booked: 'Gebucht',
  blocked: 'Gesperrt',
};

export function formatDuration(minutes: number): string {
  return `${minutes} Min.`;
}

export function formatTime(time: string): string {
  return `${time} Uhr`;
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return format(date, 'EEE, dd.MM.yyyy', { locale: de });
}

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return format(date, 'EEEE, dd. MMMM yyyy', { locale: de });
}

export interface SlotViewModel {
  id: string;
  date: string;
  time: string;
  duration: number;
  
  // Status
  status: SlotStatus;
  statusLabel: string;
  
  // Crane Operator
  craneOperatorId: string;
  craneOperatorName: string;
  
  // Booked Member
  isBooked: boolean;
  memberId?: string;
  memberName?: string;
  memberBoatName?: string;
  
  // Notes
  notes?: string;
  
  // Block/Mini-Slot
  blockId?: string;
  isMiniSlot: boolean;
  
  // Formatted
  formattedDate: string;
  formattedDateLong: string;
  formattedTime: string;
  formattedDuration: string;
  
  // Design
  bgColor: string;
  borderColor: string;
  textColor: string;
  labelColor: string;
}

export interface MapSlotOptions {
  allSlots: Slot[];
  getStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  designSettings: any;
}

export function mapSlotToViewModel(slot: Slot, options: MapSlotOptions): SlotViewModel {
  const status = options.getStatus(slot, options.allSlots);
  const design = options.designSettings[status] || options.designSettings.available;

  return {
    id: slot.id,
    date: slot.date,
    time: slot.time,
    duration: slot.duration,
    
    status,
    statusLabel: STATUS_LABELS[status],
    
    craneOperatorId: slot.craneOperator.id,
    craneOperatorName: slot.craneOperator.name,
    
    isBooked: slot.isBooked,
    memberId: slot.member?.id,
    memberName: slot.member?.name,
    memberBoatName: slot.member?.boatName,
    
    notes: slot.notes,
    blockId: slot.blockId,
    isMiniSlot: slot.isMiniSlot || false,
    
    formattedDate: formatDateShort(slot.date),
    formattedDateLong: formatDateLong(slot.date),
    formattedTime: formatTime(slot.time),
    formattedDuration: formatDuration(slot.duration),
    
    bgColor: design.background,
    borderColor: design.border,
    textColor: design.text,
    labelColor: design.label,
  };
}

export function mapSlotsToViewModels(slots: Slot[], options: MapSlotOptions): SlotViewModel[] {
  return slots.map(slot => mapSlotToViewModel(slot, options));
}
```

## 7. Consecutive Slots Feature

**Datei:** `src/hooks/use-consecutive-slots.tsx`

```typescript
import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Slot, SlotStatus } from '@/types';
import { useSettingsBatch } from '@/hooks/core/settings';

interface ConsecutiveSlotsContextType {
  selectedSlotId: string | null;
  setSelectedSlotId: (id: string | null) => void;
  getSlotStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  validateConsecutiveBooking: (slot: Slot, allSlots: Slot[]) => boolean;
  isConsecutiveSlotsEnabled: boolean;
}

const ConsecutiveSlotsContext = createContext<ConsecutiveSlotsContextType | undefined>(undefined);

export function ConsecutiveSlotsProvider({ children }: { children: ReactNode }) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const { getSetting } = useSettingsBatch();
  
  const isConsecutiveSlotsEnabled = getSetting('consecutiveSlotsEnabled', false);

  const getSlotStatus = (slot: Slot, allSlots: Slot[]): SlotStatus => {
    if (slot.isBooked) return 'booked';
    
    if (!isConsecutiveSlotsEnabled) return 'available';
    
    // Find previous booked slot on same day
    const sameDaySlots = allSlots
      .filter(s => s.date === slot.date)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    const slotIndex = sameDaySlots.findIndex(s => s.id === slot.id);
    
    // Check if there's a booked slot before this one
    for (let i = 0; i < slotIndex; i++) {
      if (sameDaySlots[i].isBooked) {
        // Check if this slot is adjacent
        const prevSlot = sameDaySlots[i];
        const prevEndTime = addMinutes(prevSlot.time, prevSlot.duration);
        
        // If there's a gap, this slot is blocked (not directly after booked slot)
        if (slot.time > prevEndTime) {
          return 'blocked';
        }
      }
    }
    
    return 'available';
  };

  const validateConsecutiveBooking = (slot: Slot, allSlots: Slot[]): boolean => {
    if (!isConsecutiveSlotsEnabled) return true;
    
    const status = getSlotStatus(slot, allSlots);
    return status === 'available';
  };

  return (
    <ConsecutiveSlotsContext.Provider value={{
      selectedSlotId,
      setSelectedSlotId,
      getSlotStatus,
      validateConsecutiveBooking,
      isConsecutiveSlotsEnabled,
    }}>
      {children}
    </ConsecutiveSlotsContext.Provider>
  );
}

export function useConsecutiveSlots() {
  const context = useContext(ConsecutiveSlotsContext);
  if (!context) {
    throw new Error('useConsecutiveSlots must be used within ConsecutiveSlotsProvider');
  }
  return context;
}
```

## 8. Calendar Views

### 8.1 CalendarView (Main Component)

**Datei:** `src/components/calendar-view.tsx`

```typescript
interface CalendarViewProps {
  initialDate?: Date | null;
}

export function CalendarView({ initialDate }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const { canManageSlots } = usePermissions();

  return (
    <div className="space-y-4">
      <CalendarNavigation
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        showListView={canManageSlots}
      />
      
      {viewMode === 'day' && (
        <DayViewContent date={selectedDate} onSlotClick={handleSlotClick} />
      )}
      
      {viewMode === 'week' && (
        <WeekCalendar date={selectedDate} onSlotClick={handleSlotClick} />
      )}
      
      {viewMode === 'month' && (
        <MonthCalendar date={selectedDate} onDayClick={handleDayClick} />
      )}
      
      {viewMode === 'list' && canManageSlots && (
        <SlotListView slots={slots} onSlotEdit={handleSlotEdit} />
      )}
    </div>
  );
}
```

### 8.2 WeekCalendar

**Datei:** `src/components/week-calendar.tsx`

```typescript
interface WeekCalendarProps {
  date: Date;
  onSlotClick: (slot: Slot) => void;
  onDayClick?: (date: Date) => void;
}

export function WeekCalendar({ date, onSlotClick, onDayClick }: WeekCalendarProps) {
  const { slots, isLoading } = useSlots();
  const { getSlotStatus } = useConsecutiveSlots();
  const { settings: designSettings } = useSlotDesign();
  const isMobile = useIsMobile();

  // Get week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { locale: de, weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [date]);

  // Filter slots for this week
  const weekSlots = useMemo(() => {
    const weekStart = format(weekDays[0], 'yyyy-MM-dd');
    const weekEnd = format(weekDays[6], 'yyyy-MM-dd');
    
    return slots.filter(slot => 
      slot.date >= weekStart && slot.date <= weekEnd
    );
  }, [slots, weekDays]);

  // Map to ViewModels
  const slotViewModels = useMemo(() => {
    return mapSlotsToViewModels(weekSlots, {
      allSlots: slots,
      getStatus: getSlotStatus,
      designSettings,
    });
  }, [weekSlots, slots, getSlotStatus, designSettings]);

  if (isMobile) {
    return <MobileWeekView weekDays={weekDays} slots={slotViewModels} onSlotClick={onSlotClick} />;
  }

  return <DesktopWeekGrid weekDays={weekDays} slots={slotViewModels} onSlotClick={onSlotClick} />;
}
```

### 8.3 MonthCalendar

**Datei:** `src/components/month-calendar.tsx`

```typescript
interface MonthCalendarProps {
  date: Date;
  onDayClick: (date: Date) => void;
}

export function MonthCalendar({ date, onDayClick }: MonthCalendarProps) {
  const { slots } = useSlots();

  // Calculate stats per day
  const dayStats = useMemo(() => {
    const stats: Record<string, DayStats> = {};
    
    slots.forEach(slot => {
      if (!stats[slot.date]) {
        stats[slot.date] = { total: 0, available: 0, booked: 0 };
      }
      stats[slot.date].total++;
      if (slot.isBooked) {
        stats[slot.date].booked++;
      } else {
        stats[slot.date].available++;
      }
    });
    
    return stats;
  }, [slots]);

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={(d) => d && onDayClick(d)}
      locale={de}
      components={{
        DayContent: ({ date: dayDate }) => {
          const dateStr = format(dayDate, 'yyyy-MM-dd');
          const stats = dayStats[dateStr];
          
          return (
            <div className="flex flex-col items-center">
              <span>{format(dayDate, 'd')}</span>
              {stats && (
                <div className="flex gap-1 mt-1">
                  {stats.available > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                  {stats.booked > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </div>
              )}
            </div>
          );
        },
      }}
    />
  );
}
```

## 9. SlotCard Component

**Datei:** `src/components/slots/slot-card.tsx`

```typescript
interface SlotCardProps {
  slot: SlotViewModel;
  variant: 'compact' | 'list' | 'detail';
  onClick?: () => void;
  onBook?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SlotCard({ slot, variant, onClick, onBook, onCancel, onEdit, onDelete }: SlotCardProps) {
  const { canManageSlots, canBookSlots } = usePermissions();

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="p-2 rounded-md cursor-pointer"
        style={{
          backgroundColor: slot.bgColor,
          borderLeft: `3px solid ${slot.borderColor}`,
        }}
      >
        <p className="text-xs font-medium" style={{ color: slot.textColor }}>
          {slot.formattedTime}
        </p>
        <p className="text-xs" style={{ color: slot.labelColor }}>
          {slot.formattedDuration}
        </p>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{slot.formattedDate}</h4>
            <p className="text-sm text-muted-foreground">
              {slot.formattedTime} · {slot.formattedDuration}
            </p>
            <p className="text-sm">Kranführer: {slot.craneOperatorName}</p>
            {slot.isBooked && slot.memberName && (
              <p className="text-sm">Gebucht von: {slot.memberName}</p>
            )}
          </div>
          <div className="flex gap-2">
            <SlotStatusBadge status={slot.status} />
            <SlotBookingActions
              slot={slot}
              onBook={onBook}
              onCancel={onCancel}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </Card>
    );
  }

  // Detail variant
  return (
    <Card className="p-6">
      <SlotInfoCard slot={slot} />
      <div className="mt-4 flex gap-2">
        {canBookSlots && !slot.isBooked && slot.status === 'available' && (
          <Button onClick={onBook}>Jetzt buchen</Button>
        )}
        {canManageSlots && (
          <>
            <Button variant="outline" onClick={onEdit}>Bearbeiten</Button>
            <Button variant="destructive" onClick={onDelete}>Löschen</Button>
          </>
        )}
      </div>
    </Card>
  );
}
```

## 10. SlotFormDialog

**Datei:** `src/components/slot-form-dialog.tsx`

```typescript
interface SlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: Slot;                    // For editing
  prefilledDate?: Date;
  prefilledTime?: string;
  onSubmit: (data: SlotFormData) => Promise<void>;
}

export function SlotFormDialog({ open, onOpenChange, slot, prefilledDate, prefilledTime, onSubmit }: SlotFormDialogProps) {
  const isEditing = !!slot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Termin bearbeiten' : 'Neuer Krantermin'}
          </DialogTitle>
        </DialogHeader>
        
        <SlotForm
          slot={slot}
          prefilledDateTime={{ date: prefilledDate, time: prefilledTime }}
          onSubmit={async (data) => {
            await onSubmit(data);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## 11. Slot Design Settings

**Datei:** `src/hooks/core/settings/use-slot-design.tsx`

```typescript
export interface SlotDesignSettings {
  available: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
  booked: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
  blocked: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
}

const DEFAULT_TRENDY_DESIGN: SlotDesignSettings = {
  available: {
    background: 'hsl(133, 28%, 68%)',  // trendy-green
    border: 'hsl(133, 28%, 58%)',
    text: 'hsl(133, 28%, 20%)',
    label: 'hsl(133, 28%, 30%)',
  },
  booked: {
    background: 'hsl(202, 85%, 23%)',  // trendy-navy
    border: 'hsl(202, 85%, 18%)',
    text: 'hsl(0, 0%, 100%)',
    label: 'hsl(0, 0%, 90%)',
  },
  blocked: {
    background: 'hsl(348, 77%, 67%)',  // trendy-pink
    border: 'hsl(348, 77%, 57%)',
    text: 'hsl(0, 0%, 100%)',
    label: 'hsl(0, 0%, 90%)',
  },
};

export function useSlotDesign() {
  const { getSetting, updateSetting, isLoading } = useSettingsBatch();
  
  const settings = getSetting<SlotDesignSettings>('slot-design-settings', DEFAULT_TRENDY_DESIGN);

  // Apply to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(settings).forEach(([status, colors]) => {
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--slot-${status}-${key}`, value);
      });
    });
  }, [settings]);

  return {
    settings,
    saveSettings: (newSettings: Partial<SlotDesignSettings>) => 
      updateSetting('slot-design-settings', { ...settings, ...newSettings }, true),
    resetToDefaults: () => 
      updateSetting('slot-design-settings', DEFAULT_TRENDY_DESIGN, true),
    isLoading,
  };
}
```

## 12. Berechtigungs-Matrix

| Aktion | mitglied | kranfuehrer | vorstand | admin |
|--------|----------|-------------|----------|-------|
| Slots anzeigen | ✅ | ✅ | ✅ | ✅ |
| Slots buchen | ✅ | ✅ | ✅ | ✅ |
| Eigene Buchung stornieren | ✅ | ✅ | ✅ | ✅ |
| Slots erstellen | ❌ | ✅ | ✅ | ✅ |
| Eigene Slots bearbeiten | ❌ | ✅ | ✅ | ✅ |
| Alle Slots bearbeiten | ❌ | ❌ | ✅ | ✅ |
| Slots löschen | ❌ | ❌ | ❌ | ✅ |
| Listenansicht | ❌ | ✅ | ✅ | ✅ |

---

**Letzte Aktualisierung**: 2026-01-23
