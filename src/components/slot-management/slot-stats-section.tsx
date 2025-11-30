import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { FilterStatus } from "./use-slot-filters";

interface SlotStatsSectionProps {
  stats: {
    total: number;
    booked: number;
    available: number;
  };
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SlotStatsSection({
  stats,
  activeFilter,
  onFilterChange,
  isOpen,
  onOpenChange,
}: SlotStatsSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Statistiken
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        <div className="grid grid-cols-3 gap-3">
          <Card
            className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${
              activeFilter === "all" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onFilterChange("all")}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Gesamt Slots</p>
                  <p className="text-lg font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${
              activeFilter === "booked" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onFilterChange("booked")}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Gebucht</p>
                  <p className="text-lg font-bold text-status-booked">{stats.booked}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${
              activeFilter === "available" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onFilterChange("available")}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Verfügbar</p>
                  <p className="text-lg font-bold text-status-available">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
