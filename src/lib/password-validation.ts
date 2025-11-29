import { z } from 'zod';

/**
 * Robust password validation schema
 * Enforces strong password requirements to prevent common attacks
 */
export const passwordSchema = z.string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .max(128, 'Passwort ist zu lang')
  .regex(/[a-z]/, 'Muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[A-Z]/, 'Muss mindestens einen Großbuchstaben enthalten')
  .regex(/[0-9]/, 'Muss mindestens eine Zahl enthalten')
  .refine(val => !/^\s+$/.test(val), 'Darf nicht nur aus Leerzeichen bestehen')
  .refine(val => {
    const common = ['password', '12345678', 'qwertz123', 'passwort', 'password123'];
    return !common.includes(val.toLowerCase());
  }, 'Passwort ist zu häufig verwendet');

/**
 * Validates a password and returns validation result
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  error?: string;
} {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: result.error.errors[0]?.message || 'Ungültiges Passwort'
  };
}
