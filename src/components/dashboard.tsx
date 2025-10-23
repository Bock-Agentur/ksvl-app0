import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, Users, Anchor, TrendingUp, AlertCircle, MessageSquare, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { useSlots } from "@/hooks/use-slots";
import { useUsers } from "@/hooks/use-users";
import { useTestData } from "@/hooks/use-test-data";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useWelcomeMessages } from "@/hooks/use-welcome-messages";
import { useDashboardAnimations } from "@/hooks/use-dashboard-animations";
import { getAllDashboardItems, sortAllItemsByPosition, getColumnClassName } from "@/lib/dashboard-config";
import { cn } from "@/lib/utils";

// Dashboard Widgets
import { WeatherWidget } from "./dashboard-widgets/weather-widget";
import { HarborStatusWidget } from "./dashboard-widgets/harbor-status-widget";
import { MemberStatsWidget } from "./dashboard-widgets/member-stats-widget";
import { FinanceOverviewWidget } from "./dashboard-widgets/finance-overview-widget";
import { MaintenanceAlertsWidget } from "./dashboard-widgets/maintenance-alerts-widget";
import { EventsCalendarWidget } from "./dashboard-widgets/events-calendar-widget";
import { HarborChatWidget } from "./dashboard-widgets/harbor-chat-widget";

