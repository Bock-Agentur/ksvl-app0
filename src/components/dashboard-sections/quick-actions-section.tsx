import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface QuickActionsSectionProps {
  stats?: {
    quickActions?: Array<{
      label: string;
      icon: LucideIcon;
      onClick: () => void;
    }>;
  };
  onNavigate?: (tab: string) => void;
}

export function QuickActionsSection({ stats, onNavigate }: QuickActionsSectionProps) {
  if (!stats?.quickActions || stats.quickActions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schnellzugriff</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
