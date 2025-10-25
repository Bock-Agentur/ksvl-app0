import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeaderMessageSettings } from "@/components/header-message-settings";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleProvider } from "@/hooks/use-role";
import { useLoginBackground } from "@/hooks/use-login-background";
import { useDesktopBackground } from "@/hooks/use-desktop-background";

function HeaderMessageContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { background } = useLoginBackground();
  const { settings: desktopBackgroundSettings } = useDesktopBackground();

  const showBackground = desktopBackgroundSettings.enabled && background;

  return (
    <div 
      className={cn(
        "min-h-screen",
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
      <div className="max-w-4xl mx-auto">{/* Header */}
      <Card className={cn(
        "bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6",
        isMobile && "mx-4"
      )}>
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className={cn(
              "font-bold flex-1",
              isMobile ? "text-2xl" : "text-4xl"
            )}>
              Header-Nachricht
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Settings */}
      <div className={cn(isMobile ? "px-4" : "")}>
        <HeaderMessageSettings />
      </div>
      </div>
    </div>
  );
}

export function HeaderMessage() {
  return (
    <RoleProvider>
      <HeaderMessageContent />
    </RoleProvider>
  );
}
