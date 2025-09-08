/**
 * Zentrale Business Logic Utilities
 * Gemeinsame Geschäftslogik, Validierung und Formatierung
 */

import { format, parseISO, addMinutes, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { User, Slot, UserRole, ValidationResult } from "@/types";

// ===== DATE & TIME UTILITIES =====

/**
 * Formatiert Datum für die Anzeige
 */
export function formatDate(date: string | Date, formatStr: string = "dd.MM.yyyy"): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: de });
}

/**
 * Formatiert Zeit für die Anzeige
 */
export function formatTime(time: string): string {
  return time;
}

/**
 * Formatiert Datum und Zeit zusammen
 */
export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} um ${formatTime(time)}`;
}

/**
 * Generiert Zeitslots für einen Tag (stündlich)
 */
export function generateTimeSlots(startHour: number = 0, endHour: number = 24): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

/**
 * Generiert 15-Minuten Zeitslots für einen Tag
 */
export function generateMiniTimeSlots(startHour: number = 0, endHour: number = 24): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
    slots.push(`${hourStr}:15`);
    slots.push(`${hourStr}:30`);
    slots.push(`${hourStr}:45`);
  }
  return slots;
}

/**
 * Konvertiert Zeit in Minuten seit Mitternacht
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Konvertiert Minuten seit Mitternacht zu Zeit-String
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Prüft ob eine Zeit auf ein 15-Minuten-Raster fällt
 */
export function isValidMiniSlotTime(time: string): boolean {
  const [, minutes] = time.split(':').map(Number);
  return [0, 15, 30, 45].includes(minutes);
}

/**
 * Berechnet End-Zeit für Mini-Slots
 */
export function calculateMiniSlotEndTime(startTime: string, miniSlotCount: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + (miniSlotCount * 15);
  return minutesToTime(endMinutes);
}

/**
 * Prüft ob eine Zeit in der Vergangenheit liegt
 */
export function isTimeInPast(date: string, time: string): boolean {
  const slotDateTime = parseISO(`${date}T${time}`);
  return slotDateTime < new Date();
}

/**
 * Berechnet das Ende eines Slots
 */
export function calculateSlotEnd(date: string, time: string, duration: number): Date {
  const startDateTime = parseISO(`${date}T${time}`);
  return addMinutes(startDateTime, duration);
}

// ===== VALIDATION UTILITIES =====

/**
 * Validiert E-Mail-Adresse
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? undefined : "Ungültige E-Mail-Adresse"
  };
}

/**
 * Validiert Telefonnummer
 */
export function validatePhone(phone: string): ValidationResult {
  const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
  return {
    isValid: phoneRegex.test(phone),
    message: phoneRegex.test(phone) ? undefined : "Ungültige Telefonnummer"
  };
}

/**
 * Validiert Mitgliedsnummer
 */
export function validateMemberNumber(memberNumber: string, existingNumbers: string[] = []): ValidationResult {
  const formatRegex = /^KSVL\d{3}$/;
  
  if (!formatRegex.test(memberNumber)) {
    return {
      isValid: false,
      message: "Mitgliedsnummer muss das Format KSVL001 haben"
    };
  }

  if (existingNumbers.includes(memberNumber)) {
    return {
      isValid: false,
      message: "Diese Mitgliedsnummer ist bereits vergeben"
    };
  }

  return { isValid: true };
}

/**
 * Validiert Slot-Zeit (keine Überschneidungen)
 */
export function validateSlotTime(
  date: string, 
  time: string, 
  duration: number,
  existingSlots: Slot[],
  excludeSlotId?: string
): ValidationResult {
  const newSlotStart = parseISO(`${date}T${time}`);
  const newSlotEnd = addMinutes(newSlotStart, duration);

  // Prüfe Überschneidungen mit existierenden Slots
  const conflictingSlot = existingSlots.find(slot => {
    if (slot.id === excludeSlotId) return false;
    if (slot.date !== date) return false;

    const existingStart = parseISO(`${slot.date}T${slot.time}`);
    const existingEnd = addMinutes(existingStart, slot.duration);

    // Prüfe auf Überschneidungen
    return (
      (newSlotStart >= existingStart && newSlotStart < existingEnd) ||
      (newSlotEnd > existingStart && newSlotEnd <= existingEnd) ||
      (newSlotStart <= existingStart && newSlotEnd >= existingEnd)
    );
  });

  if (conflictingSlot) {
    return {
      isValid: false,
      message: `Überschneidung mit existierendem Slot um ${conflictingSlot.time}`
    };
  }

  return { isValid: true };
}

// ===== USER UTILITIES =====

/**
 * Holt Benutzer-Display-Name
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.email || user.id;
}

/**
 * Holt Rolle-Label
 */
export function getRoleLabel(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    admin: "Administrator",
    kranfuehrer: "Kranführer",
    mitglied: "Mitglied"
  };
  return roleLabels[role];
}

/**
 * Prüft ob ein Benutzer Kranführer-Rechte hat (Kranführer oder Admin)
 */
export function isCraneOperator(user: User): boolean {
  return user.role === "kranfuehrer" || user.role === "admin";
}

/**
 * Prüft ob eine Rolle Kranführer-Rechte hat (Kranführer oder Admin)
 */
export function hasCraneOperatorRights(role: UserRole): boolean {
  return role === "kranfuehrer" || role === "admin";
}

/**
 * Filtert Benutzer die als Kranführer agieren können (Kranführer oder Admin)
 */
export function getCraneOperators(users: User[]): User[] {
  return users.filter(isCraneOperator);
}

/**
 * Prüft Benutzer-Berechtigung
 */
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  // Admin hat automatisch auch Kranführer-Rechte
  if (userRole === "admin" && requiredRoles.includes("kranfuehrer")) {
    return true;
  }
  return requiredRoles.includes(userRole);
}

/**
 * Generiert automatische Mitgliedsnummer
 */
export function generateMemberNumber(existingUsers: User[]): string {
  const existingNumbers = existingUsers.map(u => u.memberNumber);
  let counter = 1;
  
  while (counter <= 999) {
    const memberNumber = `KSVL${counter.toString().padStart(3, '0')}`;
    if (!existingNumbers.includes(memberNumber)) {
      return memberNumber;
    }
    counter++;
  }
  
  throw new Error("Alle Mitgliedsnummern sind vergeben");
}

// ===== SLOT UTILITIES =====

/**
 * Holt Slot-Status-Label
 */
export function getSlotStatusLabel(slot: Slot): string {
  if (slot.isBooked) return "Gebucht";
  return "Verfügbar";
}

/**
 * Gruppiert Slots nach Datum
 */
export function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce((groups, slot) => {
    const date = slot.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(slot);
    return groups;
  }, {} as Record<string, Slot[]>);
}

/**
 * Sortiert Slots nach Datum und Zeit
 */
export function sortSlotsByDateTime(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => {
    const dateA = parseISO(`${a.date}T${a.time}`);
    const dateB = parseISO(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Filtert Slots nach Datumsbereich
 */
export function filterSlotsByDateRange(
  slots: Slot[], 
  startDate: string, 
  endDate: string
): Slot[] {
  const start = startOfDay(parseISO(startDate));
  const end = endOfDay(parseISO(endDate));
  
  return slots.filter(slot => {
    const slotDate = parseISO(slot.date);
    return isWithinInterval(slotDate, { start, end });
  });
}

// ===== STATISTICS UTILITIES =====

/**
 * Berechnet Benutzer-Statistiken
 */
export function calculateUserStats(users: User[]) {
  const total = users.length;
  const active = users.filter(u => u.isActive).length;
  const inactive = total - active;
  
  const byRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<UserRole, number>);

  return {
    total,
    active,
    inactive,
    byRole,
    activeRate: total > 0 ? Math.round((active / total) * 100) : 0
  };
}

/**
 * Berechnet Slot-Statistiken
 */
export function calculateSlotStats(slots: Slot[]) {
  const total = slots.length;
  const booked = slots.filter(s => s.isBooked).length;
  const available = total - booked;
  
  const byDate = groupSlotsByDate(slots);
  const datesWithSlots = Object.keys(byDate).length;
  
  return {
    total,
    booked,
    available,
    datesWithSlots,
    bookingRate: total > 0 ? Math.round((booked / total) * 100) : 0
  };
}

// ===== SEARCH UTILITIES =====

/**
 * Normalisiert Suchbegriff
 */
export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

/**
 * Prüft ob ein Wert einen Suchbegriff enthält
 */
export function matchesSearchTerm(value: any, searchTerm: string): boolean {
  if (!value) return false;
  const normalizedValue = String(value).toLowerCase();
  const normalizedTerm = normalizeSearchTerm(searchTerm);
  return normalizedValue.includes(normalizedTerm);
}

/**
 * Sucht in mehreren Feldern
 */
export function searchInFields<T>(
  item: T, 
  fields: (keyof T)[], 
  searchTerm: string
): boolean {
  const normalizedTerm = normalizeSearchTerm(searchTerm);
  if (!normalizedTerm) return true;
  
  return fields.some(field => matchesSearchTerm(item[field], normalizedTerm));
}

// ===== EXPORT UTILITIES =====

/**
 * Konvertiert Daten zu CSV
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[], 
  headers: { key: keyof T; label: string }[]
): string {
  const headerRow = headers.map(h => h.label).join(',');
  const dataRows = data.map(item => 
    headers.map(h => {
      const value = item[h.key];
      const stringValue = String(value || '');
      // Escape CSV values that contain commas or quotes
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Lädt CSV-Datei herunter
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}