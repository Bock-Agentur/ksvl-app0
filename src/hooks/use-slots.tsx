import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Slot, CraneOperator } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all slots from database with profiles data
  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 FETCHING SLOTS FROM DATABASE...');
      
      // Fetch slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (slotsError) throw slotsError;

      console.log('📦 RAW SLOTS DATA:', slotsData);

      // Fetch all profiles for operators and members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, member_number');

      if (profilesError) throw profilesError;

      console.log('👥 PROFILES DATA:', profilesData);

      // Create a map for quick profile lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

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
      const insertData: any = {
        date: slotData.date,
        time: slotData.time,
        duration: slotData.duration,
        crane_operator_id: slotData.craneOperator.id,
        notes: slotData.notes,
        is_booked: slotData.isBooked || false,
        block_id: slotData.blockId
      };

      // Add member_id if slot is booked
      if (slotData.isBooked && slotData.bookedBy) {
        insertData.member_id = slotData.bookedBy;
      }

      const { data, error } = await supabase
        .from('slots')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

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
      // Generate a unique block ID for all slots
      const blockId = crypto.randomUUID();

      const slotsToInsert = slotsData.map(slotData => ({
        date: slotData.date,
        time: slotData.time,
        duration: slotData.duration,
        crane_operator_id: slotData.craneOperator.id,
        notes: slotData.notes,
        is_booked: false,
        block_id: blockId
      }));

      const { data, error } = await supabase
        .from('slots')
        .insert(slotsToInsert)
        .select();

      if (error) throw error;

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

      const updateData: any = {};
      
      if (updates.date) updateData.date = updates.date;
      if (updates.time) updateData.time = updates.time;
      if (updates.duration) updateData.duration = updates.duration;
      if (updates.craneOperator) updateData.crane_operator_id = updates.craneOperator.id;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.isBooked !== undefined) {
        updateData.is_booked = updates.isBooked;
        updateData.member_id = updates.isBooked ? updates.memberId : null;
      }

      const { data, error } = await supabase
        .from('slots')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
      // Optimistic update - update UI immediately
      setSlots(prev => prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, isBooked: true, memberId, member: slot.member }
          : slot
      ));

      const { data, error } = await supabase
        .from('slots')
        .update({
          is_booked: true,
          member_id: memberId
        })
        .eq('id', slotId)
        .select()
        .single();

      if (error) throw error;

      // Fetch full data with profiles in background
      fetchSlots();

      return data;
    } catch (error) {
      console.error('Error booking slot:', error);
      // Revert optimistic update on error
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
      // Optimistic update - update UI immediately
      setSlots(prev => prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, isBooked: false, memberId: undefined, memberName: undefined, member: undefined, bookedBy: undefined }
          : slot
      ));

      const { data, error } = await supabase
        .from('slots')
        .update({
          is_booked: false,
          member_id: null
        })
        .eq('id', slotId)
        .select()
        .single();

      if (error) throw error;

      // Fetch full data in background
      fetchSlots();

      return data;
    } catch (error) {
      console.error('Error canceling booking:', error);
      // Revert optimistic update on error
      await fetchSlots();
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht storniert werden.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchSlots();

    const channel = supabase
      .channel('slots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slots'
        },
        () => {
          // Refetch all slots on any change
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
