import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useSlotDesign, ConsecutiveSlotsProvider, useProfileData, useFooterMenuSettings, usePageTransitionSettings } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { Dashboard } from "@/components/dashboard";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

/**
 * Index Page - Dashboard Only
 * 
 * Overlay-Pattern: PageLoader und AnimatedPage werden parallel gerendert.
 * PageLoader liegt ÜBER dem Content und fadet aus.
 */
function AppContent() {
  const roleContext = useRole();
  const [contentVisible, setContentVisible] = useState(false);
  
  // Only load what's needed for page structure
  const { fullName: displayName } = useProfileData({ enabled: !!roleContext?.currentRole });
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  const { settings: transitionSettings } = usePageTransitionSettings();
  
  useSlotDesign();
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  
  const isReady = !footerLoading && !roleContext?.isLoading && !!roleContext?.currentUser;
  
  // Loader wird erst entfernt NACHDEM seine fade-out Animation komplett ist
  useEffect(() => {
    if (isReady) {
      const fadeOutDuration = transitionSettings.enabled 
        ? transitionSettings.loaderFadeOutDuration 
        : 0;
      const timer = setTimeout(() => setContentVisible(true), fadeOutDuration);
      return () => clearTimeout(timer);
    }
  }, [isReady, transitionSettings.enabled, transitionSettings.loaderFadeOutDuration]);

  return (
    <>
      {/* Content wird gerendert sobald Daten bereit sind */}
      {isReady && (
        <AnimatedPage>
          <div className="min-h-screen flex flex-col pt-safe bg-background">
            <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
              <Dashboard displayName={displayName} />
            </main>
            <UnifiedFooter
              currentRole={roleContext.currentRole}
              currentUser={roleContext.currentUser}
            />
          </div>
        </AnimatedPage>
      )}
      
      {/* Loader liegt DARÜBER und fadet aus - z-40 damit Footer (z-50) darüber bleibt */}
      {!contentVisible && (
        <PageLoader isExiting={isReady} />
      )}
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
    <ConsecutiveSlotsProvider>
      <SlotsProvider>
        <AppContent />
      </SlotsProvider>
    </ConsecutiveSlotsProvider>
  );
};

export default Index;
