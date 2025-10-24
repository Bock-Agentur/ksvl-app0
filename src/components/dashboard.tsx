import { useState, useMemo, useEffect } from "react";
import { Calendar, Clock, Users, Anchor, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { useSlots } from "@/hooks/use-slots";
import { useUsers } from "@/hooks/use-users";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useDashboardAnimations } from "@/hooks/use-dashboard-animations";
import { useIsMobile } from "@/hooks/use-mobile";
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
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { currentRole, currentUser } = useRole();
  const { slots, isLoading: slotsLoading } = useSlots();
  const { users, loading: usersLoading } = useUsers();
  const isMobileOrTablet = useIsMobile();
  const dashboardSettingsHook = useDashboardSettings(currentRole, false);
  const settings = dashboardSettingsHook.settings;
  const { getAnimationClass, isInitialized, isAnimationEnabled } = useDashboardAnimations();
  
  const [isContentReady, setIsContentReady] = useState(false);
  
  // Wait for all data to be loaded before showing content
  useEffect(() => {
    if (!slotsLoading && !usersLoading && isInitialized) {
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        setIsContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [slotsLoading, usersLoading, isInitialized]);

  // Calculate quick actions based on role
  const getQuickActions = () => {
    const baseActions = [
      { id: "new-booking", label: "Neue Buchung", icon: Calendar, action: () => onNavigate?.("calendar"), roles: ["mitglied", "gastmitglied", "kranfuehrer", "admin", "vorstand"] },
      { id: "my-bookings", label: "Meine Buchungen", icon: Users, action: () => onNavigate?.("calendar"), roles: ["mitglied", "gastmitglied"] },
      { id: "manage-slots", label: "Slots verwalten", icon: Clock, action: () => onNavigate?.("slots"), roles: ["kranfuehrer", "admin", "vorstand"] },
      { id: "manage-users", label: "Benutzer verwalten", icon: Users, action: () => onNavigate?.("users"), roles: ["admin", "vorstand"] },
    ];
    
    return baseActions.filter(action => action.roles.includes(currentRole));
  };

  // Calculate dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const todaySlots = slots?.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= today && slotDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }) || [];

    const weeklySlots = slots?.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= weekStart;
    }) || [];

    const bookedToday = todaySlots.filter(s => s.isBooked).length;
    const bookedWeekly = weeklySlots.filter(s => s.isBooked).length;
    const available = slots?.filter(s => !s.isBooked).length || 0;
    const utilizationCalc = slots && slots.length > 0 
      ? Math.round((slots.filter(s => s.isBooked).length / slots.length) * 100)
      : 0;

    // Get next booking for member
    const userBookings = slots?.filter(slot => 
      slot.isBooked && 
      slot.memberId === currentUser?.id &&
      new Date(slot.date) >= today
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

    const nextBooking = userBookings[0] ? {
      time: `${userBookings[0].date} ${userBookings[0].time}`,
      member: userBookings[0].memberName || (currentUser as any)?.user_metadata?.full_name || currentUser?.email || "Unbekannt",
      duration: `${userBookings[0].duration} min`,
      id: userBookings[0].id
    } : undefined;

    // Recent activity
    const recentActivity = slots?.slice(0, 5).map((slot, index) => ({
      id: slot.id,
      type: slot.isBooked ? "booking" as const : "availability" as const,
      message: slot.isBooked 
        ? `Neue Buchung für ${slot.date}`
        : `Slot verfügbar: ${slot.date}`,
      time: slot.time,
      member: slot.memberName,
      priority: index === 0 ? "high" as const : "low" as const
    })) || [];

    return {
      todayBookings: bookedToday,
      weeklyBookings: bookedWeekly,
      availableSlots: available,
      utilization: utilizationCalc,
      totalMembers: users?.length || 0,
      nextBooking,
      recentActivity,
      quickActions: getQuickActions()
    };
  }, [slots, users, currentUser, currentRole, onNavigate]);

  // Get all dashboard items and sort them by columns
  const allItems = useMemo(() => {
    return getAllDashboardItems(currentRole, settings);
  }, [currentRole, settings]);

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
  }, [allItems, settings.allItemsPositions, settings.columnLayout, settings.mobileItemsOrder, isMobileOrTablet]);

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
  }, [isAnimationEnabled, settings.animationType, isInitialized]);

  // Show loading state until everything is ready
  if (!isContentReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 max-w-7xl mx-auto opacity-0 animate-fade-in",
      isContentReady && "opacity-100"
    )}>
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
    </div>
  );
}
