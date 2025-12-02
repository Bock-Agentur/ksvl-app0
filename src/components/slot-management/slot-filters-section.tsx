import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SlotFiltersSectionProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedCraneOperator: string;
  onCraneOperatorChange: (operatorId: string) => void;
  craneOperators: Array<{ id: string; name: string }>;
}

export function SlotFiltersSection({
  selectedDate,
  onDateChange,
  selectedCraneOperator,
  onCraneOperatorChange,
  craneOperators,
}: SlotFiltersSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const FiltersContent = () => (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal flex-1 sm:flex-initial min-w-[200px]",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            {selectedDate ? format(selectedDate, "dd. MMMM yyyy", { locale: de }) : "Datum wählen"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <UICalendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Date Filter */}
      {selectedDate && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(undefined)}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Crane Operator Filter */}
      <Select value={selectedCraneOperator} onValueChange={onCraneOperatorChange}>
        <SelectTrigger className="flex-1 sm:flex-initial min-w-[200px]">
          <SelectValue placeholder="Kranführer filtern" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Kranführer</SelectItem>
          {craneOperators.map((operator) => (
            <SelectItem key={operator.id} value={operator.id}>
              {operator.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Operator Filter */}
      {selectedCraneOperator && selectedCraneOperator !== "all" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCraneOperatorChange("all")}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
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
            <span className="font-semibold text-sm">Filter & Suche</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="card-maritime-hero">
            <CardContent className="p-4">
              <FiltersContent />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop Card */}
      <Card className="hidden sm:block card-maritime-hero">
        <CardContent className="p-4">
          <FiltersContent />
        </CardContent>
      </Card>
    </>
  );
}
