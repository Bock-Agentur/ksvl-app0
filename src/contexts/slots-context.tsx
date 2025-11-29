import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Slot } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRealtimeSubscription } from '@/lib/realtime-manager';
import { useUsersData } from '@/hooks/use-users-data';
import { slotService } from '@/lib/services/slot-service';
import { CreateSlotData } from '@/hooks/use-slots';
import { logger } from '@/lib/logger';

interface SlotsContextValue {
  slots: Slot[];
  isLoading: boolean;
  addSlot: (slotData: CreateSlotData) => Promise<Slot>;
  addSlotBlock: (slotsData: CreateSlotData[]) => Promise<Slot[]>;
  updateSlot: (id: string, updates: Partial<CreateSlotData> & { memberId?: string; memberName?: string }) => Promise<any>;
  deleteSlot: (id: string) => Promise<void>;
  bookSlot: (slotId: string, memberId: string) => Promise<any>;
  cancelBooking: (slotId: string) => Promise<any>;
  refetchSlots: () => void;
}

const SlotsContext = createContext<SlotsContextValue | undefined>(undefined);

export function SlotsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { users: allUsers, isLoading: usersLoading } = useUsersData({ enabled: !!authUser });

  // Fetch slots with React Query
  const {
    data: slots = [],
    isLoading: slotsLoading,
    refetch: refetchSlots
  } = useQuery({
    queryKey: ['slots', allUsers.length],
    queryFn: async () => {
      console.log('🔄 [SlotsContext] Fetching slots from database');
      logger.info('Fetching slots from database (React Query)', 'slots-context');
      
      const slotsData = await slotService.fetchSlots();
      console.log('📦 [SlotsContext] Raw slots from DB:', slotsData?.length || 0);

      if (!slotsData || slotsData.length === 0) {
        console.log('❌ [SlotsContext] No slots data received');
        return [];
      }

      // Create a map for quick profile lookup
      const profilesMap = new Map(allUsers.map(u => [u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        member_number: u.memberNumber
      }]));
      console.log('👥 [SlotsContext] User profiles map size:', profilesMap.size);

      // Transform database format to app format
      const transformedSlots: Slot[] = (slotsData || []).map(dbSlot => {
        const craneOperator = profilesMap.get(dbSlot.crane_operator_id);
        const member = dbSlot.member_id ? profilesMap.get(dbSlot.member_id) : null;

        // Normalize time format - remove seconds if present
        let normalizedTime = dbSlot.time;
        if (normalizedTime && normalizedTime.length === 8) {
          normalizedTime = normalizedTime.substring(0, 5);
        }

        return {
          id: dbSlot.id,
          date: dbSlot.date,
          time: normalizedTime,
          duration: dbSlot.duration as 15 | 30 | 45 | 60,
          craneOperator: {
            id: dbSlot.crane_operator_id,
            name: craneOperator?.name || 'Unbekannt',
            email: craneOperator?.email || ''
          },
          memberId: dbSlot.member_id || undefined,
          memberName: member?.name || undefined,
          member: member ? {
            id: member.id,
            name: member.name || '',
            email: member.email || '',
            memberNumber: member.member_number || ''
          } : undefined,
          isBooked: dbSlot.is_booked || false,
          bookedBy: member?.name || undefined,
          notes: dbSlot.notes || undefined,
          blockId: dbSlot.block_id || undefined,
          isMiniSlot: dbSlot.is_mini_slot || false,
          miniSlotCount: dbSlot.mini_slot_count || undefined,
          startMinute: (dbSlot.start_minute as 0 | 15 | 30 | 45) || undefined
        };
      });

      console.log('✅ [SlotsContext] Transformed', transformedSlots.length, 'slots');
      console.log('📊 [SlotsContext] Sample slot:', transformedSlots[0]);
      logger.info(`Transformed ${transformedSlots.length} slots`, 'slots-context');
      return transformedSlots;
    },
    enabled: !!authUser && allUsers.length > 0,
    staleTime: 1000 * 60, // 1 Minute
    refetchOnWindowFocus: false
  });

  // Mutations
  const addSlotMutation = useMutation({
    mutationFn: async (slotData: CreateSlotData) => {
      const data = await slotService.createSlot(slotData);
      return {
        id: data.id,
        date: data.date,
        time: data.time,
        duration: data.duration as 15 | 30 | 45 | 60,
        craneOperator: {
          id: slotData.craneOperator.id,
          name: slotData.craneOperator.name,
          email: slotData.craneOperator.email
        },
        isBooked: data.is_booked || false,
        notes: data.notes || undefined,
        blockId: data.block_id || undefined
      } as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  });

  const addSlotBlockMutation = useMutation({
    mutationFn: async (slotsData: CreateSlotData[]) => {
      const data = await slotService.createSlotBlock(slotsData);
      return (data || []).map((dbSlot, index) => ({
        id: dbSlot.id,
        date: dbSlot.date,
        time: dbSlot.time,
        duration: dbSlot.duration as 15 | 30 | 45 | 60,
        craneOperator: {
          id: slotsData[index].craneOperator.id,
          name: slotsData[index].craneOperator.name,
          email: slotsData[index].craneOperator.email
        },
        isBooked: dbSlot.is_booked || false,
        notes: dbSlot.notes || undefined,
        blockId: dbSlot.block_id || undefined
      })) as Slot[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Slotblock konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  });

  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateSlotData> & { memberId?: string; memberName?: string } }) => {
      return await slotService.updateSlot(id, {
        date: updates.date,
        time: updates.time,
        duration: updates.duration,
        craneOperatorId: updates.craneOperator?.id,
        notes: updates.notes,
        isBooked: updates.isBooked,
        memberId: updates.memberId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      await slotService.deleteSlot(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  });

  const bookSlotMutation = useMutation({
    mutationFn: async ({ slotId, memberId }: { slotId: string; memberId: string }) => {
      logger.info(`Booking slot ${slotId} for member ${memberId}`, 'slots-context');
      const memberProfile = await slotService.fetchMemberProfile(memberId);
      logger.info(`Member profile fetched: ${memberProfile?.name}`, 'slots-context');
      
      const data = await slotService.bookSlot(slotId, memberId);
      logger.info('Booking completed successfully', 'slots-context');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht gebucht werden.',
        variant: 'destructive'
      });
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (slotId: string) => {
      logger.info(`Canceling booking for slot ${slotId}`, 'slots-context');
      const data = await slotService.cancelBooking(slotId);
      logger.info('Booking canceled successfully', 'slots-context');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht storniert werden.',
        variant: 'destructive'
      });
    }
  });

  // Realtime subscription
  useRealtimeSubscription(
    { table: 'slots', event: '*' },
    'slots-context-realtime',
    (payload) => {
      logger.info(`Realtime update received: ${payload.eventType || payload.event}`, 'slots-context');
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    300,
    true
  );

  const value: SlotsContextValue = {
    slots,
    isLoading: slotsLoading || usersLoading,
    addSlot: (slotData) => addSlotMutation.mutateAsync(slotData),
    addSlotBlock: (slotsData) => addSlotBlockMutation.mutateAsync(slotsData),
    updateSlot: (id, updates) => updateSlotMutation.mutateAsync({ id, updates }),
    deleteSlot: (id) => deleteSlotMutation.mutateAsync(id),
    bookSlot: (slotId, memberId) => bookSlotMutation.mutateAsync({ slotId, memberId }),
    cancelBooking: (slotId) => cancelBookingMutation.mutateAsync(slotId),
    refetchSlots: () => refetchSlots()
  };

  return (
    <SlotsContext.Provider value={value}>
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
