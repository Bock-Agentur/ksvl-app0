import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { sortRoles, ROLE_LABELS } from "@/lib/role-order";
import { ROLE_COLORS } from "@/lib/footer-utils";
import { NavItem } from "@/lib/registry/navigation";
import * as LucideIcons from "lucide-react";

interface FooterDrawerContentProps {
  currentRole: UserRole;
  currentUser: any;
  drawerItems: NavItem[];
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  onNavigate: (itemId: string) => void;
  isItemActive: (itemId: string) => boolean;
  onClose: () => void;
}

export function FooterDrawerContent({
  currentRole,
  currentUser,
  drawerItems,
  onRoleChange,
  onLogout,
  onNavigate,
  isItemActive,
  onClose
}: FooterDrawerContentProps) {
  return (
    <>
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
                {sortRoles(currentUser.roles).map((role: UserRole) => (
                  <Badge 
                    key={role} 
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5", 
                      role === currentRole ? ROLE_COLORS[role] : "bg-muted text-muted-foreground"
                    )}
                  >
                    {ROLE_LABELS[role]}
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
          <Select value={currentRole} onValueChange={(value: UserRole) => onRoleChange(value)}>
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
        {drawerItems.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Verwaltung</h3>
              <div className="space-y-1">
                {drawerItems.map(item => {
                  const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.Home;
                  const isActive = isItemActive(item.id);
                  
                  const handleClick = () => {
                    onClose();
                    onNavigate(item.id);
                  };
                  
                  return (
                    <Button 
                      key={item.id} 
                      variant={isActive ? "secondary" : "ghost"} 
                      className="w-full justify-start relative" 
                      onClick={handleClick}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
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
              onLogout();
              onClose();
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </Button>
        </div>
      </div>
    </>
  );
}
