/**
 * Dashboard Configuration System
 * Central management for all dashboard widgets and their settings
 */

import { UserRole } from "@/types/user";
import { WeatherWidget } from "@/components/dashboard-widgets/weather-widget";
import { HarborStatusWidget } from "@/components/dashboard-widgets/harbor-status-widget";
import { MemberStatsWidget } from "@/components/dashboard-widgets/member-stats-widget";
import { FinanceOverviewWidget } from "@/components/dashboard-widgets/finance-overview-widget";
import { MaintenanceAlertsWidget } from "@/components/dashboard-widgets/maintenance-alerts-widget";
import { EventsCalendarWidget } from "@/components/dashboard-widgets/events-calendar-widget";
import { HarborChatWidget } from "@/components/dashboard-widgets/harbor-chat-widget";
import { DashboardHeader } from "@/components/dashboard-header";
import { WelcomeSection } from "@/components/dashboard-sections/welcome-section";
import { StatsGridSection } from "@/components/dashboard-sections/stats-grid-section";
import { QuickActionsSection } from "@/components/dashboard-sections/quick-actions-section";
import { ActivityFeedSection } from "@/components/dashboard-sections/activity-feed-section";

export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  defaultEnabled: boolean;
  roles: UserRole[];
  category: "stats" | "info" | "management" | "communication";
  size: "small" | "medium" | "large";
  position: {
    column: 1 | 2 | 3;
    order: number;
  };
  settings?: {
    refreshInterval?: number;
    showDetails?: boolean;
    customFields?: Record<string, any>;
  };
}

export interface DashboardSection {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  defaultEnabled: boolean;
  roles: UserRole[];
  category: "core" | "stats" | "actions" | "feed";
  size: "small" | "medium" | "large";
  position: {
    column: 1 | 2 | 3;
    order: number;
  };
}

export interface DashboardSettings {
  enabledWidgets: string[];
  enabledSections: string[];
  widgetSettings: Record<string, any>;
  layout: "default" | "compact" | "detailed";
  refreshInterval: number;
  columnLayout: 1 | 2 | 3;
  // Core Dashboard Sections
  showWelcomeSection: boolean;
  showStatsGrid: boolean;
  showQuickActions: boolean;
  showActivityFeed: boolean;
  // Animation Settings
  animationEnabled: boolean;
  animationType: "fadeIn" | "dropDown" | "scrollReveal" | "slideFromSides" | "staggered" | "bounce" | "none";
  // Widget Order and Positions
  widgetOrder?: string[];
  widgetPositions?: Record<string, { column: 1 | 2 | 3; order: number }>;
  allItemsPositions?: Record<string, { column: number; order: number }>;
  // Mobile/Tablet specific order (single column)
  mobileItemsOrder?: string[];
  // Header-Card Headline Settings
  headlineMode: "manual" | "automatic";
  customHeadline?: string;
}

