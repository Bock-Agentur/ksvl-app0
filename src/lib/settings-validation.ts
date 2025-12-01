/**
 * Settings Validation Schemas
 * 
 * Zod schemas for critical app_settings to ensure data integrity
 */

import { z } from "zod";

// ============================================================================
// LOGIN BACKGROUND SETTINGS
// ============================================================================

export const LoginBackgroundBasicSchema = z.object({
  mode: z.enum(['image', 'video', 'gradient', 'none']).default('gradient'),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  gradientColors: z.array(z.string()).optional(),
});

export const LoginBackgroundAdvancedSchema = z.object({
  overlayOpacity: z.number().min(0).max(1).default(0.3),
  animationEnabled: z.boolean().default(true),
  animationDuration: z.number().min(1).max(60).default(10),
  blurAmount: z.number().min(0).max(20).default(0),
  brightness: z.number().min(0).max(2).default(1),
  contrast: z.number().min(0).max(2).default(1),
  saturation: z.number().min(0).max(2).default(1),
});

export type LoginBackgroundBasic = z.infer<typeof LoginBackgroundBasicSchema>;
export type LoginBackgroundAdvanced = z.infer<typeof LoginBackgroundAdvancedSchema>;

// ============================================================================
// DASHBOARD SETTINGS
// ============================================================================

export const DashboardSettingsSchema = z.object({
  enabledWidgets: z.array(z.string()).default([]),
  enabledSections: z.array(z.string()).default(['headerCard', 'welcomeSection', 'statsGrid', 'quickActions', 'activityFeed']),
  widgetSettings: z.record(z.string(), z.any()).default({}),
  layout: z.enum(['default', 'compact', 'detailed']).default('default'),
  refreshInterval: z.number().default(30000),
  columnLayout: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  showWelcomeSection: z.boolean().default(true),
  showStatsGrid: z.boolean().default(true),
  showQuickActions: z.boolean().default(true),
  showActivityFeed: z.boolean().default(true),
  widgetOrder: z.array(z.string()).optional(),
  widgetPositions: z.record(z.string(), z.object({ column: z.union([z.literal(1), z.literal(2), z.literal(3)]), order: z.number() })).optional(),
  allItemsPositions: z.record(z.string(), z.object({ column: z.number(), order: z.number() })).optional(),
  mobileItemsOrder: z.array(z.string()).optional(),
  headlineMode: z.enum(['manual', 'automatic']).default('automatic'),
  customHeadline: z.string().optional(),
  // Legacy/deprecated fields (keep for backward compatibility)
  headlineType: z.enum(['auto', 'custom']).optional(),
}).passthrough(); // Allow additional fields for backward compatibility

export type DashboardSettingsValidated = z.infer<typeof DashboardSettingsSchema>;

// ============================================================================
// FOOTER SETTINGS
// ============================================================================

export const FooterMenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  order: z.number(),
  enabled: z.boolean().default(true),
});

export const FooterDisplaySettingsSchema = z.object({
  showLabels: z.boolean().default(true),
});

export const FooterSettingsSchema = z.object({
  menuSettings: z.record(z.string(), z.array(FooterMenuItemSchema)),
  displaySettings: z.record(z.string(), FooterDisplaySettingsSchema),
});

export type FooterSettingsValidated = z.infer<typeof FooterSettingsSchema>;

// ============================================================================
// MENU SETTINGS
// ============================================================================

export const MenuItemConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  allowedRoles: z.array(z.string()),
  order: z.number(),
});

export const MenuSettingsSchema = z.object({
  headerItems: z.array(MenuItemConfigSchema),
  defaultRole: z.string().default('admin'),
});

export type MenuSettingsValidated = z.infer<typeof MenuSettingsSchema>;

// ============================================================================
// HEADER MESSAGE SETTINGS
// ============================================================================

export const HeaderMessageSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  message: z.string().default(''),
  variant: z.enum(['default', 'info', 'warning', 'success']).default('default'),
});

export type HeaderMessageSettingsValidated = z.infer<typeof HeaderMessageSettingsSchema>;

// ============================================================================
// STICKY HEADER LAYOUT SETTINGS
// ============================================================================

export const StickyHeaderLayoutSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  pages: z.object({
    calendar: z.boolean().default(true),
    slotManagement: z.boolean().default(true),
    userManagement: z.boolean().default(true),
    profile: z.boolean().default(true),
    settings: z.boolean().default(true),
  }).default({
    calendar: true,
    slotManagement: true,
    userManagement: true,
    profile: true,
    settings: true,
  }),
}).passthrough();

export type StickyHeaderLayoutSettingsValidated = z.infer<typeof StickyHeaderLayoutSettingsSchema>;

// ============================================================================
// AI ASSISTANT SETTINGS
// ============================================================================

const TonalitySchema = z.enum(['formal', 'funny', 'witty', 'sensitive', 'motivating']);
const ResponseLengthSchema = z.enum(['short', 'medium', 'long']);

export const AIAssistantSettingsSchema = z.object({
  tonality: z.record(z.string(), TonalitySchema).default({
    admin: 'formal',
    kranfuehrer: 'formal',
    mitglied: 'formal',
    gastmitglied: 'formal',
    vorstand: 'formal',
  }),
  responseLength: ResponseLengthSchema.default('medium'),
  customSystemPrompt: z.string().optional(),
  agentName: z.string().optional(),
});

export type AIAssistantSettingsValidated = z.infer<typeof AIAssistantSettingsSchema>;

// ============================================================================
// AI WELCOME MESSAGE SETTINGS
// ============================================================================

export const AIWelcomeMessageSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  message: z.string().default(''),
});

export type AIWelcomeMessageSettingsValidated = z.infer<typeof AIWelcomeMessageSettingsSchema>;

// ============================================================================
// ROLE WELCOME MESSAGES SETTINGS
// ============================================================================

export const RoleWelcomeMessagesSchema = z.record(
  z.string(),
  z.string().default('')
).default({});

export type RoleWelcomeMessagesValidated = z.infer<typeof RoleWelcomeMessagesSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates and sanitizes settings data
 * Returns validated data or default if validation fails
 */
export function validateSettings<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
  settingKey?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (settingKey) {
      console.warn(`[Settings Validation] Invalid data for "${settingKey}":`, error);
    }
    return fallback;
  }
}

/**
 * Safe parse that returns success/failure with data
 */
export function safeValidateSettings<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
