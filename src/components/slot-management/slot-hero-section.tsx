import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SlotHeroSectionProps {
  onAddSlot: () => void;
}

export function SlotHeroSection({ onAddSlot }: SlotHeroSectionProps) {
  return (
    <Card className="card-maritime-hero">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Slot-Verwaltung</h1>
          <Button onClick={onAddSlot} className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-auto">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Slot erstellen</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
