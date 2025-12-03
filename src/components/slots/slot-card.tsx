/**
 * SlotCard - Einheitliche Slot-Darstellung für alle Ansichten
 * Varianten: compact (Kalender), list (Listen-Ansicht), detail (Dialog)
 * Trendy Design mit großer Uhrzeit, Status-farbigem Chevron, Lucide-Icons
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Users,
  Mail, 
  Phone,
  CalendarDays, 
  ChevronDown, 
  ChevronUp,
  Edit,
  Trash2,
  XCircle,
  StickyNote,
  Hash,
  CalendarPlus
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SlotViewModel, STATUS_LABELS } from "@/lib/slots/slot-view-model";
import { SlotStatusBadge } from "./slot-status-badge";
import { cn } from "@/lib/utils";

// Action-Types: 'edit' öffnet den Drawer
export type SlotAction = 'book' | 'edit' | 'cancel' | 'delete';

// Rollen für Button-Visibility
type UserRole = 'admin' | 'vorstand' | 'kranfuehrer' | 'mitglied' | 'gastmitglied';

interface SlotCardProps {
  slot: SlotViewModel;
  variant: 'compact' | 'list' | 'detail';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onAction?: (action: SlotAction, slot: SlotViewModel) => void;
  showActions?: boolean;
  isClickable?: boolean;
  className?: string;
  // NEU: Rollen-basierte Steuerung
  userRole?: UserRole;
  currentUserId?: string;
}

// Hilfsfunktion: Kann der User Admin-Aktionen ausführen?
function canManageSlots(userRole?: UserRole): boolean {
  return ['admin', 'vorstand', 'kranfuehrer'].includes(userRole || '');
}

export function SlotCard({
  slot,
  variant,
  isExpanded: controlledExpanded,
  onToggleExpand,
  onAction,
  showActions = false,
  isClickable = false,
  className,
  userRole,
  currentUserId,
}: SlotCardProps) {
  // Uncontrolled expand state for list variant
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [showBookConfirm, setShowBookConfirm] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const toggleExpand = onToggleExpand ?? (() => setInternalExpanded(!internalExpanded));
  
  const handleAction = (action: SlotAction, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onAction?.(action, slot);
  };
  
  const handleClick = () => {
    if (isClickable && onAction) {
      onAction('edit', slot);
    }
  };

  // Berechtigungen
  const canManage = canManageSlots(userRole);
  // Buttons anzeigen wenn expanded UND (Mitglied kann buchen ODER Admin kann verwalten)
  const showActionButtons = showActions && isExpanded;

  // Compact Variant (für Kalender-Grid)
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          "h-full p-3 transition-all rounded-lg relative",
          isClickable && "cursor-pointer hover:shadow-md",
          className
        )}
        style={{
          backgroundColor: slot.colors.background,
          borderColor: slot.colors.border,
        }}
        onClick={handleClick}
      >
        {/* Kranführer */}
        <div 
          className="truncate text-xs font-medium leading-tight"
          style={{ color: slot.colors.text }}
        >
          {slot.craneOperator.name}
        </div>
        
        {/* Member Info wenn gebucht */}
        {slot.isBooked && slot.bookedMember?.name && (
          <div 
            className="truncate text-xs opacity-90 leading-tight"
            style={{ color: slot.colors.text }}
          >
            {slot.bookedMember.name}
          </div>
        )}
        
        {/* Dauer - einheitliches Format */}
        <div 
          className="text-xs opacity-75"
          style={{ color: slot.colors.text }}
        >
          {slot.formattedDuration}
        </div>
        
        {/* Status-Indikator */}
        <div 
          className="absolute top-2 right-2 w-2 h-2 rounded-full opacity-75"
          style={{ backgroundColor: slot.colors.label }}
        />
      </Card>
    );
  }

  // List Variant (für Slot-Liste) - Trendy Design
  if (variant === 'list') {
    return (
      <Card
        className={cn(
          "border hover:shadow-md transition-shadow card-shadow-soft rounded-xl",
          className
        )}
        style={{
          backgroundColor: slot.colors.background,
          borderColor: slot.colors.border,
        }}
      >
        <CardContent className="p-5">
          {/* === COLLAPSED HEADER === */}
          
          {/* Zeile 1: Große Uhrzeit + Dauer-Badge | Status-Badge + Chevron */}
          <div className="flex items-start justify-between">
            {/* Links: Große Uhrzeit + Dauer */}
            <div className="flex items-center gap-3">
              <span 
                className="text-2xl font-bold tracking-tight"
                style={{ color: slot.colors.text }}
              >
                {slot.time} Uhr
              </span>
              <Badge 
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: slot.colors.label,
                  color: '#fff',
                  border: 'none'
                }}
              >
                {slot.formattedDuration}
              </Badge>
            </div>
            
            {/* Rechts: Status-Badge + Chevron-Kreis */}
            <div className="flex items-center gap-2">
              <SlotStatusBadge 
                status={slot.status} 
                colors={slot.colors}
                size="sm"
              />
              {/* Kreis-Chevron in Status-Farbe, KEIN Hover */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: slot.colors.label }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
              >
                {isExpanded 
                  ? <ChevronUp className="w-4 h-4 text-white" />
                  : <ChevronDown className="w-4 h-4 text-white" />
                }
              </div>
            </div>
          </div>

          {/* Zeile 2: Datum kleiner */}
          <p 
            className="text-sm text-muted-foreground mt-1"
            style={{ color: slot.colors.text, opacity: 0.7 }}
          >
            {slot.formattedDate}
          </p>

          {/* Zeile 3-4: Info-Zeilen mit Lucide-Icons */}
          <div className="mt-3 space-y-1.5">
            <div 
              className="flex items-center gap-2 text-sm"
              style={{ color: slot.colors.text }}
            >
              <User className="w-4 h-4 opacity-70" />
              <span>Kranführer: {slot.craneOperator.name}</span>
            </div>
            {slot.isBooked && slot.bookedMember?.name && (
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: slot.colors.text }}
              >
                <Users className="w-4 h-4 opacity-70" />
                <span>Gebucht von: {slot.bookedMember.name}</span>
              </div>
            )}
          </div>

          {/* === EXPANDED VIEW === */}
          {isExpanded && (
            <>
              {/* Klare Trennung */}
              <div 
                className="mt-4 pt-4 border-t"
                style={{ borderColor: slot.colors.border }}
              >
                {/* Detail-Sektion: Kranführer */}
                <div className="space-y-3">
                  <p 
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: slot.colors.text, opacity: 0.6 }}
                  >
                    Details
                  </p>
                  
                  <div className="space-y-2 text-sm" style={{ color: slot.colors.text }}>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 opacity-70" />
                      <span>{slot.formattedDateLong}</span>
                    </div>
                    
                    {/* Kranführer-Block */}
                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: `${slot.colors.background}ee` }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ opacity: 0.6 }}>
                        Kranführer
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 opacity-70" />
                          <span>{slot.craneOperator.name}</span>
                        </div>
                        {slot.craneOperator.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 opacity-70" />
                            <span>{slot.craneOperator.email}</span>
                          </div>
                        )}
                        {slot.craneOperator.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 opacity-70" />
                            <span>{slot.craneOperator.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Buchungs-Block (nur wenn gebucht) */}
                    {slot.isBooked && slot.bookedMember && (
                      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: `${slot.colors.background}ee` }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ opacity: 0.6 }}>
                          Buchung
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 opacity-70" />
                            <span>{slot.bookedMember.name}</span>
                          </div>
                          {slot.bookedMember.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 opacity-70" />
                              <span>{slot.bookedMember.email}</span>
                            </div>
                          )}
                          {slot.bookedMember.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 opacity-70" />
                              <span>{slot.bookedMember.phone}</span>
                            </div>
                          )}
                          {slot.bookedMember.memberNumber && (
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 opacity-70" />
                              <span>Mitgliedsnr.: {slot.bookedMember.memberNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notizen (optional) */}
                  {slot.notes && (
                    <div className="flex items-start gap-2 text-sm" style={{ color: slot.colors.text }}>
                      <StickyNote className="w-4 h-4 opacity-70 mt-0.5" />
                      <span>{slot.notes}</span>
                    </div>
                  )}

                  {/* Block/Mini-Slot Hinweise */}
                  {(slot.isPartOfBlock || slot.isMiniSlot) && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {slot.isPartOfBlock && (
                        <Badge variant="outline" className="text-xs" style={{ color: slot.colors.text, borderColor: slot.colors.border }}>
                          Block-Buchung
                        </Badge>
                      )}
                      {slot.isMiniSlot && (
                        <Badge variant="outline" className="text-xs" style={{ color: slot.colors.text, borderColor: slot.colors.border }}>
                          15-Minuten-Slot
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Badge-Stil ohne Hover, rechts ausgerichtet */}
              {showActionButtons && (
                <div 
                  className="mt-4 pt-3 border-t flex gap-2 flex-wrap justify-end"
                  style={{ borderColor: slot.colors.border }}
                >
                  {/* Buchen - für ALLE Benutzer bei verfügbaren Slots */}
                  {!slot.isBooked && (
                    <span 
                      className="inline-flex items-center h-6 px-2.5 text-xs font-medium rounded-full cursor-pointer"
                      style={{ 
                        backgroundColor: 'hsl(var(--primary))',
                        color: '#fff'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBookConfirm(true);
                      }}
                    >
                      <CalendarPlus className="w-3 h-3 mr-1" />
                      Buchen
                    </span>
                  )}
                  
                  {/* Bearbeiten - nur Admin/Vorstand/Kranführer */}
                  {canManage && (
                    <span 
                      className="inline-flex items-center h-6 px-2.5 text-xs font-medium rounded-full cursor-pointer"
                      style={{ 
                        backgroundColor: slot.colors.label,
                        color: '#fff'
                      }}
                      onClick={(e) => handleAction('edit', e)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Bearbeiten
                    </span>
                  )}
                  
                  {/* Stornieren - nur Admin/Vorstand/Kranführer wenn gebucht */}
                  {canManage && slot.isBooked && (
                    <span 
                      className="inline-flex items-center h-6 px-2.5 text-xs font-medium rounded-full cursor-pointer"
                      style={{ 
                        backgroundColor: 'hsl(var(--destructive))',
                        color: '#fff'
                      }}
                      onClick={(e) => handleAction('cancel', e)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Stornieren
                    </span>
                  )}
                  
                  {/* Löschen - nur Admin/Vorstand/Kranführer */}
                  {canManage && (
                    <span 
                      className="inline-flex items-center h-6 px-2.5 text-xs font-medium rounded-full cursor-pointer"
                      style={{ 
                        backgroundColor: 'hsl(var(--destructive))',
                        color: '#fff'
                      }}
                      onClick={(e) => handleAction('delete', e)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Löschen
                    </span>
                  )}
                </div>
              )}
              
              {/* AlertDialog für Buchungsbestätigung */}
              <AlertDialog open={showBookConfirm} onOpenChange={setShowBookConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Termin buchen?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">
                        Möchten Sie den Termin am <strong>{slot.formattedDate}</strong> um <strong>{slot.time} Uhr</strong> wirklich buchen?
                      </span>
                      <span className="block text-destructive font-medium">
                        ⚠️ Achtung: Der Termin kann nicht selbständig storniert werden. Bei Bedarf wenden Sie sich bitte an den Vorstand.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      setShowBookConfirm(false);
                      onAction?.('book', slot);
                    }}>
                      Jetzt buchen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detail Variant (für Dialoge)
  return (
    <Card
      className={cn("border", className)}
      style={{
        backgroundColor: slot.colors.background,
        borderColor: slot.colors.border,
      }}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <SlotStatusBadge 
            status={slot.status} 
            colors={slot.colors}
            size="md"
          />
          {slot.isBooked && slot.bookedMember?.name && (
            <span className="text-sm" style={{ color: slot.colors.text, opacity: 0.8 }}>
              von {slot.bookedMember.name}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm" style={{ color: slot.colors.text }}>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 opacity-70" />
            <span>{slot.formattedDateLong}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 opacity-70" />
            <span>Kranführer: {slot.craneOperator.name}</span>
          </div>
          {slot.craneOperator.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 opacity-70" />
              <span>{slot.craneOperator.phone}</span>
            </div>
          )}
        </div>

        {/* Booking Details */}
        {slot.isBooked && slot.bookedMember && (
          <div 
            className="p-3 rounded-lg space-y-2"
            style={{ 
              backgroundColor: `${slot.colors.background}dd`, 
              borderLeft: `3px solid ${slot.colors.border}` 
            }}
          >
            <p className="text-sm font-medium" style={{ color: slot.colors.text }}>
              Gebucht von:
            </p>
            <div className="space-y-1.5 text-sm" style={{ color: slot.colors.text, opacity: 0.9 }}>
              <p>{slot.bookedMember.name}</p>
              {slot.bookedMember.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-70" />
                  <span>{slot.bookedMember.email}</span>
                </div>
              )}
              {slot.bookedMember.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 opacity-70" />
                  <span>{slot.bookedMember.phone}</span>
                </div>
              )}
              {slot.bookedMember.memberNumber && (
                <p>Mitgliedsnr.: {slot.bookedMember.memberNumber}</p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {slot.notes && (
          <div className="text-sm" style={{ color: slot.colors.text }}>
            <p className="font-medium mb-1">Notizen:</p>
            <p style={{ opacity: 0.9 }}>{slot.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
