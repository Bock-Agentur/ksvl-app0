import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, Users, Anchor, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole, useUsers, useDashboardSettings, useDashboardAnimations, useIsMobile } from "@/hooks";
import { getAllDashboardItems, sortAllItemsByPosition, getColumnClassName } from "@/lib/dashboard-config";
import { cn } from "@/lib/utils";

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
  displayName: string;
}

export function Dashboard({ onNavigate, displayName }: DashboardProps) {
  const { currentRole, currentUser } = useRole();
  const { users, loading: usersLoading } = useUsers();
  const isMobileOrTablet = useIsMobile();
  const dashboardSettingsHook = useDashboardSettings(currentRole);
  const settings = dashboardSettingsHook.settings;
  const { getAnimationClass, isAnimationEnabled } = useDashboardAnimations();
  
  // Combined loading state
  const isLoading = usersLoading || dashboardSettingsHook.isLoading;
  

  // ✅ Phase 3: Memoize Quick Actions
  const quickActions = useMemo(() => {
    const baseActions = [
      { id: "new-booking", label: "Neue Buchung", icon: Calendar, action: () => onNavigate?.("calendar"), roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"] },
      { id: "my-bookings", label: "Meine Buchungen", icon: Users, action: () => onNavigate?.("calendar"), roles: ["mitglied", "gastmitglied"] },
      { id: "manage-slots", label: "Slots verwalten", icon: Clock, action: () => onNavigate?.("slots"), roles: ["kranfuehrer", "admin", "vorstand"] },
      { id: "manage-users", label: "Benutzer verwalten", icon: Users, action: () => onNavigate?.("users"), roles: ["admin", "vorstand"] },
    ];
    
    return baseActions.filter(action => action.roles.includes(currentRole));
  }, [currentRole, onNavigate]);

  // ✅ Dashboard stats WITHOUT slots dependency (lightweight)
  const slotStats = useMemo(() => {
    // Static placeholder values - no DB queries on Dashboard load
    return {
      todayBookings: 0,
      weeklyBookings: 0,
      availableSlots: 0,
      utilization: 0,
    };
  }, []);

  const nextBooking = useMemo(() => {
    // No next booking info on Dashboard (requires full slot load)
    return undefined;
  }, []);

  const recentActivity = useMemo(() => {
    // Static empty activity - can be loaded separately if needed
    return [];
  }, []);

  // ✅ Combine into final stats (lightweight)
  const stats = useMemo<DashboardStats>(() => ({
    ...slotStats,
    totalMembers: users?.length || 0,
    nextBooking,
    recentActivity,
    quickActions
  }), [slotStats, users, nextBooking, recentActivity, quickActions]);

  // ✅ Phase 3: Optimize allItems & sortedColumns - Stabilize with JSON.stringify
  const settingsKey = useMemo(() => 
    JSON.stringify({
      enabledWidgets: settings.enabledWidgets,
      enabledSections: settings.enabledSections,
      allItemsPositions: settings.allItemsPositions,
    }), 
    [settings.enabledWidgets, settings.enabledSections, settings.allItemsPositions]
  );

  const allItems = useMemo(() => {
    return getAllDashboardItems(currentRole, settings);
  }, [currentRole, settingsKey]);

  const sortedColumns = useMemo(() => {
    // On mobile/tablet, always use single column with custom order
    if (isMobileOrTablet) {
      const items = [...allItems];
      
      if (settings.mobileItemsOrder && settings.mobileItemsOrder.length > 0) {
        // Sort by custom mobile order
        items.sort((a, b) => {
          const indexA = settings.mobileItemsOrder!.indexOf(a.id);
          const indexB = settings.mobileItemsOrder!.indexOf(b.id);
          
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexA - indexB;
        });
      } else {
        // Default: sort by position (column first, then order)
        items.sort((a, b) => {
          const posA = settings.allItemsPositions?.[a.id] || a.position;
          const posB = settings.allItemsPositions?.[b.id] || b.position;
          
          if (posA.column !== posB.column) {
            return posA.column - posB.column;
          }
          return posA.order - posB.order;
        });
      }
      
      return [items]; // Single column
    }
    
    // Desktop: use column layout
    return sortAllItemsByPosition(allItems, settings.allItemsPositions, settings.columnLayout);
  }, [allItems, settingsKey, settings.columnLayout, settings.mobileItemsOrder, isMobileOrTablet]);

  const gridClassName = useMemo(() => {
    // On mobile/tablet, always use single column
    if (isMobileOrTablet) {
      return "grid grid-cols-1 gap-4";
    }
    return getColumnClassName(settings.columnLayout);
  }, [settings.columnLayout, isMobileOrTablet]);

  // Setup scroll animations
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
  }, [isAnimationEnabled, settings.animationType]);

  if (isLoading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
                    item.id === 'headerCard' ? (
                      <Component 
                        stats={stats}
                        currentUser={currentUser}
                        currentRole={currentRole}
                        onNavigate={onNavigate}
                        displayName={displayName}
                      />
                    ) : (
                      <Component 
                        stats={stats}
                        currentUser={currentUser}
                        currentRole={currentRole}
                        onNavigate={onNavigate}
                      />
                    )
                  ) : (
                    <Component />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
