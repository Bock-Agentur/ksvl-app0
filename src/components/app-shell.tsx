import { useState, useEffect } from "react";
import { Calendar, Home, MessageSquare, Settings, User, Users, UserCheck, Menu, X, FileText, TestTube, Palette, Layers, LogOut, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { useLoginBackground } from "@/hooks/use-login-background";
import { useDesktopBackground } from "@/hooks/use-desktop-background";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { UserRole, NavItem, AppShellProps } from "@/types";
import * as LucideIcons from "lucide-react";

// Mobile navigation items (bottom nav)
const mobileNavItems: NavItem[] = [{
  id: "dashboard",
  label: "Dashboard",
  icon: Home,
  roles: ["mitglied", "kranfuehrer", "admin"]
}, {
  id: "calendar",
  label: "Kalender",
  icon: Calendar,
  roles: ["mitglied", "kranfuehrer", "admin"]
}, {
  id: "bookings",
  label: "Buchungen",
  icon: UserCheck,
  roles: ["mitglied", "kranfuehrer", "admin"]
}, {
  id: "profile",
  label: "Profil",
  icon: User,
  roles: ["mitglied", "kranfuehrer", "admin"]
}];
import { useMenuSettings } from "@/hooks/use-menu-settings";

// Icon mapping for dynamic menu items
const iconMap = {
  Palette,
  TestTube,
  Users,
  Calendar,
  FileText,
  Settings,
  Layers
};

// AppShellProps is now imported from @/types

export function AppShell({
  currentRole,
  currentUser,
  onRoleChange,
  activeTab,
  onTabChange,
  children
}: AppShellProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const {
    getMenuItemsForRole,
    getDisplaySettingsForRole
  } = useFooterMenuSettings();
  const {
    getOrderedHeaderItems
  } = useMenuSettings();
  const {
    background
  } = useLoginBackground();
  const {
    settings: desktopBackgroundSettings
  } = useDesktopBackground();
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

  // Get custom footer menu items for current role - always fresh data
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
  const roleLabels: Record<UserRole, string> = {
    gastmitglied: "Gastmitglied",
    mitglied: "Mitglied",
    kranfuehrer: "Kranführer",
    admin: "Administrator",
    vorstand: "Vorstand"
  };
  const roleColors: Record<UserRole, string> = {
    gastmitglied: "bg-muted text-muted-foreground",
    mitglied: "bg-accent text-accent-foreground",
    kranfuehrer: "bg-gradient-ocean text-primary-foreground",
    admin: "bg-gradient-deep text-primary-foreground",
    vorstand: "bg-gradient-deep text-primary-foreground"
  };
  const renderBackground = () => {
    // Only show background if enabled in settings
    if (!desktopBackgroundSettings.enabled) {
      return null;
    }
    if (background.type === 'gradient') {
      return null;
    }
    if (background.type === 'video' && background.url) {
      return <video className="fixed inset-0 w-full h-full object-cover -z-20" autoPlay muted loop playsInline style={{
        filter: `blur(${background.mediaBlur}px)`
      }}>
          <source src={background.url} type="video/mp4" />
        </video>;
    }
    if (background.type === 'image' && background.url) {
      return <div className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-20" style={{
        backgroundImage: `url(${background.url})`,
        filter: `blur(${background.mediaBlur}px)`
      }} />;
    }
    return null;
  };
  return <>
      {/* Background Layer */}
      {renderBackground()}
      
      {/* Overlay Layer */}
      {desktopBackgroundSettings.enabled && background.type !== 'gradient' && background.url && <div className="fixed inset-0 -z-10" style={{
      backgroundColor: `${background.overlayColor}${Math.round(background.overlayOpacity / 100 * 255).toString(16).padStart(2, '0')}`
    }} />}

      <div className={`min-h-screen flex flex-col relative z-0 ${!desktopBackgroundSettings.enabled ? 'bg-background' : ''}`}>
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 pt-0 mx-0 px-0 py-0">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 shadow-elevated-maritime z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex gap-1">
            {footerItems.map((item, index) => {
              // Dynamic icon loading from lucide-react
              const IconComponent = LucideIcons[item.icon as keyof typeof LucideIcons] as React.ComponentType<{
                className?: string;
              }>;
              const Icon = IconComponent || Home; // Fallback to Home icon
              const isActive = activeTab === item.id;
              return <Button key={`${item.id}-${index}-${forceUpdate}`} // Force re-render with key
              variant="ghost" size="sm" onClick={() => onTabChange(item.id)} className={cn("flex flex-col items-center h-auto py-2 px-1 sm:px-3 relative transition-wave min-w-0", showLabels ? "gap-1" : "gap-0", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {showLabels && <span className="text-xs font-medium truncate max-w-16">{item.label}</span>}
                  {item.badge && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center">
                      {item.badge}
                    </Badge>}
                </Button>;
            })}
          </div>

          {/* Burger Menu (only for admin/vorstand) */}
          {(currentRole === "admin" || currentRole === "vorstand") && (
            <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Menu className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                  <DrawerTitle>Menü</DrawerTitle>
                </DrawerHeader>
                
                <div className="overflow-y-auto px-4 pb-6 space-y-6">
                  {/* User Info & Assigned Roles */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Zugewiesene Rollen</h3>
                    <div className="flex flex-col gap-2">
                      {currentUser?.roles && currentUser.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {currentUser.roles.map(role => (
                            <Badge 
                              key={role} 
                              className={cn(
                                "text-xs", 
                                role === currentRole ? roleColors[role] : "bg-muted text-muted-foreground"
                              )}
                            >
                              {roleLabels[role]}
                              {role === currentRole && " (aktiv)"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs w-fit">
                          Keine Rollen
                        </Badge>
                      )}
                      {currentUser && (
                        <p className="text-sm text-muted-foreground">{currentUser.name}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Role Switcher */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Rolle wechseln</h3>
                    <Select value={currentRole} onValueChange={(value: UserRole) => onRoleChange(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gastmitglied">👋 Gastmitglied</SelectItem>
                        <SelectItem value="mitglied">👤 Mitglied</SelectItem>
                        <SelectItem value="kranfuehrer">⚓ Kranführer</SelectItem>
                        <SelectItem value="admin">🔧 Administrator</SelectItem>
                        <SelectItem value="vorstand">🏛️ Vorstand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin Functions */}
                  {availableHeaderItems.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Verwaltung</h3>
                        <div className="space-y-1">
                          {availableHeaderItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <Button 
                                key={item.id} 
                                variant={isActive ? "secondary" : "ghost"} 
                                className="w-full justify-start relative" 
                                onClick={() => {
                                  onTabChange(item.id);
                                  setIsMenuOpen(false);
                                }}
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
                    </>
                  )}

                  <Separator />

                  {/* Logout Button */}
                  <div className="pt-2">
                    <Button 
                      variant="destructive" 
                      className="w-full gap-2" 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Abmelden
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </nav>
      </div>
    </>;
}