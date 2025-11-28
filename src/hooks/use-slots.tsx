import { useState, useEffect } from 'react';
import { Slot, CraneOperator } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/lib/realtime-manager';
import { useUsersData } from '@/hooks/use-users-data';
import { slotService } from '@/lib/services/slot-service';

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

export function useSlots(options?: { enabled?: boolean }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const enabled = options?.enabled ?? true;

  // ✅ Use centralized useUsersData for profile lookups
  const { users: allUsers, isLoading: usersLoading } = useUsersData();

  // Fetch all slots from database with profiles data
  const fetchSlots = async () => {
    if (!enabled || usersLoading) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log('🔄 FETCHING SLOTS FROM DATABASE...');
      
      // ✅ Fetch slots via service
      const slotsData = await slotService.fetchSlots();

      console.log('📦 RAW SLOTS DATA:', slotsData);

      // ✅ Use cached user data from useUsersData instead of fetching again
      console.log('👥 USING CACHED USERS DATA:', allUsers);

      // Create a map for quick profile lookup
      const profilesMap = new Map(allUsers.map(u => [u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        member_number: u.memberNumber
      }]));

      // Transform database format to app format
      const transformedSlots: Slot[] = (slotsData || []).map(dbSlot => {
        const craneOperator = profilesMap.get(dbSlot.crane_operator_id);
        const member = dbSlot.member_id ? profilesMap.get(dbSlot.member_id) : null;

        // Normalize time format - remove seconds if present
        let normalizedTime = dbSlot.time;
        if (normalizedTime && normalizedTime.length === 8) { // Format: HH:MM:SS
          normalizedTime = normalizedTime.substring(0, 5); // Get HH:MM only
        }

        console.log(`🔧 Transforming slot ${dbSlot.id}: ${dbSlot.date} ${dbSlot.time} -> ${normalizedTime}`);

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

      console.log('✅ TRANSFORMED SLOTS:', transformedSlots);
      console.log(`📊 Total slots loaded: ${transformedSlots.length}`);

      setSlots(transformedSlots);
    } catch (error) {
      console.error('❌ Error fetching slots:', error);
      toast({
        title: 'Fehler',
        description: 'Slots konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a single slot
  const addSlot = async (slotData: CreateSlotData) => {
    try {
      // ✅ Create slot via service
      const data = await slotService.createSlot(slotData);

      // Transform and add to local state
      const newSlot: Slot = {
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
      };

      setSlots(prev => [...prev, newSlot].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      }));

      return newSlot;
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht erstellt werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Create multiple slots as a block
  const addSlotBlock = async (slotsData: CreateSlotData[]) => {
    try {
      // ✅ Create slot block via service
      const data = await slotService.createSlotBlock(slotsData);

      // Transform and add to local state
      const newSlots: Slot[] = (data || []).map((dbSlot, index) => ({
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
      }));

      setSlots(prev => [...prev, ...newSlots].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      }));

      return newSlots;
    } catch (error) {
      console.error('Error creating slot block:', error);
      toast({
        title: 'Fehler',
        description: 'Slotblock konnte nicht erstellt werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Update an existing slot
  const updateSlot = async (id: string, updates: Partial<CreateSlotData> & { memberId?: string; memberName?: string }) => {
    try {
      // Optimistic update - update UI immediately
      setSlots(prev => prev.map(slot => {
        if (slot.id !== id) return slot;
        
        const updated: Slot = {
          ...slot,
          ...(updates.date && { date: updates.date }),
          ...(updates.time && { time: updates.time }),
          ...(updates.duration && { duration: updates.duration as 15 | 30 | 45 | 60 }),
          ...(updates.craneOperator && { craneOperator: updates.craneOperator }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.isBooked !== undefined && { 
            isBooked: updates.isBooked,
            memberId: updates.isBooked ? updates.memberId : undefined,
            memberName: updates.isBooked ? updates.memberName : undefined,
            bookedBy: updates.isBooked ? updates.memberName : undefined,
            member: updates.isBooked ? slot.member : undefined
          })
        };
        return updated;
      }));

      // ✅ Update slot via service
      const data = await slotService.updateSlot(id, {
        date: updates.date,
        time: updates.time,
        duration: updates.duration,
        craneOperatorId: updates.craneOperator?.id,
        notes: updates.notes,
        isBooked: updates.isBooked,
        memberId: updates.memberId
      });

      // Fetch full data with profiles in background
      fetchSlots();

      return data;
    } catch (error) {
      console.error('Error updating slot:', error);
      // Revert optimistic update on error
      await fetchSlots();
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Delete a slot
  const deleteSlot = async (id: string) => {
    try {
      // ✅ Delete slot via service
      await slotService.deleteSlot(id);

      setSlots(prev => prev.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Book a slot
  const bookSlot = async (slotId: string, memberId: string) => {
    try {
      console.log('🔄 BOOK SLOT - START:', slotId, 'for member:', memberId);
      
      // ✅ Get member profile via service for optimistic update
      const memberProfile = await slotService.fetchMemberProfile(memberId);

      console.log('👤 Member profile fetched:', memberProfile?.name);

      // Optimistic update - update UI immediately with full member data
      // CRITICAL: Create a completely new array to force React to detect the change
      setSlots(prev => {
        console.log('🔄 BEFORE UPDATE - Array ref:', prev.length, 'items');
        const updated = prev.map(slot => 
          slot.id === slotId 
            ? { 
                ...slot, 
                isBooked: true, 
                memberId,
                memberName: memberProfile?.name,
                bookedBy: memberProfile?.name,
                member: memberProfile ? {
                  id: memberProfile.id,
                  name: memberProfile.name || '',
                  email: memberProfile.email || '',
                  memberNumber: memberProfile.member_number || ''
                } : undefined
              }
            : slot
        );
        console.log('✅ OPTIMISTIC UPDATE COMPLETE - Slot booked:', slotId);
        console.log('🔄 AFTER UPDATE - Array ref:', updated.length, 'items');
        console.log('📊 Updated slot details:', updated.find(s => s.id === slotId));
        // Return a new array reference
        return [...updated];
      });


      console.log('📡 UPDATING DATABASE...');
      // ✅ Book slot via service
      const data = await slotService.bookSlot(slotId, memberId);

      console.log('✅ DATABASE UPDATED SUCCESSFULLY');
      console.log('🔄 FETCHING LATEST DATA...');

      // Fetch full data with profiles to ensure consistency
      await fetchSlots();

      console.log('✅ BOOK SLOT - COMPLETE');
      return data;
    } catch (error) {
      console.error('❌ ERROR BOOKING SLOT:', error);
      // Revert optimistic update on error
      console.log('🔄 REVERTING OPTIMISTIC UPDATE...');
      await fetchSlots();
      toast({
        title: 'Fehler',
        description: 'Slot konnte nicht gebucht werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Cancel a booking
  const cancelBooking = async (slotId: string) => {
    try {
      console.log('🔄 CANCEL BOOKING - START:', slotId);
      
      // Optimistic update - update UI immediately
      setSlots(prev => {
        const updated = prev.map(slot => 
          slot.id === slotId 
            ? { ...slot, isBooked: false, memberId: undefined, memberName: undefined, member: undefined, bookedBy: undefined }
            : slot
        );
        console.log('✅ OPTIMISTIC UPDATE COMPLETE - Slot cancelled:', slotId);
        return updated;
      });

      console.log('📡 UPDATING DATABASE...');
      // ✅ Cancel booking via service
      const data = await slotService.cancelBooking(slotId);

      console.log('✅ DATABASE UPDATED SUCCESSFULLY');
      console.log('🔄 FETCHING LATEST DATA...');
      
      // Fetch full data to ensure consistency
      await fetchSlots();
      
      console.log('✅ CANCEL BOOKING - COMPLETE');
      return data;
    } catch (error) {
      console.error('❌ ERROR CANCELING BOOKING:', error);
      // Revert optimistic update on error
      console.log('🔄 REVERTING OPTIMISTIC UPDATE...');
      await fetchSlots();
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht storniert werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // ✅ Set up realtime subscription using singleton manager
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Only fetch slots when users are loaded
    if (!usersLoading) {
      console.log('🔄 Setting up slots realtime subscription');
      fetchSlots();
    }
  }, [enabled, usersLoading]);

  // ✅ Use realtime manager for subscriptions (automatic deduplication + debouncing)
  useRealtimeSubscription(
    { table: 'slots', event: '*' },
    'use-slots-main',
    (payload) => {
      console.log('🔔 REALTIME UPDATE RECEIVED:', payload.eventType || payload.event, payload);
      fetchSlots();
    },
    300, // 300ms debounce
    enabled
  );

  return {
    slots,
    isLoading,
    addSlot,
    addSlotBlock,
    updateSlot,
    deleteSlot,
    bookSlot,
    cancelBooking,
    refetchSlots: fetchSlots
  };
}
