/**
 * SlotInfoCard Component
 * 
 * Displays slot details in a card format.
 * Used in SlotFormDialog for showing slot information.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Slot } from "@/types";

interface SlotInfoCardProps {
  slot: Slot;
  showTitle?: boolean;
  titleText?: string;
}

export function SlotInfoCard({ slot, showTitle = false, titleText }: SlotInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        {showTitle && titleText && (
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {titleText}
          </CardTitle>
        )}
        {!showTitle && (
          <CardTitle className="flex items-center gap-2">
            <Badge 
              className={cn(
                "text-xs",
                slot.isBooked 
                  ? "bg-status-booked text-status-booked-foreground border-status-booked" 
                  : "bg-status-available text-status-available-foreground border-status-available"
              )}
            >
              {slot.isBooked ? "Gebucht" : "Verfügbar"}
            </Badge>
            {slot.isBooked && slot.bookedBy && (
              <span className="text-sm text-muted-foreground">
                von {slot.bookedBy}
              </span>
            )}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showTitle && (
          <div className="flex items-center gap-2">
            <Badge 
              className="bg-status-booked text-status-booked-foreground border-status-booked"
            >
              Gebucht
            </Badge>
            <span className="text-sm text-muted-foreground">
              von {slot.bookedBy}
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(slot.date), "EEEE, dd. MMMM yyyy", { locale: de })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{slot.time} Uhr ({slot.duration} Min.)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Kranführer: {slot.craneOperator.name}</span>
        </div>
        
        {slot.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Beschreibung:</strong> {slot.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
