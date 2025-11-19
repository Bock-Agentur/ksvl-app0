import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DesktopBackgroundSettings } from "@/components/desktop-background-settings";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLoginBackground } from "@/hooks/use-login-background";
import { useDesktopBackground } from "@/hooks/use-desktop-background";
import { SettingsFooter } from "@/components/settings-footer";
import { useState, useEffect } from "react";
import { PageLoader } from "@/components/common/page-loader";

function DesktopBackgroundContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isLoading: roleLoading } = useRole();
  const { background, isLoading: bgLoading } = useLoginBackground();
  const { settings: desktopBackgroundSettings, isLoading: desktopBgLoading } = useDesktopBackground();
  const [isPageReady, setIsPageReady] = useState(false);

  const showBackground = desktopBackgroundSettings.enabled && background;
  const isPageLoading = roleLoading || bgLoading || desktopBgLoading;

  useEffect(() => {
    if (!isPageLoading) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPageReady(true);
        });
      });
    } else {
      setIsPageReady(false);
    }
  }, [isPageLoading]);

  if (!isPageReady) {
    return <PageLoader />;
  }

  return (
    <>
    <div 
      className={cn(
        "min-h-screen pb-20 bg-background animate-fade-in",
        isMobile ? "pt-4" : "p-6"
      )}
      style={showBackground ? {
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : undefined}
    >
      <div className={cn("max-w-4xl mx-auto")}>
      {/* Header */}
      <Card className={cn(
        "bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6",
        isMobile && "mx-4"
      )}>
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/settings")}
              className={cn(
                "rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors shadow-md",
                isMobile ? "w-8 h-8" : "w-10 h-10"
              )}
            >
              <ArrowLeft className={cn(
                "text-foreground",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
            </button>
            <CardTitle className={cn(
              "font-bold flex-1 text-center text-white",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              Desktop-Hintergrund
            </CardTitle>
            {/* Spacer für Zentrierung */}
            <div className="w-10" />
          </div>
        </CardHeader>
      </Card>

      {/* Settings Component */}
      <div className={cn(isMobile ? "px-4" : "")}>
        <DesktopBackgroundSettings />
      </div>
      </div>
    </div>
    <SettingsFooter />
    </>
  );
}

export function DesktopBackground() {
  return (
    <RoleProvider>
      <DesktopBackgroundContent />
    </RoleProvider>
  );
}

export default DesktopBackground;
