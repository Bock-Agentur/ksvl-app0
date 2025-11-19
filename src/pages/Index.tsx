import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { TestDataProvider } from "@/hooks/use-test-data";
import { ConsecutiveSlotsProvider } from "@/hooks/use-consecutive-slots";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useSlots } from "@/hooks/use-slots";
import { useUsers } from "@/hooks/use-users";
import { useAIAssistantSettings } from "@/hooks/use-ai-assistant-settings";
import { useAIWelcomeMessage } from "@/hooks/use-ai-welcome-message";
import { useHarborChatData } from "@/hooks/use-harbor-chat-data";
import { useProfileData } from "@/hooks/use-profile-data";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { UserManagementRefactored as UserManagement } from "@/components/user-management";
import { SlotManagement } from "@/components/slot-management";
import { ProfileView } from "@/components/profile-view";
import { Settings } from "@/pages/Settings";
import { CalendarView } from "@/components/calendar-view";
import { PageLoader } from "@/components/common/page-loader";
import { cn } from "@/lib/utils";

// Inner component that uses the role context
function AppContent() {
  const { currentRole, currentUser, setRole, isLoading: roleLoading } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use database for active tab storage
  const { value: activeTab, setValue: setActiveTabRaw, isLoading: settingsLoading } = useAppSettings<string>(
    "activeTab",
    "dashboard",
    false
  );
  
  // ✅ Phase 1: Conditional Hook Execution (Lazy Loading)
  const shouldLoadSlots = activeTab === 'dashboard' || activeTab === 'calendar';
  const shouldLoadUsers = activeTab === 'dashboard' || activeTab === 'users';
  const shouldLoadDashboard = activeTab === 'dashboard';

  const { isLoading: slotsLoading } = useSlots({ enabled: shouldLoadSlots });
  const { loading: usersLoading } = useUsers({ enabled: shouldLoadUsers });
  const { isLoading: aiAssistantLoading } = useAIAssistantSettings({ enabled: shouldLoadDashboard });
  const { isLoading: aiWelcomeLoading } = useAIWelcomeMessage({ enabled: shouldLoadDashboard });
  const { agentName, isLoading: harborChatLoading } = useHarborChatData({ enabled: shouldLoadDashboard });
  const { firstName, fullName: displayName, isLoading: profileLoading } = useProfileData({ enabled: shouldLoadDashboard });
  const { isLoading: footerLoading } = useFooterMenuSettings(currentRole);
  const {
    settings: dashboardSettings,
    isLoading: dashboardSettingsLoading,
  } = useDashboardSettings(currentRole, { enabled: shouldLoadDashboard });
  
  // State für das ausgewählte Datum im Kalender
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Centralized loading state - determines when to show PageLoader
  const getLoadingStateForTab = (tab: string): boolean => {
    const baseLoading = footerLoading;
    
    switch(tab) {
      case 'dashboard': 
        return baseLoading || slotsLoading || usersLoading || harborChatLoading || aiWelcomeLoading || profileLoading || dashboardSettingsLoading;
      case 'calendar': 
        return baseLoading || slotsLoading;
      case 'users': 
        return baseLoading || usersLoading;
      case 'settings':
        return baseLoading || aiAssistantLoading || aiWelcomeLoading;
      default: 
        return baseLoading;
    }
  };
  
  const isCurrentTabLoading = getLoadingStateForTab(activeTab);
  
  // Wait for all data to load, then render content smoothly
  useEffect(() => {
    if (!isCurrentTabLoading && !roleLoading && !settingsLoading && currentUser) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPageReady(true);
        });
      });
    }
  }, [isCurrentTabLoading, roleLoading, settingsLoading, currentUser]);
  
  // Reset page ready when tab changes
  useEffect(() => {
    setIsPageReady(false);
  }, [activeTab]);
  
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
  
  // Tab-Wechsel Logik
  const setActiveTab = async (tab: string) => {
    setIsPageReady(false); // Trigger loader
    setActiveTabRaw(tab, true);
  };
  
  // Initialize slot design system
  useSlotDesign();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Listen for navigate-to-tab events from footer
  useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent<{ tab: string }>) => {
      const targetTab = event.detail.tab;
      setActiveTab(targetTab);
    };
    
    window.addEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} displayName={displayName} />;
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
        return <Dashboard displayName={displayName} />;
    }
  };

  // Show loader until page is ready
  if (!isPageReady) {
    return <PageLoader />;
  }

  return (
    <AppShell
      currentRole={currentRole}
      currentUser={currentUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRoleChange={setRole}
    >
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </AppShell>
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
          // Nach dem Login zwingend Dashboard laden
          const userId = session?.user?.id;
          if (userId) {
            setTimeout(async () => {
              await supabase
                .from('app_settings')
                .delete()
                .eq('user_id', userId)
                .eq('setting_key', 'activeTab');
              
              await supabase
                .from('app_settings')
                .insert({ 
                  user_id: userId,
                  setting_key: 'activeTab',
                  setting_value: 'dashboard'
                });
            }, 0);
          }
          navigate("/", { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !session || !user) {
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
