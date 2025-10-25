import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DesktopBackgroundSettings } from "@/components/desktop-background-settings";

export function DesktopBackground() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6">
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
            <CardTitle className="font-bold text-4xl flex-1">
              Desktop-Hintergrund
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Component */}
      <DesktopBackgroundSettings />
    </div>
  );
}

export default DesktopBackground;
