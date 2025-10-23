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

export interface DashboardSettings {
  enabledWidgets: string[];
  widgetSettings: Record<string, any>;
  layout: "default" | "compact" | "detailed";
  refreshInterval: number;
  // Core Dashboard Sections
  showWelcomeSection: boolean;
  showStatsGrid: boolean;
  showQuickActions: boolean;
  showActivityFeed: boolean;
  // Animation Settings
  animationEnabled: boolean;
  animationType: "fadeIn" | "dropDown" | "scrollReveal" | "slideFromSides" | "staggered" | "bounce" | "none";
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

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  enabledWidgets: Object.keys(DASHBOARD_WIDGETS),
  widgetSettings: Object.fromEntries(
    Object.entries(DASHBOARD_WIDGETS).map(([id, widget]) => [
      id,
      widget.settings || {}
    ])
  ),
  layout: "default",
  refreshInterval: 300000, // 5 minutes
  // Core Dashboard Sections - enabled by default
  showWelcomeSection: true,
  showStatsGrid: true,
  showQuickActions: true,
  showActivityFeed: true,
  // Animation Settings - disabled by default for better performance
  animationEnabled: false,
  animationType: "none"
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

export function sortWidgetsByPosition(widgets: DashboardWidget[]): {
  column1: DashboardWidget[];
  column2: DashboardWidget[];
  column3: DashboardWidget[];
} {
  const sorted = widgets.sort((a, b) => a.position.order - b.position.order);
  
  return {
    column1: sorted.filter(w => w.position.column === 1),
    column2: sorted.filter(w => w.position.column === 2),
    column3: sorted.filter(w => w.position.column === 3)
  };
}