import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "training" | "meeting" | "social" | "maintenance" | "regatta";
  participants: number;
  maxParticipants?: number;
  status: "upcoming" | "ongoing" | "completed";
}

export function EventsCalendarWidget() {
  const events: Event[] = [];

  const getEventIcon = (type: Event["type"]) => {
    switch (type) {
      case "training":
        return <Users className="h-4 w-4 text-primary" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-secondary-foreground" />;
      case "regatta":
        return <MapPin className="h-4 w-4 text-accent-foreground" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventTypeLabel = (type: Event["type"]) => {
    const labels = {
      training: "Schulung",
      meeting: "Versammlung", 
      social: "Event",
      maintenance: "Wartung",
      regatta: "Regatta"
    };
    return labels[type];
  };

  const getEventBadgeVariant = (type: Event["type"]) => {
    switch (type) {
      case "training": return "default";
      case "meeting": return "secondary";
      case "regatta": return "outline";
      default: return "outline";
    }
  };

  const upcomingEvents = events.filter(e => e.status === "upcoming").length;

  return (
    <Card className="shadow-card-maritime">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Termine & Events
          </div>
          <Badge variant="outline" className="text-xs">
            {upcomingEvents} anstehend
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {getEventIcon(event.type)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {event.date} • {event.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  </div>
                </div>
                <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                  {getEventTypeLabel(event.type)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>
                    {event.participants}
                    {event.maxParticipants && ` / ${event.maxParticipants}`} Teilnehmer
                  </span>
                </div>
                {event.maxParticipants && event.participants < event.maxParticipants && (
                  <Badge variant="success" className="text-xs">
                    Plätze frei
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-1" />
            Alle Termine
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Event erstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}