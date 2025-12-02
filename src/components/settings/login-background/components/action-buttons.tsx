/**
 * ActionButtons Component
 * 
 * Save and reset buttons for login background settings.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActionButtonsProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function ActionButtons({ hasUnsavedChanges, onSave, onReset }: ActionButtonsProps) {
  return (
    <div className="pt-4 border-t space-y-3">
      <Button 
        onClick={onSave} 
        className="w-full relative"
        size="lg"
        disabled={!hasUnsavedChanges}
      >
        Einstellungen speichern
        {hasUnsavedChanges && (
          <Badge className="absolute -top-1 -right-1 h-3 min-w-3 p-0 flex items-center justify-center animate-pulse bg-destructive">
            <span className="sr-only">Ungespeicherte Änderungen</span>
          </Badge>
        )}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Auf Standard zurücksetzen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auf Standard zurücksetzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dies setzt den Login-Screen auf den Standard-Gradient zurück. Gespeicherte Dateien im Dateimanager bleiben erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>
              Zurücksetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
