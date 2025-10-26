import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFooterMenuSettings } from "@/hooks/use-footer-menu-settings";
import { useRole } from "@/hooks/use-role";
import * as LucideIcons from "lucide-react";
import { useState, useEffect } from "react";

export function SettingsFooter() {
  const navigate = useNavigate();
  const { currentRole, isLoading: roleLoading } = useRole();
  const { getMenuItemsForRole, getDisplaySettingsForRole, isLoading: footerLoading } = useFooterMenuSettings();
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const footerItems = getMenuItemsForRole(currentRole);
  const currentDisplaySettings = getDisplaySettingsForRole(currentRole);
  const showLabels = currentDisplaySettings?.showLabels ?? false;

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (isInitialized && !footerLoading && !roleLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, footerLoading, roleLoading]);

  const handleNavigate = (id: string) => {
    navigate('/');
    // Give navigation time to complete
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: id } }));
    }, 100);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-50",
      "transform will-change-transform",
      isReady 
        ? "translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        : "translate-y-full"
    )}>
      <div className="flex justify-around items-center h-16 px-2">
        {footerItems.map(item => {
          const IconComponent = (LucideIcons as any)[item.icon] || ArrowLeft;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1",
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <IconComponent className="h-5 w-5" />
              {showLabels && (
                <span className="text-xs font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
