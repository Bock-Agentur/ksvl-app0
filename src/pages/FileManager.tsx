import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsFooter } from "@/components/settings-footer";

export function FileManager() {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          {/* Header Card - Matching Settings Style */}
          <div className="bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 m-4 md:m-8 mb-0">
            <div className="p-6 md:p-8 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full bg-white shadow-md hover:bg-white/90 transition-colors h-12 w-12"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Dateimanager</h1>
                <p className="text-white/90 mt-1">
                  Zentrale Verwaltung für alle Dokumente und Medien
                </p>
              </div>
            </div>
          </div>

          {/* File Manager Content */}
          <div className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 m-4 md:m-8 mt-4 md:mt-6 overflow-hidden">
            <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-240px)]">
              <EnhancedFileManager />
            </div>
          </div>
        </div>
      </div>
      <SettingsFooter />
    </>
  );
}
