import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsFooter } from "@/components/settings-footer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function FileManager() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <>
      <div className="min-h-screen pb-20 bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header Card - Matching Settings Style */}
          <Card className={cn(
            "bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0"
          )}>
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
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
                  "font-bold",
                  isMobile ? "text-3xl" : "text-4xl"
                )}>
                  Dateimanager
                </CardTitle>
              </div>
            </CardHeader>
          </Card>

          {/* File Manager Content Card */}
          <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 overflow-hidden">
            <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-240px)]">
              <EnhancedFileManager />
            </div>
          </Card>
        </div>
      </div>
      <SettingsFooter />
    </>
  );
}
