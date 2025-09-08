/**
 * Robuste Input-Validierung und Sanitization
 * Verhindert fehlerhafte Daten und XSS-Angriffe
 */

import { UserRole, ValidationResult } from '@/types';
import { logger } from './logger';

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation Rules
const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZäöüÄÖÜß\s\-\.]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
  },
  phone: {
    pattern: /^[\+]?[0-9\s\-\(\)]{10,20}$/,
  },
  memberNumber: {
    pattern: /^KSVL\d{3}$/,
  },
  time: {
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
  },
} as const;

// Sanitization functions
export const sanitize = {
  /**
   * Sanitizes HTML to prevent XSS
   */
  html: (input: string): string => {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },

  /**
   * Sanitizes string input
   */
  string: (input: string, maxLength?: number): string => {
    let sanitized = input.toString().trim();
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      logger.warn('VALIDATION', `String truncated to ${maxLength} characters`);
    }
    return sanitized;
  },

  /**
   * Sanitizes email addresses
   */
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },

  /**
   * Sanitizes user names
   */
  name: (input: string): string => {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\säöüÄÖÜß\-\.]/g, ''); // Remove invalid characters
  },

  /**
   * Sanitizes phone numbers
   */
  phone: (input: string): string => {
    return input.replace(/[^\d\+\-\s\(\)]/g, '');
  },
};

// Validation functions
export const validate = {
  /**
   * Validates required fields
   */
  required: (value: any, fieldName: string): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        message: `${fieldName} ist erforderlich`,
      };
    }
    return { isValid: true };
  },

  /**
   * Validates string length
   */
  stringLength: (
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): ValidationResult => {
    if (value.length < minLength) {
      return {
        isValid: false,
        message: `${fieldName} muss mindestens ${minLength} Zeichen lang sein`,
      };
    }
    if (value.length > maxLength) {
      return {
        isValid: false,
        message: `${fieldName} darf maximal ${maxLength} Zeichen lang sein`,
      };
    }
    return { isValid: true };
  },

  /**
   * Validates pattern match
   */
  pattern: (value: string, pattern: RegExp, fieldName: string, errorMessage?: string): ValidationResult => {
    if (!pattern.test(value)) {
      return {
        isValid: false,
        message: errorMessage || `${fieldName} hat ein ungültiges Format`,
      };
    }
    return { isValid: true };
  },

  /**
   * Validates user name
   */
  name: (value: string): ValidationResult => {
    const required = validate.required(value, 'Name');
    if (!required.isValid) return required;

    const sanitized = sanitize.name(value);
    
    const length = validate.stringLength(
      sanitized,
      VALIDATION_RULES.name.minLength,
      VALIDATION_RULES.name.maxLength,
      'Name'
    );
    if (!length.isValid) return length;

    const pattern = validate.pattern(
      sanitized,
      VALIDATION_RULES.name.pattern,
      'Name',
      'Name darf nur Buchstaben, Bindestriche und Punkte enthalten'
    );
    if (!pattern.isValid) return pattern;

    return { isValid: true };
  },

  /**
   * Validates email address
   */
  email: (value: string): ValidationResult => {
    const required = validate.required(value, 'E-Mail');
    if (!required.isValid) return required;

    const sanitized = sanitize.email(value);
    
    const length = validate.stringLength(sanitized, 1, VALIDATION_RULES.email.maxLength, 'E-Mail');
    if (!length.isValid) return length;

    const pattern = validate.pattern(
      sanitized,
      VALIDATION_RULES.email.pattern,
      'E-Mail',
      'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    );
    if (!pattern.isValid) return pattern;

    return { isValid: true };
  },

  /**
   * Validates phone number
   */
  phone: (value: string): ValidationResult => {
    if (!value) return { isValid: true }; // Phone is optional

    const sanitized = sanitize.phone(value);
    
    const pattern = validate.pattern(
      sanitized,
      VALIDATION_RULES.phone.pattern,
      'Telefonnummer',
      'Bitte geben Sie eine gültige Telefonnummer ein'
    );
    if (!pattern.isValid) return pattern;

    return { isValid: true };
  },

  /**
   * Validates member number
   */
  memberNumber: (value: string): ValidationResult => {
    const required = validate.required(value, 'Mitgliedsnummer');
    if (!required.isValid) return required;

    const pattern = validate.pattern(
      value,
      VALIDATION_RULES.memberNumber.pattern,
      'Mitgliedsnummer',
      'Mitgliedsnummer muss das Format KSVL000 haben'
    );
    if (!pattern.isValid) return pattern;

    return { isValid: true };
  },

  /**
   * Validates user role
   */
  userRole: (value: string): ValidationResult => {
    const validRoles: UserRole[] = ['mitglied', 'kranfuehrer', 'admin'];
    
    if (!validRoles.includes(value as UserRole)) {
      return {
        isValid: false,
        message: 'Ungültige Benutzerrolle',
      };
    }

    return { isValid: true };
  },

  /**
   * Validates time format (HH:mm)
   */
  time: (value: string): ValidationResult => {
    const required = validate.required(value, 'Zeit');
    if (!required.isValid) return required;

    const pattern = validate.pattern(
      value,
      VALIDATION_RULES.time.pattern,
      'Zeit',
      'Zeit muss im Format HH:mm angegeben werden'
    );
    if (!pattern.isValid) return pattern;

    return { isValid: true };
  },

  /**
   * Validates date format (YYYY-MM-DD)
   */
  date: (value: string): ValidationResult => {
    const required = validate.required(value, 'Datum');
    if (!required.isValid) return required;

    const pattern = validate.pattern(
      value,
      VALIDATION_RULES.date.pattern,
      'Datum',
      'Datum muss im Format YYYY-MM-DD angegeben werden'
    );
    if (!pattern.isValid) return pattern;

    // Additional check: is it a valid date?
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        message: 'Ungültiges Datum',
      };
    }

    return { isValid: true };
  },

  /**
   * Validates slot duration
   */
  duration: (value: number): ValidationResult => {
    const validDurations = [30, 45, 60];
    
    if (!validDurations.includes(value)) {
      return {
        isValid: false,
        message: 'Dauer muss 30, 45 oder 60 Minuten betragen',
      };
    }

    return { isValid: true };
  },
};

