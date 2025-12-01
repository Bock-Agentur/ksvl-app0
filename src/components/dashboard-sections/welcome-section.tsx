import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useWelcomeMessages, useProfileData } from "@/hooks";
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
  const { firstName, isLoading } = useProfileData();

  if (isLoading) {
    return (
      <Card className="p-6 bg-white rounded-[2rem] card-shadow-soft border-0">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white rounded-[2rem] card-shadow-soft border-0">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Hallo {firstName || ''}! 👋
          </h2>
          <div className="text-muted-foreground whitespace-pre-line">
            {welcomeMessage}
          </div>
        </div>

        {stats?.nextBooking && (() => {
          const bookingDate = stats.nextBooking.date instanceof Date 
            ? stats.nextBooking.date 
            : new Date(stats.nextBooking.date);
          
          const isValidDate = !isNaN(bookingDate.getTime());
          
          return isValidDate ? (
            <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Nächster Termin:</span>
                <Badge variant="secondary">
                  {format(bookingDate, "EEEE, dd.MM.yyyy", { locale: de })}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>{stats.nextBooking.slot}</span>
              </div>
            </div>
          ) : null;
        })()}
      </div>
    </Card>
  );
}
