import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFooterMenuSettings, useRole } from "@/hooks";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { UserRole } from "@/types";
import * as LucideIcons from "lucide-react";
import { handleFooterLogout } from "@/lib/footer-utils";
import { FooterDrawerContent } from "@/components/common/footer-drawer-content";
import { getNavItemsForRole, isNavItemActive, getNavItemPath, NAV_ITEMS } from "@/lib/registry/navigation";

interface UnifiedFooterProps {
  currentRole?: UserRole;
  currentUser?: any;
  onRoleChange?: (role: UserRole) => void;
}

export function UnifiedFooter({
  currentRole: propsRole,
  currentUser: propsUser,
  onRoleChange: propsOnRoleChange,
}: UnifiedFooterProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Use hook as fallback when props not provided
  const { currentRole: hookRole, currentUser: hookUser, setRole: hookSetRole } = useRole();
  
  // Props have priority, otherwise use hook values
  const currentRole = propsRole ?? hookRole;
  const currentUser = propsUser ?? hookUser;
  const onRoleChange = propsOnRoleChange ?? hookSetRole;
  
  const { getDisplaySettingsForRole, getMenuItemsForRole, isLoading: footerLoading, refetch: refetchFooterSettings } = useFooterMenuSettings(currentRole);
  
  // Use user-configured menu items (merge custom order with NAV_ITEMS structure)
  const customFooterItems = getMenuItemsForRole(currentRole);
  const footerItems = customFooterItems.length > 0 
    ? customFooterItems.map(customItem => {
        // Find matching NavItem to preserve routeId
        const navItem = NAV_ITEMS.find(n => n.id === customItem.id);
        return navItem || customItem;
      })
    : getNavItemsForRole(currentRole, 'bottom');
  
  // Use NAV_ITEMS for drawer
  const drawerItems = getNavItemsForRole(currentRole, 'drawer');
  
  const currentDisplaySettings = getDisplaySettingsForRole(currentRole);
  const showLabels = currentDisplaySettings?.showLabels ?? false;

  // Listen for footer and menu settings changes
  useEffect(() => {
    const handleSettingsChange = async () => {
      await refetchFooterSettings();
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('footerSettingsChanged', handleSettingsChange);
    window.addEventListener('menuSettingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('footerSettingsChanged', handleSettingsChange);
      window.removeEventListener('menuSettingsChanged', handleSettingsChange);
    };
  }, [refetchFooterSettings]);

  const handleLogout = () => handleFooterLogout(navigate);

  // Check if nav item is active based on current route
  const checkIsActive = (itemId: string) => {
    const item = NAV_ITEMS.find(i => i.id === itemId);
    return item ? isNavItemActive(item, location.pathname) : false;
  };

  // Navigate to route
  const handleNavigate = (itemId: string) => {
    const item = NAV_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    
    const path = getNavItemPath(item);
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 pb-safe-bottom shadow-elevated-maritime z-50">
      <div className="flex justify-evenly items-center max-w-md mx-auto">
        {footerItems.map((item, index) => {
          const IconComponent = (LucideIcons as any)[item.icon] || Home;
          const isActive = checkIsActive(item.id);
          
          return (
            <Button
              key={`${item.id}-${index}-${forceUpdate}`}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "flex flex-col items-center h-auto py-2 px-1 sm:px-3 relative transition-colors min-w-0",
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

        {/* Burger Menu - Always visible for admin/vorstand (check actual roles, not selected role) */}
        {(currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('vorstand')) && (
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
                drawerItems={drawerItems}
                onRoleChange={onRoleChange}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                isItemActive={checkIsActive}
                onClose={() => setIsMenuOpen(false)}
              />
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </nav>
  );
}
