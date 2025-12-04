import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useSlotDesign, useFooterMenuSettings, usePageTransitionSettings, ConsecutiveSlotsProvider } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { CalendarView } from "@/components/calendar-view";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

/**
 * Calendar Page
 * 
 * Overlay-Pattern: PageLoader und AnimatedPage werden parallel gerendert.
 * PageLoader liegt ÜBER dem Content und fadet aus.
 */
function CalendarContent() {
  const roleContext = useRole();
  const [searchParams] = useSearchParams();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [contentVisible, setContentVisible] = useState(false);
  
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  const { settings: transitionSettings } = usePageTransitionSettings();
  
  useSlotDesign();
  
  // Handle date parameter for deep linking
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const date = new Date(dateParam + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedCalendarDate(date);
      }
    }
  }, [searchParams]);
  
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
          <div className="min-h-screen flex flex-col relative z-0 pt-safe bg-background">
            <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
              <CalendarView initialDate={selectedCalendarDate} />
            </main>
            <UnifiedFooter
              currentRole={roleContext.currentRole}
              currentUser={roleContext.currentUser}
            />
          </div>
        </AnimatedPage>
      )}
      
      {/* Loader liegt DARÜBER (z-50) und fadet aus */}
      {!contentVisible && (
        <PageLoader isExiting={isReady} />
      )}
    </>
  );
}

export function Calendar() {
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
        <CalendarContent />
      </SlotsProvider>
    </ConsecutiveSlotsProvider>
  );
}

export default Calendar;
