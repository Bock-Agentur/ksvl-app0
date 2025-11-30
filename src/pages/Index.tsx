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
import { UnifiedFooter } from "@/components/common/unified-footer";
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
  // ✅ ALLE Hooks ZUERST aufrufen - IMMER (React Rules of Hooks)
  const roleContext = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ No local state - use activeTab directly after loading
  const { value: activeTab, setValue: setActiveTabRaw, isLoading: settingsLoading } = useAppSettings<string>(
    "activeTab",
    "dashboard",
    false
  );
  
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [footerAnimated, setFooterAnimated] = useState(false);
  
  // ✅ Alle Daten immer laden (kein conditional enabled basierend auf activeTab)
  const { loading: usersLoading } = useUsers({ enabled: !!roleContext?.currentRole });
  const { isLoading: aiAssistantLoading } = useAIAssistantSettings({ enabled: !!roleContext?.currentRole });
  const { isLoading: aiWelcomeLoading } = useAIWelcomeMessage({ enabled: !!roleContext?.currentRole });
  const { agentName, isLoading: harborChatLoading } = useHarborChatData({ enabled: !!roleContext?.currentRole });
  const { firstName, fullName: displayName, isLoading: profileLoading } = useProfileData({ enabled: !!roleContext?.currentRole });
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  const {
    settings: dashboardSettings,
    isLoading: dashboardSettingsLoading,
  } = useDashboardSettings(roleContext?.currentRole || 'mitglied', { enabled: !!roleContext?.currentRole });
  
  useSlotDesign();
  
  // ✅ ALLE useEffect Hooks VOR dem Early Return (React Rules of Hooks)
  // Verarbeite URL-Parameter für Tab- und Datumsnavigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const dateParam = searchParams.get('date');
    
    if (tabParam) {
      setActiveTabRaw(tabParam, true);
      setSearchParams({});
      return;
    }
    
    if (dateParam) {
      const date = new Date(dateParam + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedCalendarDate(date);
        setActiveTabRaw('calendar', true);
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams, setActiveTabRaw]);
  
  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);
  
  // Mark footer as animated after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setFooterAnimated(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // ✅ Synchronize all loading states
  const isFullyLoaded = !settingsLoading && !footerLoading && !roleContext?.isLoading;
  
  // ✅ JETZT erst Early Return (nach ALLEN Hooks) - Wait until everything is loaded
  if (!roleContext || !isFullyLoaded || !roleContext.currentUser || !activeTab) {
    return <PageLoader />;
  }
  
  // Ab hier normaler Code mit sicheren Werten
  const { currentRole, currentUser, setRole } = roleContext;
  
  // ✅ Tab change handler
  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab, true);
  };

  const renderContent = () => {
    // ✅ Use activeTab directly - it's guaranteed to be loaded now
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

  return (
    <>
      {/* ✅ Show loader ONLY during initial app load */}
      
      <div 
        className="min-h-screen flex flex-col relative z-0 pt-safe bg-background"
      >
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
          {renderContent()}
        </main>

        {/* Unified Footer */}
        <UnifiedFooter
          currentRole={currentRole}
          currentUser={currentUser}
          onRoleChange={setRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasAnimated={footerAnimated}
        />
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
