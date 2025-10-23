import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Users, Clock } from "lucide-react";

interface StatsGridSectionProps {
  stats?: {
    todayBookings: number;
    weeklyBookings: number;
    availableSlots: number;
    utilization: number;
    totalUsers?: number;
  };
}

export function StatsGridSection({ stats }: StatsGridSectionProps) {
  if (!stats) return null;

  const statCards = [
    {
      title: "Heutige Buchungen",
      value: stats.todayBookings,
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      title: "Wöchentliche Buchungen",
      value: stats.weeklyBookings,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Verfügbare Slots",
      value: stats.availableSlots,
      icon: Clock,
      color: "text-purple-500",
    },
    {
      title: "Auslastung",
      value: `${stats.utilization}%`,
      icon: Users,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
