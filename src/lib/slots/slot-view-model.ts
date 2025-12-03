/**
 * Slot View Model - Zentrale Typen und Mapping für UI
 * Single Source of Truth für alle Slot-Darstellungen
 */

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Slot, SlotStatus } from "@/types";
import { SlotDesignSettings } from "@/hooks/core/settings/use-slot-design";

// ===== ZENTRALE STATUS-LABELS (Single Source of Truth) =====
export const STATUS_LABELS: Record<SlotStatus, string> = {
  available: 'Verfügbar',
  booked: 'Gebucht',
  blocked: 'Gesperrt', // EINHEITLICH - nicht "Blockiert"!
};

// ===== FORMATIERUNG =====
/**
 * Einheitliche Dauer-Formatierung
 * @param minutes - Dauer in Minuten
 * @returns Formatierte Dauer, z.B. "30 Min."
 */
export function formatDuration(minutes: number): string {
  return `${minutes} Min.`;
}

/**
 * Formatiert Zeit mit Uhr-Suffix
 * @param time - Zeit im HH:mm Format
 * @returns Formatierte Zeit, z.B. "08:00 Uhr"
 */
export function formatTime(time: string): string {
  return `${time} Uhr`;
}

/**
 * Formatiert Datum kurz
 * @param dateString - ISO Datum (YYYY-MM-DD)
 * @returns Formatiertes Datum, z.B. "Mo, 03.12.2025"
 */
export function formatDateShort(dateString: string): string {
  return format(parseISO(dateString), "EEE, dd.MM.yyyy", { locale: de });
}

/**
 * Formatiert Datum lang
 * @param dateString - ISO Datum (YYYY-MM-DD)
 * @returns Formatiertes Datum, z.B. "Montag, 03. Dezember 2025"
 */
export function formatDateLong(dateString: string): string {
  return format(parseISO(dateString), "EEEE, dd. MMMM yyyy", { locale: de });
}

// ===== SLOT VIEW MODEL =====
export interface SlotViewModel {
  // Original Slot ID
  id: string;
  
  // Basis-Daten
  date: string;
  time: string;
  duration: number;
  
  // Status
  status: SlotStatus;
  statusLabel: string;
  
  // Kranführer
  craneOperator: {
    id: string;
    name: string;
    email?: string;
  };
  
  // Gebuchtes Mitglied (optional)
  bookedMember?: {
    id: string;
    name: string;
    email?: string;
    memberNumber?: string;
  };
  
  // Meta
  notes?: string;
  blockId?: string;
  isPartOfBlock: boolean;
  isMiniSlot: boolean;
  isBooked: boolean;
  
  // Formatierte Werte
  formattedDate: string;
  formattedDateLong: string;
  formattedTime: string;
  formattedDuration: string;
  
  // Design (aus useSlotDesign)
  colors: {
    background: string;
    border: string;
    text: string;
    label: string;
  };
  
  // Original Slot Referenz für Actions
  originalSlot: Slot;
}

// ===== MAPPING OPTIONS =====
export interface MapSlotOptions {
  allSlots: Slot[];
  getSlotStatus: (slot: Slot, allSlots: Slot[]) => SlotStatus;
  slotDesignSettings: SlotDesignSettings;
}

// ===== MAPPING FUNKTION =====
/**
 * Mapped einen Slot zum SlotViewModel für UI-Rendering
 */
export function mapSlotToViewModel(
  slot: Slot,
  options: MapSlotOptions
): SlotViewModel {
  const { allSlots, getSlotStatus, slotDesignSettings } = options;
  
  // Status berechnen
  const status = getSlotStatus(slot, allSlots);
  const statusLabel = STATUS_LABELS[status];
  
  // Farben aus Design-Settings
  const colors = slotDesignSettings[status];
  
  // Member-Daten konsolidieren (Legacy + neue Felder)
  const bookedMember = slot.isBooked ? {
    id: slot.memberId || slot.member?.id || '',
    name: slot.memberName || slot.member?.name || slot.bookedBy || '',
    email: slot.member?.email,
    memberNumber: slot.member?.memberNumber,
  } : undefined;
  
  // Block-Info
  const isPartOfBlock = Boolean(slot.blockId);
  const isMiniSlot = slot.isMiniSlot || slot.duration === 15;
  
  return {
    id: slot.id,
    date: slot.date,
    time: slot.time,
    duration: slot.duration,
    status,
    statusLabel,
    craneOperator: {
      id: slot.craneOperator.id,
      name: slot.craneOperator.name,
      email: slot.craneOperator.email,
    },
    bookedMember,
    notes: slot.notes,
    blockId: slot.blockId,
    isPartOfBlock,
    isMiniSlot,
    isBooked: slot.isBooked,
    formattedDate: formatDateShort(slot.date),
    formattedDateLong: formatDateLong(slot.date),
    formattedTime: formatTime(slot.time),
    formattedDuration: formatDuration(slot.duration),
    colors,
    originalSlot: slot,
  };
}

// ===== BATCH MAPPING =====
/**
 * Mapped mehrere Slots zu ViewModels
 */
export function mapSlotsToViewModels(
  slots: Slot[],
  options: MapSlotOptions
): SlotViewModel[] {
  return slots.map(slot => mapSlotToViewModel(slot, options));
}
