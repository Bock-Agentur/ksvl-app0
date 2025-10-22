/**
 * Common Type Definitions
 * Shared types and utilities used across the application
 */

import React from 'react';
import { UserRole } from './user';

// ===== AUDIT LOG TYPES =====
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: "slot_created" | "slot_updated" | "slot_deleted" | "slot_booked" | "slot_cancelled";
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  target?: {
    type: "slot" | "member";
    id: string;
    name: string;
  };
  details: {
    slotDate?: string;
    slotTime?: string;
    craneOperator?: string;
    member?: string;
    changes?: Record<string, { from: any; to: any }>;
  };
  description: string;
}

// ===== MESSAGE TYPES =====
export interface Message {
  id: string;
  subject: string;
  content: string;
  recipient: "all" | "members" | "operators" | "admins" | "custom";
  customRecipients?: string[];
  sender: string;
  status: "draft" | "sent" | "scheduled";
  timestamp: Date;
  scheduledFor?: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: "notification" | "reminder" | "announcement" | "booking";
}

// ===== PROFILE TYPES =====
export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "email" | "phone" | "date" | "select" | "boolean";
  required: boolean;
  placeholder?: string;
  options?: string[];
  order?: number;
  group?: string;
  monday_column_id?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ===== NAVIGATION TYPES =====
export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

// ===== DASHBOARD TYPES =====
export interface DashboardStats {
  todayBookings: number;
  weeklyBookings: number;
  availableSlots: number;
  totalMembers: number;
}

// ===== COMPONENT PROPS TYPES =====
export interface MessagesProps {
  currentRole: UserRole;
}

export interface ProfileViewProps {
  currentRole: UserRole;
}

export interface AppShellProps {
  currentRole: UserRole;
  currentUser: any | null;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

// ===== UTILITY TYPES =====
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface FilterOptions {
  search?: string;
  role?: UserRole;
  action?: AuditLogEntry["action"];
  dateFrom?: Date;
  dateTo?: Date;
}

// ===== API TYPES (Database Ready) =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}