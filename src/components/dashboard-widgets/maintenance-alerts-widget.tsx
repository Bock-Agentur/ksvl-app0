import { Wrench, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MaintenanceItem {
  id: string;
  equipment: string;
  type: "routine" | "repair" | "inspection";
  priority: "low" | "medium" | "high" | "critical";
  dueDate: string;
  description: string;
  status: "pending" | "scheduled" | "completed";
}

export function MaintenanceAlertsWidget() {
  const maintenanceItems: MaintenanceItem[] = [
    {
      id: "1",
      equipment: "Kran A",
      type: "inspection",
      priority: "high",
      dueDate: "in 2 Tagen",
      description: "Jährliche Sicherheitsprüfung",
      status: "pending"
    },
    {
      id: "2",
      equipment: "Boot-Trailer", 
      type: "routine",
      priority: "medium",
      dueDate: "nächste Woche",
      description: "Ölwechsel und Wartung",
      status: "scheduled"
    },
    {
      id: "3",
      equipment: "Kran C",
      type: "repair", 
      priority: "critical",
      dueDate: "überfällig",
      description: "Hydraulik-Leck beheben",
      status: "pending"
    }
  ];

  const getPriorityBadge = (priority: MaintenanceItem["priority"]) => {
    const variants = {
      low: "outline",
      medium: "secondary", 
      high: "default",
      critical: "destructive"
    } as const;
    
    const labels = {
      low: "Niedrig",
      medium: "Mittel",
      high: "Hoch", 
      critical: "Kritisch"
    };

    return (
      <Badge variant={variants[priority]} className="text-xs">
        {labels[priority]}
      </Badge>
    );
  };

  const getTypeIcon = (type: MaintenanceItem["type"]) => {
    switch (type) {
      case "inspection":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "repair":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const criticalCount = maintenanceItems.filter(item => item.priority === "critical").length;
  const pendingCount = maintenanceItems.filter(item => item.status === "pending").length;

  return (
    <Card className="shadow-card-maritime">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Wartung & Service
          </div>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {criticalCount} kritisch
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{pendingCount} ausstehend</p>
            <p className="text-sm text-muted-foreground">von {maintenanceItems.length} Elementen</p>
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1" />
            Planen
          </Button>
        </div>

        <div className="space-y-2">
          {maintenanceItems.slice(0, 3).map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <div>
                    <p className="font-medium text-sm">{item.equipment}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {getPriorityBadge(item.priority)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Fällig: {item.dueDate}</span>
                <Badge variant="outline" className="text-xs">
                  {item.status === "pending" ? "Ausstehend" : 
                   item.status === "scheduled" ? "Geplant" : "Erledigt"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {maintenanceItems.length > 3 && (
          <Button variant="ghost" className="w-full text-sm">
            Alle {maintenanceItems.length} Elemente anzeigen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}