/**
 * Validates complete user object
 */
export function validateUser(user: any): ValidationResult {
  const validations = [
    validate.name(user.name || ''),
    validate.email(user.email || ''),
    validate.phone(user.phone || ''),
    validate.memberNumber(user.memberNumber || ''),
    validate.userRole(user.role || ''),
  ];

  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Validates complete slot object
 */
export function validateSlot(slot: any): ValidationResult {
  const validations = [
    validate.date(slot.date || ''),
    validate.time(slot.time || ''),
    validate.duration(slot.duration || 0),
    validate.required(slot.craneOperatorId, 'Kranführer'),
  ];

  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Safely parses JSON with validation
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null ? parsed : defaultValue;
  } catch (error) {
    logger.warn('VALIDATION', `Failed to parse JSON: ${error}`);
    return defaultValue;
  }
}

/**
 * Validates and sanitizes form data
 */
export function validateAndSanitizeFormData<T extends Record<string, any>>(
  data: T,
  validationRules: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; data: T; errors: Record<keyof T, string> } {
  const sanitizedData = { ...data } as T;
  const errors = {} as Record<keyof T, string>;
  let isValid = true;

  for (const [field, validator] of Object.entries(validationRules)) {
    const value = data[field as keyof T];
    const validation = validator(value);
    
    if (!validation.isValid) {
      errors[field as keyof T] = validation.message || 'Ungültiger Wert';
      isValid = false;
    } else {
      // Apply appropriate sanitization
      if (typeof value === 'string') {
        if (field === 'email') {
          sanitizedData[field as keyof T] = sanitize.email(value) as T[keyof T];
        } else if (field === 'name') {
          sanitizedData[field as keyof T] = sanitize.name(value) as T[keyof T];
        } else if (field === 'phone') {
          sanitizedData[field as keyof T] = sanitize.phone(value) as T[keyof T];
        } else {
          sanitizedData[field as keyof T] = sanitize.string(value) as T[keyof T];
        }
      }
    }
  }

  return {
    isValid,
    data: sanitizedData,
    errors,
  };
}