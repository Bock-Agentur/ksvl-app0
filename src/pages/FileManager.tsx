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
            "bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0",
            isMobile ? "mx-4 mt-4 mb-4" : "mb-6 mt-8"
          )}>
            <div className="p-6 md:p-8 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100 h-12 w-12"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900" />
              </Button>
              <div>
                <h1 className={cn(
                  "font-bold tracking-tight text-gray-900",
                  isMobile ? "text-2xl" : "text-3xl"
                )}>Dateimanager</h1>
                {!isMobile && (
                  <p className="text-gray-600 mt-1">
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
