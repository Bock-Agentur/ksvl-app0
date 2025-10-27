import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface ActivityFeedSectionProps {
  stats?: {
    recentActivity?: Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      member?: string;
      priority?: "low" | "medium" | "high" | "critical";
    }>;
  };
}

export function ActivityFeedSection({ stats }: ActivityFeedSectionProps) {
  if (!stats?.recentActivity || stats.recentActivity.length === 0) return null;

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg">Live-Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => {
              const userName = activity.member || 'Unbekannt';
              const userInitials = userName.substring(0, 2).toUpperCase();
              
              return (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{userName}</span>{" "}
                    <span className="text-muted-foreground">{activity.message}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {activity.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