interface DashboardStats {
  todayBookings: number;
  weeklyBookings: number;
  availableSlots: number;
  utilization: number;
  totalMembers: number;
  nextBooking?: {
    time: string;
    member: string;
    duration: string;
    id: string;
  };
  recentActivity: Array<{
    id: string;
    type: "booking" | "cancellation" | "availability" | "maintenance" | "member_join";
    message: string;
    time: string;
    member?: string;
    priority?: "low" | "medium" | "high" | "critical";
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    icon: any;
    action: () => void;
    roles: string[];
  }>;
}

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { currentRole, currentUser } = useRole();
  const { slots } = useSlots();
  const { users } = useUsers();
  const { activeScenario } = useTestData();
  const isAdmin = currentUser?.roles?.includes("admin") || currentRole === "admin";
  const { settings, isLoading } = useDashboardSettings(currentRole, false); // Regular users don't use admin mode
  const { getWelcomeMessage } = useWelcomeMessages();
  const { getAnimationClass, getCardAnimationClass, isAnimationEnabled, isInitialized } = useDashboardAnimations();

  const getQuickActions = (role: string) => {
    const actions = [];
    
    if (role === "mitglied") {
      actions.push(
        { id: "calendar", label: "Termin buchen", icon: Calendar, action: () => onNavigate?.("calendar"), roles: ["mitglied"] },
        { id: "bookings", label: "Meine Buchungen", icon: Users, action: () => onNavigate?.("bookings"), roles: ["mitglied"] },
        { id: "profile", label: "Profil bearbeiten", icon: Settings, action: () => onNavigate?.("profile"), roles: ["mitglied"] },
        { id: "messages", label: "Nachrichten", icon: MessageSquare, action: () => onNavigate?.("messages"), roles: ["mitglied"] }
      );
    } else if (role === "kranfuehrer") {
      actions.push(
        { id: "calendar", label: "Verfügbarkeit", icon: Clock, action: () => onNavigate?.("calendar"), roles: ["kranfuehrer"] },
        { id: "bookings", label: "Tagesagenda", icon: Users, action: () => onNavigate?.("bookings"), roles: ["kranfuehrer"] },
        { id: "slots", label: "Slots verwalten", icon: Anchor, action: () => onNavigate?.("slots"), roles: ["kranfuehrer"] },
        { id: "profile", label: "Profil", icon: Settings, action: () => onNavigate?.("profile"), roles: ["kranfuehrer"] }
      );
    } else if (role === "admin") {
      actions.push(
        { id: "users", label: "Benutzer verwalten", icon: Users, action: () => onNavigate?.("users"), roles: ["admin"] },
        { id: "slots", label: "Slot-Management", icon: Anchor, action: () => onNavigate?.("slots"), roles: ["admin"] },
        { id: "audit-logs", label: "Audit Logs", icon: AlertCircle, action: () => onNavigate?.("audit-logs"), roles: ["admin"] },
        { id: "settings", label: "Einstellungen", icon: Settings, action: () => onNavigate?.("settings"), roles: ["admin"] }
      );
    }
    
    return actions;
  };

  // Calculate real stats from test data
  const stats = useMemo((): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's bookings
    const todayBookings = slots.filter(slot => 
      slot.date === today && slot.isBooked
    ).length;
    
    // Calculate weekly bookings (this week)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const weeklyBookings = slots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= startOfWeek && slotDate <= endOfWeek && slot.isBooked;
    }).length;
    
    // Calculate available slots (today and future)
    const availableSlots = slots.filter(slot => 
      slot.date >= today && !slot.isBooked
    ).length;
    
    // Calculate utilization (this week)
    const thisWeekSlots = slots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= startOfWeek && slotDate <= endOfWeek;
    });
    const utilization = thisWeekSlots.length > 0 
      ? Math.round((weeklyBookings / thisWeekSlots.length) * 100) 
      : 0;
    
    // Find next booking for the current user (if Mitglied)
    let nextBooking: DashboardStats['nextBooking'] = undefined;
    if (currentRole === "mitglied" && currentUser) {
      const userBookings = slots.filter(slot => 
        slot.isBooked && 
        slot.member?.id === currentUser.id &&
        slot.date >= today
      ).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
      
      if (userBookings.length > 0) {
        const next = userBookings[0];
        nextBooking = {
          time: next.time,
          member: next.member?.name || "Unbekannt",
          duration: `${next.duration} Min`,
          id: next.id
        };
      }
    }
    
    // Generate recent activity from slots and users
    const recentActivity: DashboardStats['recentActivity'] = [];
    
    // Add recent bookings
    const recentBookings = slots
      .filter(slot => slot.isBooked)
      .slice(-3)
      .reverse()
      .map((slot, index) => ({
        id: `booking-${slot.id}`,
        type: "booking" as const,
        message: `Neue Buchung für ${slot.date} ${slot.time}`,
        time: `vor ${index + 1 * 15} Min`,
        member: slot.member?.name,
        priority: "medium" as const
      }));
    
    recentActivity.push(...recentBookings);
    
    // Add scenario info as activity
    if (activeScenario) {
      recentActivity.unshift({
        id: "scenario-active",
        type: "availability",
        message: `Testszenario "${activeScenario.name}" aktiv`,
        time: "aktiv",
        priority: "low"
      });
    }
    
    // Add sample maintenance alert if admin
    if (currentRole === "admin") {
      recentActivity.push({
        id: "maintenance-alert",
        type: "maintenance",
        message: "Kran A: Nächste Wartung fällig",
        time: "vor 2 Std",
        priority: "high"
      });
    }
    
    return {
      todayBookings,
      weeklyBookings,
      availableSlots,
      utilization,
      totalMembers: users.length,
      nextBooking,
      recentActivity,
      quickActions: getQuickActions(currentRole)
    };
  }, [slots, users, currentRole, currentUser, activeScenario, onNavigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const getRoleSpecificTitle = () => {
    switch (currentRole) {
      case "mitglied":
        return "Ihre Krantermine";
      case "kranfuehrer":
        return "Ihr Kranführer-Dashboard";
      case "admin":
        return "Administrator-Dashboard";
      default:
        return "Dashboard";
    }
  };


  // Add scroll reveal listener for scroll-based animations
  useEffect(() => {
    if (!isAnimationEnabled || settings.animationType !== "scrollReveal") return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-revealed");
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: "-50px"
    });

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [isAnimationEnabled, settings.animationType, isInitialized]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className={gridClassName}>
        {sortedColumns.map((columnItems, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {columnItems.map((item) => {
              const Component = item.component;
              const isSection = item.itemType === 'section';
              
              return (
                <div key={item.id} className={getAnimationClass(item.id)}>
                  {isSection ? (
                    <Component 
                      stats={stats}
                      currentUser={currentUser}
                      currentRole={currentRole}
                      onNavigate={onNavigate}
                    />
                  ) : (
                    <Component />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main Stats Grid */}
      {settings.showStatsGrid && (
        <div className={cn(
          "grid grid-cols-2 lg:grid-cols-4 gap-4",
          getAnimationClass("stats")
        )}>
          <Card className={cn("shadow-card-maritime", getCardAnimationClass(0, "stats"))}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Heute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.todayBookings}</div>
              <p className="text-xs text-muted-foreground">Buchungen</p>
            </CardContent>
          </Card>

          <Card className={cn("shadow-card-maritime", getCardAnimationClass(1, "stats"))}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Diese Woche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.weeklyBookings}</div>
              <p className="text-xs text-muted-foreground">Buchungen</p>
            </CardContent>
          </Card>

          <Card className={cn("shadow-card-maritime", getCardAnimationClass(2, "stats"))}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-foreground" />
                Verfügbar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableSlots}</div>
              <p className="text-xs text-muted-foreground">Freie Slots</p>
            </CardContent>
          </Card>

          <Card className={cn("shadow-card-maritime", getCardAnimationClass(3, "stats"))}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Anchor className="h-4 w-4 text-warning" />
                Auslastung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.utilization}%</div>
              <p className="text-xs text-muted-foreground">der Woche</p>
            </CardContent>
          </Card>
        </div>
      )}

            
            return (
              <>
                {/* Column 1 */}
                <div className="space-y-4">
                  {column1.map((widget, index) => {
                    const Component = widget.component;
                    return (
                      <div key={widget.id} className={getCardAnimationClass(index, "widgets")}>
                        <Component />
                      </div>
                    );
                  })}
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  {column2.map((widget, index) => {
                    const Component = widget.component;
                    return (
                      <div key={widget.id} className={getCardAnimationClass(index + column1.length, "widgets")}>
                        <Component />
                      </div>
                    );
                  })}
                </div>

                {/* Column 3 */}
                <div className="space-y-4">
                  {column3.map((widget, index) => {
                    const Component = widget.component;
                    return (
                      <div key={widget.id} className={getCardAnimationClass(index + column1.length + column2.length, "widgets")}>
                        <Component />
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* AI Chat Assistant - Full Width */}
      <div className={getAnimationClass("chat")}>
        <HarborChatWidget />
      </div>

      {/* Quick Actions */}
      {settings.showQuickActions && (
        <Card className={cn(
          "shadow-card-maritime",
          getAnimationClass("quickActions")
        )}>
          <CardHeader>
            <CardTitle className="text-base">Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.quickActions.map((action) => (
                <Button 
                  key={action.id}
                  variant="outline" 
                  className="h-auto p-4 flex flex-col gap-2 hover:bg-muted/50 transition-colors"
                  onClick={action.action}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Feed */}
      {settings.showActivityFeed && (
        <Card className={cn(
          "shadow-card-maritime",
          getAnimationClass("activityFeed")
        )}>
          <CardHeader>
            <CardTitle className="text-base">Live-Activity Feed</CardTitle>
            <CardDescription>Echtzeitaktivitäten im Hafensystem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                    activity.type === "booking" && "bg-success animate-pulse",
                    activity.type === "cancellation" && "bg-warning", 
                    activity.type === "availability" && "bg-primary",
                    activity.type === "maintenance" && "bg-destructive",
                    activity.type === "member_join" && "bg-accent-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    {activity.member && (
                      <p className="text-xs text-muted-foreground">{activity.member}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.priority && activity.priority !== "low" && (
                      <Badge 
                        variant={activity.priority === "critical" ? "destructive" : 
                                 activity.priority === "high" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {activity.priority === "critical" ? "Kritisch" :
                         activity.priority === "high" ? "Hoch" : "Mittel"}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {activity.time}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Aktivitäten heute</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}