import { useEffect } from "react";
import { UserManagementRefactored } from "@/components/user-management";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { useRole } from "@/hooks";

/**
 * Mitgliederverwaltung Page
 * 
 * Vereinfachte Architektur: AnimatedPage übernimmt die visuelle Überblendung.
 * PageLoader nur noch für initialen Auth-Check.
 */
export function Users() {
  const { isLoading, currentRole, currentUser } = useRole();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isReady = !isLoading;

  // PageLoader nur während Auth/Role lädt
  if (!isReady) {
    return <PageLoader />;
  }

  return (
    <>
      {/* Content mit Animation */}
      <AnimatedPage>
        <PageLayout>
          <UserManagementRefactored />
        </PageLayout>
      </AnimatedPage>
      
      {/* Footer AUSSERHALB AnimatedPage - sofort sichtbar und sticky */}
      <UnifiedFooter
        currentRole={currentRole}
        currentUser={currentUser}
      />
    </>
  );
}
