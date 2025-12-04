import { useEffect, useState } from "react";
import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useIsMobile, useRole, usePageTransitionSettings } from "@/hooks";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

/**
 * File Manager Page
 * 
 * Overlay-Pattern: PageLoader und AnimatedPage werden parallel gerendert.
 * PageLoader liegt ÜBER dem Content und fadet aus.
 */
export function FileManager() {
  const isMobile = useIsMobile();
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
            <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-muted/20">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className={cn(
                  "bg-gradient-to-br from-primary via-primary to-primary/90 rounded-[2rem] shadow-[0_20px_60px_-15px_hsl(var(--primary)_/_0.4)] border-0 mx-4",
                  isMobile ? "mt-4 mb-4" : "mb-6 mt-8"
                )}>
                  <div className="p-6 md:p-8">
                    <h1 className={cn(
                      "font-bold tracking-tight text-white",
                      isMobile ? "text-2xl" : "text-3xl"
                    )}>Dateimanager</h1>
                    {!isMobile && (
                      <p className="text-white/90 mt-1">
                        Zentrale Verwaltung für alle Dokumente und Medien
                      </p>
                    )}
                  </div>
                </div>

                {/* File Manager Content */}
                <div className="px-4">
                  <EnhancedFileManager />
                </div>
              </div>
            </div>
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
