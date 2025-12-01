import { useNavigate, useLocation } from "react-router-dom";
import { Home, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { useMenuSettings } from "@/hooks/use-menu-settings";
import { useRole } from "@/hooks/use-role";
import * as LucideIcons from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { UserRole } from "@/types";
import { ROUTES } from "@/lib/registry/routes";
import { FOOTER_ICON_MAP, handleFooterLogout } from "@/lib/footer-utils";
import { FooterDrawerContent } from "@/components/common/footer-drawer-content";

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
    icon: FOOTER_ICON_MAP[item.icon as keyof typeof FOOTER_ICON_MAP] || FOOTER_ICON_MAP.Settings,
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

  const handleLogout = () => handleFooterLogout(navigate);

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
              <FooterDrawerContent
                currentRole={currentRole}
                currentUser={currentUser}
                availableHeaderItems={availableHeaderItems}
                onRoleChange={setRole}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                isItemActive={isItemActive}
                onClose={() => setIsMenuOpen(false)}
              />
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </nav>
  );
}
