import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole, useSlotDesign, useFooterMenuSettings } from "@/hooks";
import { SlotsProvider } from "@/contexts/slots-context";
import { TestDataProvider, ConsecutiveSlotsProvider } from "@/hooks";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { CalendarView } from "@/components/calendar-view";
import { PageLoader } from "@/components/common/page-loader";

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
  
  const isFullyLoaded = !footerLoading && !roleContext?.isLoading;
  
  if (!roleContext || !isFullyLoaded || !roleContext.currentUser) {
    return <PageLoader />;
  }
  
  const { currentRole, currentUser, setRole } = roleContext;

  return (
    <div className="min-h-screen flex flex-col relative z-0 pt-safe bg-background">
      <main className="flex-1 overflow-auto pb-20 mx-0 px-0 py-0">
        <CalendarView initialDate={selectedCalendarDate} />
      </main>
      <UnifiedFooter
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={setRole}
      />
    </div>
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
    <TestDataProvider>
      <ConsecutiveSlotsProvider>
        <SlotsProvider>
          <CalendarContent />
        </SlotsProvider>
      </ConsecutiveSlotsProvider>
    </TestDataProvider>
  );
}

export default Calendar;
