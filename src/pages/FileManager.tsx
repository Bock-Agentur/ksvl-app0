import { EnhancedFileManager } from "@/components/file-manager/enhanced-file-manager";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/hooks/use-role";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Calendar, FileText, Settings, Menu } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useState, useEffect } from "react";
import { PageLoader } from "@/components/common/page-loader";

export function FileManager() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentRole, isLoading: roleLoading } = useRole();
  const { getMenuItemsForRole, getDisplaySettingsForRole, isLoading: footerLoading } = useFooterMenuSettings(currentRole);
  const footerMenuItems = getMenuItemsForRole(currentRole);
  const { showLabels } = getDisplaySettingsForRole(currentRole);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  const isPageLoading = roleLoading || footerLoading;

  useEffect(() => {
    // Reset immediately when loading starts
    if (isPageLoading) {
      setIsPageReady(false);
      return;
    }

    // Set page ready after loading completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPageReady(true);
      });
    });
  }, [isPageLoading]);

  if (!isPageReady) {
    return <PageLoader />;
  }

  const handleNavigate = (itemId: string) => {
    if (itemId === 'file-manager') {
      // Already on file-manager, do nothing
    } else if (itemId === 'reports') {
      navigate('/reports');
    } else if (itemId === 'settings') {
      navigate('/settings');
    } else if (itemId === 'header-message') {
      navigate('/header-message');
    } else if (itemId === 'desktop-background') {
      navigate('/desktop-background');
    } else {
      // Navigate back to main app with tab
      navigate(`/?tab=${itemId}`);
    }
    setIsMenuOpen(false);
  };

  return (
    <div key={currentRole} className="animate-fade-in">
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
                onClick={() => navigate("/")}
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

      {/* Footer Menu */}
      {!footerLoading && footerMenuItems.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-around px-2 sm:px-4 py-2 max-w-7xl mx-auto">
            {footerMenuItems.map((item, index) => {
              const IconComponent = LucideIcons[item.icon as keyof typeof LucideIcons] as React.ComponentType<{
                className?: string;
              }>;
              const Icon = IconComponent || Home;
              const isActive = item.id === 'file-manager';
              
              return (
                <Button
                  key={`${item.id}-${index}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    "flex flex-col items-center h-auto py-2 px-1 sm:px-3 relative transition-wave min-w-0",
                    showLabels ? "gap-1" : "gap-0",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {showLabels && <span className="text-xs font-medium truncate max-w-16">{item.label}</span>}
                  {item.badge && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}

            {/* Burger Menu for Admin/Vorstand */}
            {(currentRole === 'admin' || currentRole === 'vorstand') && (
              <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm" className={cn(
                    "flex flex-col items-center h-auto py-2 px-1 sm:px-3 min-w-0",
                    showLabels ? "gap-1" : "gap-0"
                  )}>
                    <Menu className="w-5 h-5 flex-shrink-0" />
                    {showLabels && <span className="text-xs font-medium">Menü</span>}
                  </Button>
                </DrawerTrigger>
                
                <DrawerContent className="max-h-[90vh]">
                  <DrawerHeader className="pb-2">
                    <DrawerTitle className="text-base">Menü</DrawerTitle>
                  </DrawerHeader>
                  
                  <div className="px-4 pb-6 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate('settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Einstellungen
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleNavigate('file-manager')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Dateimanager
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
