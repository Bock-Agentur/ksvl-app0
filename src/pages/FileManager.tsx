import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsFooter } from "@/components/settings-footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function FileManager() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <>
      <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-muted/20">
        <div className={cn(
          "mx-auto",
          isMobile ? "w-full px-0" : "max-w-7xl px-4 md:px-8"
        )}>
          {/* Header */}
          <div className={cn(
            "bg-gradient-to-br from-primary via-primary to-primary/90 rounded-[2rem] shadow-[0_20px_60px_-15px_hsl(var(--primary)_/_0.4)] border-0",
            isMobile ? "mx-4 mt-4 mb-4" : "mb-6 mt-8"
          )}>
            <div className="p-6 md:p-8 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0 h-12 w-12"
              >
                <ArrowLeft className="h-5 w-5 text-primary" />
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

          {/* File Manager Content - Full Width with better mobile spacing */}
          <div className={cn(
            isMobile 
              ? "h-[calc(100vh-200px)]" 
              : "h-[calc(100vh-240px)]"
          )}>
            <EnhancedFileManager />
          </div>
        </div>
      </div>
      <SettingsFooter />
    </>
  );
}
