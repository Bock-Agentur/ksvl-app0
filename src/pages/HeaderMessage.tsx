import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeaderMessageSettings } from "@/components/header-message-settings";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleProvider } from "@/hooks/use-role";
import { useLoginBackground } from "@/hooks/use-login-background";
import { SettingsFooter } from "@/components/settings-footer";

function HeaderMessageContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { background } = useLoginBackground();

  const showBackground = false; // Desktop background feature removed

  return (
    <>
    <div 
      className={cn(
        "min-h-screen pb-20 bg-background",
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
              Header-Nachricht
            </CardTitle>
            {/* Spacer für Zentrierung */}
            <div className="w-10" />
          </div>
        </CardHeader>
      </Card>

      {/* Settings */}
      <div className={cn(isMobile ? "px-4" : "")}>
        <HeaderMessageSettings />
      </div>
      </div>
    </div>
    <SettingsFooter />
    </>
  );
}

export function HeaderMessage() {
  return (
    <RoleProvider>
      <HeaderMessageContent />
    </RoleProvider>
  );
}
