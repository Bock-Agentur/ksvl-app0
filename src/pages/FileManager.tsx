import { useEffect, useState } from "react";
import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useIsMobile, useRole, usePageTransitionSettings } from "@/hooks";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";

export function FileManager() {
  const isMobile = useIsMobile();
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
  );
}
