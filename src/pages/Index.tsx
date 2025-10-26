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
  
  // Load data for dashboard and calendar
  const { isLoading: slotsLoading } = useSlots();
  const { loading: usersLoading } = useUsers();
  
  // Load AI-related data
  const { isLoading: aiAssistantLoading } = useAIAssistantSettings();
  const { isLoading: aiWelcomeLoading } = useAIWelcomeMessage();
  const { isLoading: harborChatLoading } = useHarborChatData();
  const { isLoading: profileLoading } = useProfileData();
  
  // Load footer menu data
  const { isLoading: footerLoading } = useFooterMenuSettings();
  
  // Load dashboard settings
  const { isLoading: dashboardSettingsLoading } = useDashboardSettings(currentRole, false);
  
  // Load full user name for header (direct DB call to avoid double loading)
  const [displayNameLoading, setDisplayNameLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const loadDisplayName = async () => {
      if (!currentUser?.id) {
        setDisplayName('User');
        setDisplayNameLoading(false);
        return;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, name')
        .eq('id', currentUser.id)
        .single();
      
      const fullName = profileData?.first_name && profileData?.last_name
        ? `${profileData.first_name} ${profileData.last_name}`
        : profileData?.name || 'User';
      
      setDisplayName(fullName);
      setDisplayNameLoading(false);
    };
    
    loadDisplayName();
  }, [currentUser?.id]);
  
  // State für das ausgewählte Datum im Kalender
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
  // 3-Phase transition system: fade-out → loader → fade-in + slide-up
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentReady, setContentReady] = useState(true);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Centralized loading state - determines when to show PageLoader
  const getLoadingStateForTab = (tab: string): boolean => {
    // Footer must always be loaded on every tab
    const baseLoading = footerLoading;
    
    switch(tab) {
      case 'dashboard': 
        return baseLoading || slotsLoading || usersLoading || harborChatLoading || aiWelcomeLoading || profileLoading || dashboardSettingsLoading || displayNameLoading;
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
  
  const isPageLoading = roleLoading || settingsLoading || !currentUser || getLoadingStateForTab(activeTab);
  
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
  
  // Phase 2 & 3: Wait for data loading, then for DOM render
  useEffect(() => {
    if (pendingTab && activeTab === pendingTab) {
      // Wait for data to load
      if (!isPageLoading) {
        // Then wait for DOM to be fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setContentReady(true);
            setIsTransitioning(false);
            setPendingTab(null);
          });
        });
      }
    }
  }, [activeTab, pendingTab, isPageLoading]);
  
  // Phase 1: Fade out and trigger tab switch
  const setActiveTab = async (tab: string) => {
    setIsTransitioning(true);
    setContentReady(false);
    await new Promise(resolve => setTimeout(resolve, 200)); // Fade out duration
    setPendingTab(tab);
    setAnimationKey(prev => prev + 1);
    setActiveTabRaw(tab, true); // This triggers React to start rendering new page
  };
  
  // Initialize slot design system
  useSlotDesign();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

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

  // Show loader during initial load or when no user
  if (roleLoading || settingsLoading || !currentUser) {
    return <PageLoader />;
  }

  return (
    <>
      {/* Show loader during page transitions when data is loading */}
      {isPageLoading && <PageLoader />}
      
      <div 
        key={animationKey}
        className={cn(
          "transition-all duration-300 ease-out",
          !contentReady || isTransitioning || isPageLoading ? "opacity-0" : "opacity-100 animate-page-transition-in"
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
