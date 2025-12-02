import { useState } from "react";
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
}

export function SlotStatsSection({
  stats,
  activeFilter,
  onFilterChange,
}: SlotStatsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const StatsGrid = () => (
    <div className="grid grid-cols-3 gap-3">
      <Card
        className={`border bg-card cursor-pointer transition-colors hover:bg-muted/50 ${
          activeFilter === "all" ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => onFilterChange("all")}
      >
        <CardContent className="p-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Gesamt</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
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
          <div>
            <p className="text-xs font-medium text-muted-foreground">Gebucht</p>
            <p className="text-lg font-bold text-status-booked">{stats.booked}</p>
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
          <div>
            <p className="text-xs font-medium text-muted-foreground">Verfügbar</p>
            <p className="text-lg font-bold text-status-available">{stats.available}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Mobile: Collapsible Card */}
      <Card className="sm:hidden card-maritime-hero">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <span className="flex items-center gap-2 font-semibold">
                <CalendarDays className="w-4 h-4" />
                Statistiken
              </span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <StatsGrid />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Desktop: Always visible Card */}
      <Card className="hidden sm:block card-maritime-hero">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4" />
            <span className="font-semibold">Statistiken</span>
          </div>
          <StatsGrid />
        </CardContent>
      </Card>
    </>
  );
}
