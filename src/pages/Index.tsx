import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { TestDataProvider, useTestData } from "@/hooks/use-test-data";
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
  const { currentRole, currentUser, setRole } = useRole();
  const testData = useTestData();
  
  // Use database for active tab storage
  const { value: activeTab, setValue: setActiveTabRaw } = useAppSettings<string>(
    "activeTab",
    "dashboard",
    false
  );
  
  // Wrapper to save without toast notification
  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab, true); // skipToast = true
  };
  
  // Initialize slot design system
  useSlotDesign();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Let TestDataProvider handle initialization - no forced scenario loading

  const renderContent = () => {
    console.log("Rendering content for activeTab:", activeTab);
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "calendar":
        console.log("Rendering CalendarView");
        return <CalendarView />;
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

  return (
    <AppShell
      currentRole={currentRole}
      currentUser={currentUser}
      onRoleChange={setRole}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </AppShell>
  );
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT' || !session) {
          // Clear session and redirect to auth
          setSession(null);
          setUser(null);
          navigate("/auth");
        } else if (event === 'SIGNED_IN') {
          // Reset to dashboard after login
          await supabase
            .from('app_settings')
            .upsert({ 
              setting_key: 'activeTab', 
              setting_value: 'dashboard',
              user_id: session.user.id 
            });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!session || !user) {
    return null;
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
