/**
 * Central Type Definitions for KSVL Slot Manager
 * Re-exports all types from organized modules
 */

// Re-export all types from organized modules
export * from './user';
export * from './slot';
export * from './common';
export * from './test-data';

// Keep legacy exports for backward compatibility
export type { UserRole, User } from './user';
export type { Slot, SlotStatus, SlotFormData } from './slot';
export type { ValidationResult, ApiResponse } from './common';