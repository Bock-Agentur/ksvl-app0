import { useEffect, useState } from "react";
import { UserManagementRefactored } from "@/components/user-management";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { useRole, usePageTransitionSettings } from "@/hooks";

/**
 * Mitgliederverwaltung Page
 * 
 * Overlay-Pattern: PageLoader und AnimatedPage werden parallel gerendert.
 * PageLoader liegt ÜBER dem Content und fadet aus.
 */
export function Users() {
  const { isLoading } = useRole();
  const [contentVisible, setContentVisible] = useState(false);
  const { settings: transitionSettings } = usePageTransitionSettings();

  const isReady = !isLoading;

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
          <PageLayout>
            <UserManagementRefactored />
          </PageLayout>
        </AnimatedPage>
      )}
      
      {/* Loader liegt DARÜBER (z-50) und fadet aus */}
      {!contentVisible && (
        <PageLoader isExiting={isReady} />
      )}
    </>
  );
}
