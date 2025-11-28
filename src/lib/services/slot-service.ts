/**
 * Slot Service
 * 
 * Centralized service for all slot-related CRUD operations.
 * Abstracts Supabase calls for better testability and maintainability.
 * Follows the same pattern as user-service.ts.
 */

import { supabase } from "@/integrations/supabase/client";
import { CreateSlotData } from "@/hooks/use-slots";

export interface SlotUpdateData {
  date?: string;
  time?: string;
  duration?: number;
  craneOperatorId?: string;
  notes?: string;
  isBooked?: boolean;
  memberId?: string;
}

/**
 * Slot Service Class
 */
class SlotService {
  /**
   * Get current auth session
   */
  private async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Nicht angemeldet. Bitte melden Sie sich an.');
    }
    return session;
  }

  /**
   * Fetch all slots
   * 
   * @returns All slots from database
   */
  async fetchSlots() {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new slot
   * 
   * @param slotData Slot data
   * @returns Created slot data
   */
  async createSlot(slotData: CreateSlotData) {
    await this.getSession(); // Verify authentication

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
    return data;
  }

  /**
   * Create multiple slots as a block
   * 
   * @param slotsData Array of slot data
   * @returns Created slots data
   */
  async createSlotBlock(slotsData: CreateSlotData[]) {
    await this.getSession(); // Verify authentication

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
    return data || [];
  }

  /**
   * Update an existing slot
   * 
   * @param id Slot ID
   * @param updates Slot updates
   * @returns Updated slot data
   */
  async updateSlot(id: string, updates: SlotUpdateData) {
    await this.getSession(); // Verify authentication

    const updateData: any = {};
    
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.duration) updateData.duration = updates.duration;
    if (updates.craneOperatorId) updateData.crane_operator_id = updates.craneOperatorId;
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
    return data;
  }

  /**
   * Delete a slot
   * 
   * @param id Slot ID
   */
  async deleteSlot(id: string) {
    await this.getSession(); // Verify authentication

    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Book a slot
   * 
   * @param slotId Slot ID
   * @param memberId Member ID
   * @returns Updated slot data
   */
  async bookSlot(slotId: string, memberId: string) {
    await this.getSession(); // Verify authentication

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
    return data;
  }

  /**
   * Cancel a slot booking
   * 
   * @param slotId Slot ID
   * @returns Updated slot data
   */
  async cancelBooking(slotId: string) {
    await this.getSession(); // Verify authentication

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
    return data;
  }

  /**
   * Fetch member profile (for booking operations)
   * 
   * @param memberId Member ID
   * @returns Member profile data
   */
  async fetchMemberProfile(memberId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, member_number')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return data;
  }
}

// Export singleton instance
export const slotService = new SlotService();
