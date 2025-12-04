import { useEffect, useState } from "react";
import { UserManagementRefactored } from "@/components/user-management";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { useRole, usePageTransitionSettings } from "@/hooks";

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
  const { settings: transitionSettings } = usePageTransitionSettings();

  // Handle smooth transition mit dynamischer Dauer aus Settings
  useEffect(() => {
    if (!isLoading) {
      setLoaderExiting(true);
      const fadeOutDuration = transitionSettings.enabled 
        ? transitionSettings.loaderFadeOutDuration 
        : 0;
      const timer = setTimeout(() => setShowContent(true), fadeOutDuration);
      return () => clearTimeout(timer);
    }
  }, [isLoading, transitionSettings.enabled, transitionSettings.loaderFadeOutDuration]);

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
