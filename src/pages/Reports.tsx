import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/common/page-layout";
import { PageLoader } from "@/components/common/page-loader";
import { AnimatedPage } from "@/components/common/animated-page";
import { UnifiedFooter } from "@/components/common/unified-footer";
import { useRole, useFooterMenuSettings } from "@/hooks";

/**
 * Reports Page - Pattern A
 * 
 * Architektur:
 * - PageLoader während Auth/Role/Footer laden
 * - AnimatedPage für Content mit CSS-Animation
 * - UnifiedFooter außerhalb AnimatedPage (sofort sichtbar)
 */
export function Reports() {
  const navigate = useNavigate();
  const { isLoading: roleLoading, currentRole, currentUser } = useRole();
  const { isLoading: footerLoading } = useFooterMenuSettings(currentRole || 'mitglied');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isReady = !roleLoading && !footerLoading && !!currentUser;

  // PageLoader während Auth/Role/Footer laden
  if (!isReady) {
    return <PageLoader />;
  }

  return (
    <>
      <AnimatedPage>
        <PageLayout>
          <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
              {/* Header */}
              <div className="bg-card rounded-[2rem] shadow-elevated-maritime border-0 mb-6">
                <div className="p-6 md:p-8 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-full bg-background shadow-md hover:shadow-lg transition-shadow border border-border h-12 w-12"
                  >
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Berichte</h1>
                    <p className="text-muted-foreground mt-1">
                      Übersicht und Auswertungen
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="rounded-[1.5rem] border-0 shadow-card-maritime">
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

                <Card className="rounded-[1.5rem] border-0 shadow-card-maritime">
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

                <Card className="rounded-[1.5rem] border-0 shadow-card-maritime">
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

                <Card className="rounded-[1.5rem] border-0 shadow-card-maritime">
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
              <Card className="rounded-[2rem] border-0 shadow-elevated-maritime">
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
        </PageLayout>
      </AnimatedPage>
      
      {/* Footer AUSSERHALB AnimatedPage - sofort sichtbar und sticky */}
      <UnifiedFooter
        currentRole={currentRole}
        currentUser={currentUser}
      />
    </>
  );
}
