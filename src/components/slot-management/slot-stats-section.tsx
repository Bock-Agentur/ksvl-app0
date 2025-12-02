import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  const StatCard = ({ 
    label, 
    value, 
    colorClass, 
    filter 
  }: { 
    label: string; 
    value: number; 
    colorClass: string;
    filter: FilterStatus;
  }) => (
    <Card 
      className={`card-maritime-hero cursor-pointer transition-colors hover:bg-muted/50 ${
        activeFilter === filter ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onFilterChange(filter)}
    >
      <CardContent className="pt-3 pb-2">
        <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Mobile Collapsible */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="sm:hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between card-maritime-hero hover:bg-white/90 px-6 py-4 h-auto"
          >
            <span className="font-semibold text-sm">Statistiken anzeigen</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="card-maritime-hero">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Gesamt" value={stats.total} colorClass="text-primary" filter="all" />
                <StatCard label="Gebucht" value={stats.booked} colorClass="text-status-booked" filter="booked" />
                <StatCard label="Verfügbar" value={stats.available} colorClass="text-status-available" filter="available" />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-3 gap-2">
        <StatCard label="Gesamt" value={stats.total} colorClass="text-primary" filter="all" />
        <StatCard label="Gebucht" value={stats.booked} colorClass="text-status-booked" filter="booked" />
        <StatCard label="Verfügbar" value={stats.available} colorClass="text-status-available" filter="available" />
      </div>
    </>
  );
}
