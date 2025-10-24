import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useWelcomeMessages } from "@/hooks/use-welcome-messages";
import { UserRole } from "@/types/user";

interface WelcomeSectionProps {
  stats?: {
    nextBooking?: {
      date: Date;
      slot: string;
    };
  };
  currentUser?: any;
  currentRole?: UserRole;
}

export function WelcomeSection({ stats, currentUser, currentRole }: WelcomeSectionProps) {
  const { getWelcomeMessage } = useWelcomeMessages();
  const welcomeMessage = currentRole ? getWelcomeMessage(currentRole) : "";

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-background border-primary/20 md:rounded-[2rem]">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Hallo {currentUser?.user_metadata?.full_name || currentUser?.email}! 👋
          </h2>
          <div className="text-muted-foreground whitespace-pre-line">
            {welcomeMessage}
          </div>
        </div>

        {stats?.nextBooking && (
          <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Nächster Termin:</span>
              <Badge variant="secondary">
                {format(stats.nextBooking.date, "EEEE, dd.MM.yyyy", { locale: de })}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>{stats.nextBooking.slot}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
