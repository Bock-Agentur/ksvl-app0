import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useSlotDesign, useFooterMenuSettings, ConsecutiveSlotsProvider } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { CalendarView } from "@/components/calendar-view";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

/**
 * Calendar Page
 * 
 * Pattern A: PageLoader für Loading, dann AnimatedPage + Footer ohne Conditional
 */
function CalendarContent() {
  const roleContext = useRole();
  const [searchParams] = useSearchParams();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
  const { isLoading: footerLoading } = useFooterMenuSettings(roleContext?.currentRole || 'mitglied');
  
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

  // Pattern A: PageLoader für Loading-State
  if (!isReady) {
    return <PageLoader />;
  }

  // Pattern A: AnimatedPage + Footer ohne Conditional
  return (
    <>
      <AnimatedPage>
        <div className="min-h-screen flex flex-col pt-safe bg-background">
          <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
            <CalendarView initialDate={selectedCalendarDate} />
          </main>
        </div>
      </AnimatedPage>
      <UnifiedFooter
        currentRole={roleContext.currentRole}
        currentUser={roleContext.currentUser}
      />
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

  // Auth-Check mit PageLoader
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
