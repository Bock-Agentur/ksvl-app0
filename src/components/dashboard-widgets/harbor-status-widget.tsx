import { useState } from "react";
import { Anchor, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CraneStatus {
  id: string;
  name: string;
  status: "available" | "occupied" | "maintenance" | "offline";
  currentJob?: string;
  nextAvailable?: string;
  queueLength: number;
}

export function HarborStatusWidget() {
  const [cranes] = useState<CraneStatus[]>([]);

  const getStatusIcon = (status: CraneStatus["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "occupied":
        return <Clock className="h-4 w-4 text-warning" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: CraneStatus["status"]) => {
    switch (status) {
      case "available": return "Verfügbar";
      case "occupied": return "Belegt";
      case "maintenance": return "Wartung";
      default: return "Offline";
    }
  };

  const availableCranes = cranes.filter(c => c.status === "available").length;
  const totalCranes = cranes.length;
  const utilizationPercent = Math.round(((totalCranes - availableCranes) / totalCranes) * 100);

  return (
    <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Anchor className="h-5 w-5 text-primary" />
          Hafenstatus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{availableCranes}/{totalCranes} Kräne frei</p>
            <p className="text-sm text-muted-foreground">Auslastung {utilizationPercent}%</p>
          </div>
          <Progress value={utilizationPercent} className="w-16 h-2" />
        </div>

        <div className="space-y-2">
          {cranes.map((crane) => (
            <div key={crane.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {getStatusIcon(crane.status)}
                <span className="font-medium text-sm">{crane.name}</span>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs">
                  {getStatusText(crane.status)}
                </Badge>
                {crane.queueLength > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {crane.queueLength} wartend
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}