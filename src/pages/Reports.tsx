import { SettingsFooter } from "@/components/settings-footer";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { PageLoader } from "@/components/common/page-loader";
import { useRole } from "@/hooks/use-role";

export function Reports() {
  const navigate = useNavigate();
  const { isLoading: roleLoading } = useRole();
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    if (!roleLoading) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPageReady(true);
        });
      });
    }
  }, [roleLoading]);

  if (!isPageReady) {
    return <PageLoader />;
  }

  return (
    <>
      <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6">
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
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Berichte</h1>
                <p className="text-gray-600 mt-1">
                  Übersicht und Auswertungen
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="rounded-[1.5rem] border-0 shadow-[0_8px_24px_-8px_hsl(215_60%_15%_/_0.3)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Aktive Mitglieder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-0 shadow-[0_8px_24px_-8px_hsl(215_60%_15%_/_0.3)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Slots diese Woche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-0 shadow-[0_8px_24px_-8px_hsl(215_60%_15%_/_0.3)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Auslastung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-0 shadow-[0_8px_24px_-8px_hsl(215_60%_15%_/_0.3)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistiken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <Card className="rounded-[2rem] border-0 shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)]">
            <CardHeader>
              <CardTitle>Berichte & Auswertungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Berichtsfunktionen werden hier angezeigt</p>
                <p className="text-sm mt-2">Statistiken und Auswertungen in Entwicklung</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SettingsFooter />
    </>
  );
}
