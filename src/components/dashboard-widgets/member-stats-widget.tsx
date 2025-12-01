import { Users, TrendingUp, UserPlus, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/hooks";
import { useMemo } from "react";

export function MemberStatsWidget() {
  const { users, loading } = useUsers();

  const stats = useMemo(() => {
    if (loading) {
      return {
        totalMembers: 0,
        activeThisMonth: 0,
        newThisMonth: 0,
        upcomingRenewals: 0,
        trend: 0
      };
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Active members
    const activeMembers = users.filter(u => u.status === 'active');
    
    // New members this month (based on created_at)
    const newThisMonth = users.filter(u => {
      if (!u.created_at) return false;
      const createdDate = new Date(u.created_at);
      return createdDate.getMonth() === thisMonth && 
             createdDate.getFullYear() === thisYear;
    }).length;

    // Calculate trend (simple: compare new members this month vs last month)
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const newLastMonth = users.filter(u => {
      if (!u.created_at) return false;
      const createdDate = new Date(u.created_at);
      return createdDate.getMonth() === lastMonth && 
             createdDate.getFullYear() === lastMonthYear;
    }).length;

    const trend = newLastMonth > 0 
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
      : newThisMonth > 0 ? 100 : 0;

    return {
      totalMembers: users.length,
      activeThisMonth: activeMembers.length,
      newThisMonth,
      upcomingRenewals: 0, // This would need a renewal_date field
      trend
    };
  }, [users, loading]);

  const activityRate = stats.totalMembers > 0 
    ? Math.round((stats.activeThisMonth / stats.totalMembers) * 100)
    : 0;

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
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
              {stats.trend !== 0 && (
                <>
                  <TrendingUp className={`h-3 w-3 ${stats.trend > 0 ? 'text-success' : 'text-destructive rotate-180'}`} />
                  <span className={`text-xs ${stats.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                    {stats.trend > 0 ? '+' : ''}{stats.trend}%
                  </span>
                </>
              )}
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