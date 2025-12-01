/**
 * Central Hooks Export
 * Re-exports all hooks from /core for backwards compatibility
 * Components can import from @/hooks instead of @/hooks/core/*
 */

// Re-export all core hooks
export * from './core';

// Feature hooks (remain in root)
export { useConsecutiveSlots } from './use-consecutive-slots';
export { useTestData } from './use-test-data';
export { useToast } from './use-toast';
