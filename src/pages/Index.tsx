import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useSlotDesign, TestDataProvider, ConsecutiveSlotsProvider, useUsers, useAIAssistantSettings, useAIWelcomeMessage, useHarborChatData, useProfileData, useFooterMenuSettings, useDashboardSettings } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { Dashboard } from "@/components/dashboard";
import { PageLoader } from "@/components/common/page-loader";

/**
 * Index Page - Dashboard Only
 * 
 * After SEO-friendly URL migration, Index.tsx only renders the Dashboard.
 * Other views (Calendar, Profile, Slots) are now independent routes:
 * - /kalender - Calendar view
 * - /profil - Profile view
 * - /slots - Slot management
 */
function AppContent() {
  const roleContext = useRole();
  
  // Load dashboard-related data
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
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  const isFullyLoaded = !footerLoading && !roleContext?.isLoading;
  
  if (!roleContext || !isFullyLoaded || !roleContext.currentUser) {
    return <PageLoader />;
  }
  
  const { currentRole, currentUser, setRole } = roleContext;

  return (
    <div className="min-h-screen flex flex-col relative z-0 pt-safe bg-background">
      <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
        <Dashboard displayName={displayName} />
      </main>
      <UnifiedFooter
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={setRole}
      />
    </div>
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
