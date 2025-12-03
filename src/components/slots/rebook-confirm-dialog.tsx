/**
 * RebookConfirmDialog Component
 * 
 * Confirmation dialog for rebooking (canceling existing booking and booking new slot).
 * Used in SlotFormDialog when user already has a booking.
 */
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Slot } from "@/types";

interface RebookConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSlot: Slot | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RebookConfirmDialog({
  open,
  onOpenChange,
  existingSlot,
  onConfirm,
  onCancel
}: RebookConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bestehenden Termin stornieren?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Sie haben bereits einen Termin gebucht. Sie können nur einen Termin gleichzeitig buchen.
            </p>
            {existingSlot && (
              <Card className="bg-muted">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {format(parseISO(existingSlot.date), "dd. MMMM yyyy", { locale: de })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{existingSlot.time} Uhr ({existingSlot.duration} Min)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    <span>{existingSlot.craneOperator.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="font-medium">
              Möchten Sie Ihren bestehenden Termin stornieren und den neuen Termin buchen?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Nein, abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Ja, umbuchen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
