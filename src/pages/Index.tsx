import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { TestDataProvider } from "@/hooks/use-test-data";
import { ConsecutiveSlotsProvider } from "@/hooks/use-consecutive-slots";
import { useAppSettings } from "@/hooks/use-app-settings";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { UserManagementRefactored as UserManagement } from "@/components/user-management";
import { SlotManagement } from "@/components/slot-management";
import { ProfileView } from "@/components/profile-view";
import { Settings } from "@/pages/Settings";
import { CalendarView } from "@/components/calendar-view";

// Inner component that uses the role context
function AppContent() {
  const { currentRole, currentUser, setRole, isLoading: roleLoading } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use database for active tab storage
  const { value: activeTab, setValue: setActiveTabRaw, isLoading: settingsLoading } = useAppSettings<string>(
    "activeTab",
    "dashboard",
    false
  );
  
  // State für das ausgewählte Datum im Kalender
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
  // Verarbeite URL-Parameter für Datumsnavigation
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const date = new Date(dateParam + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedCalendarDate(date);
        setActiveTabRaw('calendar', true);
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams, setActiveTabRaw]);
  
  // Wrapper to save without toast notification
  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab, true);
  };
  
  // Initialize slot design system
  useSlotDesign();

  // Reset to dashboard only on initial load/refresh
  useEffect(() => {
    if (!roleLoading && !settingsLoading && isInitialLoad) {
      setActiveTabRaw('dashboard', true);
      setIsInitialLoad(false);
    }
  }, [roleLoading, settingsLoading, isInitialLoad, setActiveTabRaw]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "calendar":
        return <CalendarView initialDate={selectedCalendarDate} />;
      case "profile":
        return <ProfileView currentRole={currentRole} />;
      case "users":
        return <UserManagement />;
      case "slots":
        return <SlotManagement />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Show minimal loading only for initial auth check
  if (roleLoading || settingsLoading || !currentUser) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <AppShell
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={setRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderContent()}
      </AppShell>
    </div>
  );
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          navigate("/auth");
        } else if (event === 'SIGNED_IN') {
          navigate("/", { replace: true });
          
          // Update activeTab in background
          setTimeout(() => {
            supabase
              .from('app_settings')
              .upsert({ 
                setting_key: 'activeTab', 
                setting_value: 'dashboard',
                user_id: session?.user?.id 
              }, {
                onConflict: 'user_id,setting_key'
              });
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !session || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  return (
    <TestDataProvider>
      <RoleProvider>
        <ConsecutiveSlotsProvider>
          <AppContent />
        </ConsecutiveSlotsProvider>
      </RoleProvider>
    </TestDataProvider>
  );
};

export default Index;
