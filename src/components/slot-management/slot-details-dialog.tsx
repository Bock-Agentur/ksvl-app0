import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Mail, Phone, UserCheck, Hash, FileText } from "lucide-react";
import { Slot } from "@/types";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface SlotDetailsDialogProps {
  slot: Slot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SlotDetailsDialog({ slot, open, onOpenChange }: SlotDetailsDialogProps) {
  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Slot-Details
            <Badge variant={slot.isBooked ? "default" : "secondary"}>
              {slot.isBooked ? "Gebucht" : "Verfügbar"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Grundinformationen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Datum</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(slot.date), "EEEE, dd. MMMM yyyy", { locale: de })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Zeit & Dauer</p>
                  <p className="text-sm text-muted-foreground">
                    {slot.time} Uhr • {slot.duration} Minuten
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Crane Operator Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Kranführer</h3>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{slot.craneOperator.name}</p>
                {slot.craneOperator.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {slot.craneOperator.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Information */}
          {slot.isBooked && slot.member && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Buchungsinformationen</h3>
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{slot.member.name}</p>
                      <div className="mt-2 space-y-1">
                        {slot.member.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {slot.member.email}
                          </div>
                        )}
                        {slot.member.memberNumber && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Hash className="w-4 h-4" />
                            Mitgliedsnr.: {slot.member.memberNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {slot.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notizen
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{slot.notes}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
