import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { UserRole } from "@/types";
import * as LucideIcons from "lucide-react";
import { ROUTES } from "@/lib/registry/routes";
import { useMenuSettings } from "@/hooks/use-menu-settings";
import { FOOTER_ICON_MAP, handleFooterLogout } from "@/lib/footer-utils";
import { FooterDrawerContent } from "@/components/common/footer-drawer-content";
import { useRole } from "@/hooks/use-role";

interface UnifiedFooterProps {
  currentRole?: UserRole;
  currentUser?: any;
  onRoleChange?: (role: UserRole) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  hasAnimated?: boolean;
}

export function UnifiedFooter({
  currentRole: propsRole,
  currentUser: propsUser,
  onRoleChange: propsOnRoleChange,
  activeTab,
  onTabChange,
  hasAnimated = false
}: UnifiedFooterProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isReady, setIsReady] = useState(hasAnimated);
  
  // Use hook as fallback when props not provided
  const { currentRole: hookRole, currentUser: hookUser, setRole: hookSetRole } = useRole();
  
  // Props have priority, otherwise use hook values
  const currentRole = propsRole ?? hookRole;
  const currentUser = propsUser ?? hookUser;
  const onRoleChange = propsOnRoleChange ?? hookSetRole;
  
  const { getMenuItemsForRole, getDisplaySettingsForRole, isLoading: footerLoading } = useFooterMenuSettings(currentRole);
  const { getOrderedHeaderItems } = useMenuSettings();
  
  const footerItems = getMenuItemsForRole(currentRole);
  const currentDisplaySettings = getDisplaySettingsForRole(currentRole);
  const showLabels = currentDisplaySettings?.showLabels ?? false;

  // Get dynamic header navigation items
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

  // Trigger animation ONLY if not already animated
  useEffect(() => {
    if (!hasAnimated && !footerLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasAnimated, footerLoading]);

  const handleLogout = () => handleFooterLogout(navigate);

  const isItemActive = (itemId: string) => {
    const currentPath = location.pathname;
    
    // Check route-based items
    if (itemId === 'file-manager') return currentPath === ROUTES.protected.fileManager.path;
    if (itemId === 'reports') return currentPath === ROUTES.protected.reports.path;
    if (itemId === 'settings') return currentPath === ROUTES.protected.settings.path;
    
    // For dashboard items, check active tab
    if (currentPath === '/' && activeTab) {
      return activeTab === itemId;
    }
    
    return false;
  };

  const handleNavigate = (itemId: string) => {
    const currentPath = location.pathname;
    
    // Navigate to route-based items
    if (itemId === 'file-manager') {
      navigate(ROUTES.protected.fileManager.path);
      return;
    }
    if (itemId === 'reports') {
      navigate(ROUTES.protected.reports.path);
      return;
    }
    if (itemId === 'settings') {
      navigate(ROUTES.protected.settings.path);
      return;
    }
    
    // For tab-based items: use URL parameter for immediate navigation
    if (currentPath !== '/') {
      navigate(`/?tab=${itemId}`);
    } else if (onTabChange) {
      onTabChange(itemId);
    }
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
              key={`${item.id}-${index}-${forceUpdate}`}
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
                onRoleChange={onRoleChange}
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
