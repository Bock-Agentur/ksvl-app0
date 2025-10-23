import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface ActivityFeedSectionProps {
  stats?: {
    recentActivity?: Array<{
      type: string;
      user: string;
      action: string;
      time: Date;
    }>;
  };
}

export function ActivityFeedSection({ stats }: ActivityFeedSectionProps) {
  if (!stats?.recentActivity || stats.recentActivity.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Live-Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10">
                  {activity.user.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.time, { addSuffix: true, locale: de })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
