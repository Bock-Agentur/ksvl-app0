/**
 * Test Data Type Definitions
 * Types specifically for testing and demo functionality
 */

import { User } from './user';
import { Slot } from './slot';

// ===== TEST DATA TYPES =====
export interface TestDataScenario {
  id: string;
  name: string;
  description: string;
  active: boolean;
  data?: {
    slots: Slot[];
    users: User[];
  };
  stats: {
    members: number;
    craneOperators: number;
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
  };
}

export interface TestDataContextType {
  users: User[];
  slots: Slot[];
  scenarios: TestDataScenario[];
  currentScenario?: string;
  activeScenario: TestDataScenario | null;
  isTestMode: boolean;
  setTestMode: (enabled: boolean) => void;
  loadScenario?: (scenarioId: string) => void;
  activateScenario: (scenarioId: string) => void;
  generateRandomData: () => void;
  generateUsersOnly: () => void;
  generatePersonaMembers: () => void;
  generateSlotVariants: () => void;
  generatePersonaWithSlots: () => void;
  generateRandomCredentials: () => void;
  clearAllData: () => void;
  addSlot: (slot: Partial<Slot>) => void;
  addSlotBlock: (slots: Partial<Slot>[]) => void;
  updateSlot: (slotId: string, updates: Partial<Slot>) => void;
  deleteSlot: (slotId: string) => void;
  addUser: (user: User) => void;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => void;
}