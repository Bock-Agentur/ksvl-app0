import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole } from "@/hooks/use-role";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { TestDataProvider } from "@/hooks/use-test-data";
import { ConsecutiveSlotsProvider } from "@/hooks/use-consecutive-slots";
import { SlotsProvider } from "@/contexts/slots-context";
import { useAppSettings } from "@/hooks/use-app-settings";
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
  // Safe hook call with fallback
  const roleContext = useRole();
  
  // Early return if context not ready
  if (!roleContext || roleContext.isLoading) {
    return <PageLoader />;
  }
  
  const { currentRole, currentUser, setRole } = roleContext;
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use database for active tab storage
  const { value: activeTab, setValue: setActiveTabRaw, isLoading: settingsLoading } = useAppSettings<string>(
    "activeTab",
    "dashboard",
    false
  );
  
  // ✅ Phase 1: Conditional Hook Execution (Lazy Loading)
  const shouldLoadUsers = activeTab === 'dashboard' || activeTab === 'users';
  const shouldLoadDashboard = activeTab === 'dashboard';
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
  
  // ✅ Simplified: Only 2 states needed
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Centralized loading state - determines when to show PageLoader
  const getLoadingStateForTab = (tab: string): boolean => {
    // Footer must always be loaded on every tab
    const baseLoading = footerLoading;
    
    switch(tab) {
      case 'dashboard': 
        return baseLoading || usersLoading || harborChatLoading || aiWelcomeLoading || profileLoading || dashboardSettingsLoading;
      case 'calendar': 
        return baseLoading; // Slots loading is now handled by SlotsProvider
      case 'users': 
        return baseLoading || usersLoading;
      case 'settings':
        return baseLoading || aiAssistantLoading || aiWelcomeLoading;
      default: 
        return baseLoading;
    }
  };
  
  const isPageLoading = settingsLoading || !currentUser || getLoadingStateForTab(activeTab);
  
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
  
  // ✅ Simplified transition: Just wait for data loading
  useEffect(() => {
    if (isPageLoading) {
      setIsTransitioning(true);
    } else {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPageLoading]);
  
  // ✅ Simplified tab change
  const setActiveTab = (tab: string) => {
    setIsTransitioning(true);
    setAnimationKey(prev => prev + 1);
    setActiveTabRaw(tab, true);
  };
  
  // Initialize slot design system
  useSlotDesign();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Phase 1: Listen for navigate-to-tab events from footer
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

  // Show loader when settings loading or no user data
  if (settingsLoading || !currentUser) {
    return <PageLoader />;
  }

  return (
    <>
      {/* ✅ Show loader only when actually loading */}
      {isTransitioning && <PageLoader />}
      
      <div 
        key={animationKey}
        className={cn(
          "transition-opacity duration-300",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
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
    </>
  );
}

const Index = () => {
  const { user, session, isLoading: loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/auth");
    }
  }, [loading, session, navigate]);

  if (loading || !session || !user) {
    return <PageLoader />;
  }

  return (
    <TestDataProvider>
      <ConsecutiveSlotsProvider>
        <SlotsProvider>
          <AppContent />
        </SlotsProvider>
      </ConsecutiveSlotsProvider>
    </TestDataProvider>
  );
};

export default Index;
