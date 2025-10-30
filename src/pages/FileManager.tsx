import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsFooter } from "@/components/settings-footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

export function FileManager() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentRole } = useRole(); // Force re-render on role change

  return (
    <div key={currentRole}> {/* Force re-render when role changes */}
      <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={cn(
            "bg-gradient-to-br from-primary via-primary to-primary/90 rounded-[2rem] shadow-[0_20px_60px_-15px_hsl(var(--primary)_/_0.4)] border-0 mx-4",
            isMobile ? "mt-4 mb-4" : "mb-6 mt-8"
          )}>
            <div className="p-6 md:p-8 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className={cn(
                  "rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0",
                  isMobile ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                <ArrowLeft className={cn(
                  "text-primary",
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                )} />
              </Button>
              <div>
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
          </div>

          {/* File Manager Content */}
          <div className="px-4">
            <EnhancedFileManager />
          </div>
        </div>
      </div>
      <SettingsFooter />
    </div>
  );
}
