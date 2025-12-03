import { useEffect, useState } from "react";
import { UserManagementRefactored } from "@/components/user-management";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { useRole } from "@/hooks";

/**
 * Mitgliederverwaltung Page
 * 
 * Zentrale Seite für die Verwaltung von Mitgliedern.
 * Zugriff nur für Admin und Vorstand.
 */
export function Users() {
  const { isLoading } = useRole();
  const [showContent, setShowContent] = useState(false);
  const [loaderExiting, setLoaderExiting] = useState(false);

  // Handle smooth transition
  useEffect(() => {
    if (!isLoading) {
      setLoaderExiting(true);
      const timer = setTimeout(() => setShowContent(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!showContent) {
    return <PageLoader isExiting={loaderExiting} />;
  }

  return (
    <AnimatedPage>
      <PageLayout>
        <UserManagementRefactored />
      </PageLayout>
    </AnimatedPage>
  );
}