export const DASHBOARD_WIDGETS: Record<string, DashboardWidget> = {
  weather: {
    id: "weather",
    name: "Wetter",
    description: "Aktuelle Wetterbedingungen und Vorhersage",
    component: WeatherWidget,
    defaultEnabled: true,
    roles: ["mitglied", "kranfuehrer", "admin"],
    category: "info",
    size: "medium",
    position: { column: 1, order: 1 },
    settings: {
      refreshInterval: 300000, // 5 minutes
      showDetails: true
    }
  },
  harborStatus: {
    id: "harborStatus",
    name: "Hafenstatus",
    description: "Aktuelle Bedingungen im Hafen",
    component: HarborStatusWidget,
    defaultEnabled: true,
    roles: ["kranfuehrer", "admin"],
    category: "info",
    size: "medium",
    position: { column: 1, order: 2 },
    settings: {
      refreshInterval: 60000, // 1 minute
      showDetails: true
    }
  },
  memberStats: {
    id: "memberStats",
    name: "Mitglieder-Statistiken",
    description: "Übersicht über Mitgliederzahlen und Aktivitäten",
    component: MemberStatsWidget,
    defaultEnabled: true,
    roles: ["admin"],
    category: "stats",
    size: "medium",
    position: { column: 2, order: 1 },
    settings: {
      refreshInterval: 3600000, // 1 hour
      showDetails: false
    }
  },
  financeOverview: {
    id: "financeOverview",
    name: "Finanz-Übersicht",
    description: "Einnahmen, Ausgaben und Budgets",
    component: FinanceOverviewWidget,
    defaultEnabled: true,
    roles: ["admin"],
    category: "management",
    size: "medium",
    position: { column: 2, order: 2 },
    settings: {
      refreshInterval: 3600000, // 1 hour
      showDetails: true
    }
  },
  maintenanceAlerts: {
    id: "maintenanceAlerts",
    name: "Wartungshinweise",
    description: "Anstehende Wartungen und Reparaturen",
    component: MaintenanceAlertsWidget,
    defaultEnabled: true,
    roles: ["kranfuehrer", "admin"],
    category: "management",
    size: "medium",
    position: { column: 3, order: 1 },
    settings: {
      refreshInterval: 1800000, // 30 minutes
      showDetails: true
    }
  },
  eventsCalendar: {
    id: "eventsCalendar",
    name: "Vereinsevents",
    description: "Anstehende Veranstaltungen und Termine",
    component: EventsCalendarWidget,
    defaultEnabled: true,
    roles: ["mitglied", "kranfuehrer", "admin"],
    category: "communication",
    size: "medium",
    position: { column: 2, order: 3 },
    settings: {
      refreshInterval: 3600000, // 1 hour
      showDetails: false
    }
  },
  harborChat: {
    id: "harborChat",
    name: "KSVL-Assistent",
    description: "AI-Chatbot für Fragen zu Terminen und Mitgliedern",
    component: HarborChatWidget,
    defaultEnabled: false,
    roles: ["mitglied", "kranfuehrer", "admin"],
    category: "communication",
    size: "large",
    position: { column: 3, order: 2 },
    settings: {
      refreshInterval: 0,
      showDetails: true
    }
  }
};

export const DASHBOARD_SECTIONS: Record<string, DashboardSection> = {
  headerCard: {
    id: "headerCard",
    name: "Header-Card",
    description: "Profilbereich mit Suche und Benachrichtigungen",
    component: DashboardHeader,
    defaultEnabled: true,
    roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"],
    category: "core",
    size: "large",
    position: { column: 1, order: -1 }
  },
  welcomeSection: {
    id: "welcomeSection",
    name: "Willkommensnachricht",
    description: "Begrüßung und nächster Termin",
    component: WelcomeSection,
    defaultEnabled: true,
    roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"],
    category: "core",
    size: "large",
    position: { column: 1, order: 0 }
  },
  statsGrid: {
    id: "statsGrid",
    name: "Statistik-Übersicht",
    description: "Buchungen und Auslastung",
    component: StatsGridSection,
    defaultEnabled: true,
    roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"],
    category: "stats",
    size: "large",
    position: { column: 1, order: 1 }
  },
  quickActions: {
    id: "quickActions",
    name: "Schnellzugriff",
    description: "Direkte Links zu häufig genutzten Funktionen",
    component: QuickActionsSection,
    defaultEnabled: true,
    roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"],
    category: "actions",
    size: "large",
    position: { column: 1, order: 100 }
  },
  activityFeed: {
    id: "activityFeed",
    name: "Live-Activity Feed",
    description: "Echtzeitaktivitäten und Benachrichtigungen",
    component: ActivityFeedSection,
    defaultEnabled: true,
    roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"],
    category: "feed",
    size: "large",
    position: { column: 1, order: 101 }
  }
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  enabledWidgets: Object.keys(DASHBOARD_WIDGETS),
  enabledSections: Object.keys(DASHBOARD_SECTIONS),
  widgetSettings: Object.fromEntries(
    Object.entries(DASHBOARD_WIDGETS).map(([id, widget]) => [
      id,
      widget.settings || {}
    ])
  ),
  layout: "default",
  refreshInterval: 300000, // 5 minutes
  columnLayout: 3,
  // Core Dashboard Sections - enabled by default
  showWelcomeSection: true,
  showStatsGrid: true,
  showQuickActions: true,
  showActivityFeed: true,
  // Animation Settings - disabled by default for better performance
  animationEnabled: false,
  animationType: "none",
  // Header-Card Headline Settings
  headlineMode: "automatic",
  customHeadline: "Where do you want to sail?"
};

