import { useNavigate, useLocation } from "react-router-dom";
import { Home, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { useMenuSettings } from "@/hooks/use-menu-settings";
import { useRole } from "@/hooks/use-role";
import * as LucideIcons from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole } from "@/types";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";
import { Settings, Palette, TestTube, Users, Calendar, FileText, Layers, FolderOpen } from "lucide-react";
import { ROUTES } from "@/lib/registry/routes";

// Icon mapping for dynamic menu items
const iconMap = {
  Palette,
  TestTube,
  Users,
  Calendar,
  FileText,
  Settings,
  Layers,
  FolderOpen
};

export function SettingsFooter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, currentUser, setRole, isLoading: roleLoading } = useRole();
  const { getMenuItemsForRole, getDisplaySettingsForRole, isLoading: footerLoading } = useFooterMenuSettings(currentRole);
  const { getOrderedHeaderItems } = useMenuSettings();
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const footerItems = getMenuItemsForRole(currentRole);
  const currentDisplaySettings = getDisplaySettingsForRole(currentRole);
  const showLabels = currentDisplaySettings?.showLabels ?? false;

  // Get dynamic header navigation items based on settings
  const menuItems = getOrderedHeaderItems();
  const availableHeaderItems = menuItems.filter(item => item.roles.includes(currentRole)).map(item => ({
    id: item.id,
    label: item.label,
    icon: iconMap[item.icon as keyof typeof iconMap] || Settings,
    roles: item.roles,
    badge: item.badge
  }));

  // Listen for footer and menu settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('footerSettingsChanged', handleSettingsChange);
    window.addEventListener('menuSettingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('footerSettingsChanged', handleSettingsChange);
      window.removeEventListener('menuSettingsChanged', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (isInitialized && !footerLoading && !roleLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, footerLoading, roleLoading]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Erfolgreich abgemeldet");
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Fehler beim Abmelden");
    }
  };

  const roleLabels: Record<UserRole, string> = {
    gastmitglied: "Gastmitglied",
    mitglied: "Mitglied",
    kranfuehrer: "Kranführer",
    admin: "Admin",
    vorstand: "Vorstand"
  };

  const roleColors: Record<UserRole, string> = {
    gastmitglied: "bg-muted text-muted-foreground",
    mitglied: "bg-accent text-accent-foreground",
    kranfuehrer: "bg-gradient-ocean text-primary-foreground",
    admin: "bg-gradient-deep text-primary-foreground",
    vorstand: "bg-gradient-deep text-primary-foreground"
  };

  const handleNavigate = (id: string) => {
    // Handle route-based items using Route Registry
    if (id === 'file-manager') {
      navigate(ROUTES.protected.fileManager.path);
      return;
    }
    if (id === 'reports') {
      navigate(ROUTES.protected.reports.path);
      return;
    }
    if (id === 'settings') {
      navigate(ROUTES.protected.settings.path);
      return;
    }
    if (id === 'header-message') {
      navigate(ROUTES.protected.headerMessage.path);
      return;
    }
    if (id === 'desktop-background') {
      navigate(ROUTES.protected.desktopBackground.path);
      return;
    }
    
    // For all other items, navigate to dashboard first
    navigate('/');
    // Then dispatch tab change event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: id } }));
    }, 100);
  };

  // Determine active state based on current route
  const isItemActive = (itemId: string) => {
    const currentPath = location.pathname;
    
    // Check route-based items using Route Registry
    if (itemId === 'file-manager') return currentPath === ROUTES.protected.fileManager.path;
    if (itemId === 'reports') return currentPath === ROUTES.protected.reports.path;
    if (itemId === 'settings') return currentPath === ROUTES.protected.settings.path;
    if (itemId === 'header-message') return currentPath === ROUTES.protected.headerMessage.path;
    if (itemId === 'desktop-background') return currentPath === ROUTES.protected.desktopBackground.path;
    
    // For dashboard items, check if we're on the main page
    if (currentPath === '/') return itemId === 'dashboard';
    
    return false;
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 pb-safe-bottom shadow-elevated-maritime z-50",
      "transform will-change-transform",
      isReady 
        ? "translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        : "translate-y-full"
    )}>
      <div className="flex justify-evenly items-center max-w-md mx-auto">
        {footerItems.map((item, index) => {
          const IconComponent = (LucideIcons as any)[item.icon] || Home;
          const isActive = isItemActive(item.id);
          
          return (
            <Button
              key={`${item.id}-${index}-${currentRole}-${forceUpdate}`}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "flex flex-col items-center h-auto py-2 px-1 sm:px-3 relative transition-wave min-w-0",
                showLabels ? "gap-1" : "gap-0",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              {showLabels && (
                <span className="text-xs font-medium truncate max-w-16">{item.label}</span>
              )}
              {item.badge && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}

        {/* Burger Menu - Always visible for admin/vorstand */}
        {(currentRole === 'admin' || currentRole === 'vorstand') && (
          <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DrawerTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "flex flex-col items-center h-auto py-2 px-1 sm:px-3 min-w-0",
                  showLabels ? "gap-1" : "gap-0"
                )}
              >
                <Menu className="w-5 h-5 flex-shrink-0" />
                {showLabels && <span className="text-xs font-medium">Menü</span>}
              </Button>
            </DrawerTrigger>
            
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-base">Menü</DrawerTitle>
              </DrawerHeader>
              
              <div className="overflow-y-auto px-3 pb-4 space-y-3">
                {/* User Info & Assigned Roles */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Zugewiesene Rollen</h3>
                  <div className="flex flex-col gap-1.5">
                    {currentUser?.roles && currentUser.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {sortRoles(currentUser.roles).map(role => (
                          <Badge 
                            key={role} 
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5", 
                              role === currentRole ? roleColors[role] : "bg-muted text-muted-foreground"
                            )}
                          >
                            {ROLE_LABELS[role] || roleLabels[role]}
                            {role === currentRole && " (aktiv)"}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] w-fit px-1.5 py-0 h-5">
                        Keine Rollen
                      </Badge>
                    )}
                    {currentUser && (
                      <p className="text-xs text-muted-foreground">{currentUser.name}</p>
                    )}
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Role Switcher */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Rolle wechseln</h3>
                  <Select value={currentRole} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gastmitglied" className="text-sm">👋 Gastmitglied</SelectItem>
                      <SelectItem value="mitglied" className="text-sm">👤 Mitglied</SelectItem>
                      <SelectItem value="kranfuehrer" className="text-sm">⚓ Kranführer</SelectItem>
                      <SelectItem value="admin" className="text-sm">🔧 Admin</SelectItem>
                      <SelectItem value="vorstand" className="text-sm">🏛️ Vorstand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-2" />

                {/* Admin Functions */}
                {availableHeaderItems.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Verwaltung</h3>
                      <div className="space-y-1">
                        {availableHeaderItems.map(item => {
                          const Icon = item.icon;
                          const isActive = isItemActive(item.id);
                          
                          const handleClick = () => {
                            setIsMenuOpen(false);
                            
                            // Use the same navigation logic with Route Registry
                            if (item.id === 'file-manager') {
                              navigate(ROUTES.protected.fileManager.path);
                            } else if (item.id === 'settings') {
                              navigate(ROUTES.protected.settings.path);
                            } else if (item.id === 'header-message') {
                              navigate(ROUTES.protected.headerMessage.path);
                            } else if (item.id === 'desktop-background') {
                              navigate(ROUTES.protected.desktopBackground.path);
                            } else {
                              navigate('/');
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: item.id } }));
                              }, 100);
                            }
                          };
                          
                          return (
                            <Button 
                              key={item.id} 
                              variant={isActive ? "secondary" : "ghost"} 
                              className="w-full justify-start relative" 
                              onClick={handleClick}
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              <span>{item.label}</span>
                              {item.badge && (
                                <Badge variant="destructive" className="ml-auto h-5 w-5 text-xs p-0 flex items-center justify-center">
                                  {item.badge}
                                </Badge>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <Separator className="my-2" />
                  </>
                )}

                {/* Logout Button */}
                <div className="pt-1">
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2 h-8 text-sm" 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Abmelden
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </nav>
  );
}
