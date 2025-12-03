/**
 * Vitest Unit Test: Validation Utils
 * 
 * Testet Validierungs-Funktionen und Zod-Schemas.
 */

import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/lib/password-validation';
import { LoginBackgroundSchema } from '@/lib/settings-validation';

describe('Password Validation', () => {
  it('sollte gültiges Passwort akzeptieren', () => {
    const result = validatePassword('ValidPass123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('sollte zu kurzes Passwort ablehnen', () => {
    const result = validatePassword('Short1');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('mindestens 8 Zeichen');
  });

  it('sollte Passwort ohne Großbuchstaben ablehnen', () => {
    const result = validatePassword('alllowercase123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Großbuchstaben');
  });

  it('sollte Passwort ohne Kleinbuchstaben ablehnen', () => {
    const result = validatePassword('ALLUPPERCASE123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Kleinbuchstaben');
  });

  it('sollte Passwort ohne Zahl ablehnen', () => {
    const result = validatePassword('NoNumbersHere');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Zahl');
  });

  it('sollte häufige Passwörter ablehnen', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('häufig');
  });
});

describe('LoginBackground Schema Validation', () => {
  it('sollte gültige LoginBackground-Daten akzeptieren', () => {
    const validData = {
      type: 'gradient',
      bucket: null,
      storagePath: null,
      overlayOpacity: 40,
      loginBlockVerticalPositionDesktop: 50,
    };
    
    const result = LoginBackgroundSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('sollte ungültigen Typ ablehnen', () => {
    const invalidData = {
      type: 'invalid_type',
    };
    
    const result = LoginBackgroundSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('sollte Defaults für fehlende Felder setzen', () => {
    const partialData = {
      type: 'image',
    };
    
    const result = LoginBackgroundSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.data.overlayOpacity).toBe(40);
      expect(result.data.countdownEnabled).toBe(false);
    }
  });

  it('sollte Overlay-Opacity Range validieren', () => {
    const invalidData = {
      type: 'gradient',
      overlayOpacity: 150, // > 100
    };
    
    const result = LoginBackgroundSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('sollte gültige Bucket-Werte akzeptieren', () => {
    const validBuckets = ['documents', 'login-media', null];
    
    validBuckets.forEach(bucket => {
      const data = { type: 'image', bucket };
      const result = LoginBackgroundSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