export function getWidgetsForRole(role: UserRole): DashboardWidget[] {
  return Object.values(DASHBOARD_WIDGETS).filter(widget => 
    widget.roles.includes(role)
  );
}

export function getEnabledWidgetsForRole(
  role: UserRole, 
  settings: DashboardSettings
): DashboardWidget[] {
  return getWidgetsForRole(role).filter(widget => 
    settings.enabledWidgets.includes(widget.id)
  );
}

export function getSectionsForRole(role: UserRole): DashboardSection[] {
  return Object.values(DASHBOARD_SECTIONS).filter((section) =>
    section.roles.includes(role)
  );
}

export function getEnabledSectionsForRole(
  role: UserRole,
  settings: DashboardSettings
): DashboardSection[] {
  const allSections = getSectionsForRole(role);
  const enabledSections = settings.enabledSections || [];
  return allSections.filter((section) => 
    enabledSections.includes(section.id)
  );
}

export type DashboardItem = (DashboardWidget | DashboardSection) & { 
  itemType: 'widget' | 'section' 
};

export function getAllDashboardItems(
  role: UserRole,
  settings: DashboardSettings
): DashboardItem[] {
  const widgets = getEnabledWidgetsForRole(role, settings).map(w => ({
    ...w,
    itemType: 'widget' as const
  }));
  
  const sections = getEnabledSectionsForRole(role, settings).map(s => ({
    ...s,
    itemType: 'section' as const
  }));
  
  return [...sections, ...widgets];
}

export function sortAllItemsByPosition(
  items: DashboardItem[],
  customPositions?: Record<string, { column: number; order: number }>,
  columnLayout: 1 | 2 | 3 = 3
): DashboardItem[][] {
  const columns: DashboardItem[][] = Array.from({ length: columnLayout }, () => []);

  items.forEach((item) => {
    const position = customPositions?.[item.id] || item.position;
    const columnIndex = Math.min(position.column - 1, columnLayout - 1);
    
    if (columnIndex >= 0 && columnIndex < columnLayout) {
      columns[columnIndex].push(item);
    }
  });

  // Sort items within each column by order
  columns.forEach(column => {
    column.sort((a, b) => {
      const posA = customPositions?.[a.id] || a.position;
      const posB = customPositions?.[b.id] || b.position;
      return posA.order - posB.order;
    });
  });

  return columns;
}

export function getColumnClassName(columnLayout: 1 | 2 | 3): string {
  switch (columnLayout) {
    case 1:
      return "grid grid-cols-1 gap-6";
    case 2:
      return "grid grid-cols-1 lg:grid-cols-2 gap-6";
    case 3:
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    default:
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  }
}

export function sortWidgetsByPosition(
  widgets: DashboardWidget[], 
  customPositions?: Record<string, { column: 1 | 2 | 3; order: number }>
): {
  column1: DashboardWidget[];
  column2: DashboardWidget[];
  column3: DashboardWidget[];
} {
  // Use custom positions if available, otherwise use default positions
  const widgetsWithPositions = widgets.map(widget => ({
    ...widget,
    position: customPositions?.[widget.id] || widget.position
  }));

  const sorted = widgetsWithPositions.sort((a, b) => a.position.order - b.position.order);
  
  return {
    column1: sorted.filter(w => w.position.column === 1),
    column2: sorted.filter(w => w.position.column === 2),
    column3: sorted.filter(w => w.position.column === 3)
  };
}