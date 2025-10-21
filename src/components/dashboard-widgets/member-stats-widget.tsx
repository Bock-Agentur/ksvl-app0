import { Users, TrendingUp, UserPlus, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MemberStats {
  totalMembers: number;
  activeThisMonth: number;
  newThisMonth: number;
  upcomingRenewals: number;
  trend: number; // percentage change
}

export function MemberStatsWidget() {
  const stats: MemberStats = {
    totalMembers: 0,
    activeThisMonth: 0,
    newThisMonth: 0,
    upcomingRenewals: 0,
    trend: 0
  };

  const activityRate = Math.round((stats.activeThisMonth / stats.totalMembers) * 100);

  return (
    <Card className="shadow-card-maritime">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Mitglieder-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="text-2xl font-bold text-primary">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/5">
            <div className="text-2xl font-bold text-success">{activityRate}%</div>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-success" />
              <span>Neue Mitglieder</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{stats.newThisMonth}</span>
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success text-xs">+{stats.trend}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-warning" />
              <span>Verlängerungen fällig</span>
            </div>
            <span className="font-medium text-warning">{stats.upcomingRenewals}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Aktiv diesen Monat</span>
            </div>
            <span className="font-medium">{stats.activeThisMonth}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}