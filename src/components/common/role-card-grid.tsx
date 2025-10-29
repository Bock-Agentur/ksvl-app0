import { Card, CardContent } from "@/components/ui/card";
import { UserRole } from "@/types/user";
import { UserCircle, Shield, Wrench, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface RoleCardGridProps {
  activeRole?: UserRole | null;
  onRoleSelect?: (role: UserRole) => void;
  className?: string;
}

const ROLE_ORDER: UserRole[] = ["admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"];

const ROLE_ICONS = {
  gastmitglied: User,
  mitglied: UserCircle,
  kranfuehrer: Wrench,
  admin: Shield,
  vorstand: Users,
} as const;

const ROLE_LABELS: Record<UserRole, { full: string; mobile: string }> = {
  gastmitglied: { full: "Gastmitglied", mobile: "Gast" },
  mitglied: { full: "Mitglied", mobile: "Mitglied" },
  kranfuehrer: { full: "Kranführer", mobile: "Kranführer" },
  admin: { full: "Admin", mobile: "Admin" },
  vorstand: { full: "Vorstand", mobile: "Vorstand" },
};

export function RoleCardGrid({ activeRole, onRoleSelect, className }: RoleCardGridProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "gap-2 flex-wrap",
        isMobile ? "grid grid-cols-5" : "flex justify-center sm:justify-start",
        className
      )}
    >
      {ROLE_ORDER.map((role) => {
        const Icon = ROLE_ICONS[role];
        const roleLabel = isMobile ? ROLE_LABELS[role].mobile : ROLE_LABELS[role].full;
        const isActive = activeRole === role;

        return (
          <Card
            key={role}
            className={cn(
              "cursor-pointer transition-colors hover:bg-muted/50",
              isMobile ? "" : "w-20 sm:w-24",
              isActive ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-sm",
              onRoleSelect && "cursor-pointer"
            )}
            onClick={() => onRoleSelect?.(role)}
          >
            <CardContent
              className={cn(
                "text-center",
                isMobile ? "p-1.5" : "p-3"
              )}
            >
              <Icon
                className={cn(
                  "mx-auto mb-1",
                  isMobile ? "h-4 w-4" : "h-6 w-6"
                )}
              />
              <p
                className={cn(
                  "font-medium leading-tight",
                  isMobile ? "text-[9px]" : "text-xs"
                )}
              >
                {roleLabel}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { ROLE_ORDER, ROLE_ICONS, ROLE_LABELS };
