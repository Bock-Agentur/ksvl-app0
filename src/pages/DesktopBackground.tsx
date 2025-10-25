import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DesktopBackgroundSettings } from "@/components/desktop-background-settings";
import { RoleProvider } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLoginBackground } from "@/hooks/use-login-background";
import { useDesktopBackground } from "@/hooks/use-desktop-background";
import { SettingsFooter } from "@/components/settings-footer";

function DesktopBackgroundContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { background } = useLoginBackground();
  const { settings: desktopBackgroundSettings } = useDesktopBackground();

  const showBackground = desktopBackgroundSettings.enabled && background;

  return (
    <>
    <div 
      className={cn(
        "min-h-screen pb-20 bg-background",
        isMobile ? "p-0" : "p-6"
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
        "bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6 mt-6",
        isMobile && "mx-4"
      )}>
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/settings")}
              className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
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
