import { useEffect } from "react";
import { UserManagementRefactored } from "@/components/user-management";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { useRole, useFooterMenuSettings } from "@/hooks";

/**
 * Mitgliederverwaltung Page - Pattern A
 * 
 * Architektur:
 * - PageLoader während Auth/Role/Footer laden
 * - AnimatedPage für Content mit CSS-Animation
 * - UnifiedFooter außerhalb AnimatedPage (sofort sichtbar)
 */
export function Users() {
  const { isLoading: roleLoading, currentRole, currentUser } = useRole();
  const { isLoading: footerLoading } = useFooterMenuSettings(currentRole || 'mitglied');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isReady = !roleLoading && !footerLoading && !!currentUser;

  // PageLoader während Auth/Role/Footer laden
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
