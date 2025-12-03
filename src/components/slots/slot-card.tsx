/**
 * SlotCard - Einheitliche Slot-Darstellung für alle Ansichten
 * Varianten: compact (Kalender), list (Listen-Ansicht), detail (Dialog)
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  Mail, 
  CalendarDays, 
  ChevronDown, 
  ChevronUp,
  Edit,
  Trash2,
  XCircle,
  CalendarCheck,
  StickyNote
} from "lucide-react";
import { SlotViewModel, STATUS_LABELS } from "@/lib/slots/slot-view-model";
import { SlotStatusBadge } from "./slot-status-badge";
import { cn } from "@/lib/utils";

export type SlotAction = 'details' | 'edit' | 'delete' | 'cancel' | 'book';

interface SlotCardProps {
  slot: SlotViewModel;
  variant: 'compact' | 'list' | 'detail';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onAction?: (action: SlotAction, slot: SlotViewModel) => void;
  showActions?: boolean;
  isClickable?: boolean;
  className?: string;
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
}: SlotCardProps) {
  // Uncontrolled expand state for list variant
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const toggleExpand = onToggleExpand ?? (() => setInternalExpanded(!internalExpanded));
  
  const handleAction = (action: SlotAction, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onAction?.(action, slot);
  };
  
  const handleClick = () => {
    if (isClickable && onAction) {
      onAction('details', slot);
    }
  };

  // Compact Variant (für Kalender-Grid)
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          "h-full p-3 transition-all rounded-lg",
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

  // List Variant (für Slot-Liste)
  if (variant === 'list') {
    return (
      <Card
        className={cn(
          "border hover:shadow-md transition-shadow",
          className
        )}
        style={{
          backgroundColor: slot.colors.background,
          borderColor: slot.colors.border,
        }}
      >
        <CardContent className="p-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SlotStatusBadge 
                status={slot.status} 
                colors={slot.colors}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="font-medium text-sm"
                    style={{ color: slot.colors.text }}
                  >
                    {slot.formattedDate}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ color: slot.colors.text, borderColor: slot.colors.border }}
                  >
                    {slot.formattedTime}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ color: slot.colors.text }}
                  >
                    {slot.formattedDuration}
                  </Badge>
                </div>
                <p 
                  className="text-xs truncate"
                  style={{ color: slot.colors.text, opacity: 0.8 }}
                >
                  {slot.craneOperator.name}
                </p>
              </div>
            </div>

            {/* Expand Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Expanded View */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Details Grid */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"
                style={{ color: slot.colors.text }}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" style={{ color: slot.colors.text, opacity: 0.7 }} />
                  <span>{slot.formattedDateLong}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: slot.colors.text, opacity: 0.7 }} />
                  <span>{slot.formattedTime} ({slot.formattedDuration})</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: slot.colors.text, opacity: 0.7 }} />
                  <span>Kranführer: {slot.craneOperator.name}</span>
                </div>
                {slot.craneOperator.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: slot.colors.text, opacity: 0.7 }} />
                    <span className="truncate">{slot.craneOperator.email}</span>
                  </div>
                )}
              </div>

              {/* Booking Information */}
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
                  <div className="space-y-1 text-sm" style={{ color: slot.colors.text, opacity: 0.9 }}>
                    <p>{slot.bookedMember.name}</p>
                    {slot.bookedMember.email && <p>{slot.bookedMember.email}</p>}
                    {slot.bookedMember.memberNumber && (
                      <p>Mitgliedsnr.: {slot.bookedMember.memberNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {slot.notes && (
                <div className="text-sm" style={{ color: slot.colors.text }}>
                  <div className="flex items-center gap-2 mb-1">
                    <StickyNote className="w-4 h-4" style={{ opacity: 0.7 }} />
                    <span className="font-medium">Notizen:</span>
                  </div>
                  <p style={{ opacity: 0.9 }}>{slot.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {showActions && (
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => handleAction('details', e)}
                    className="flex-1"
                  >
                    Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => handleAction('edit', e)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </Button>
                  {slot.isBooked ? (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => handleAction('cancel', e)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Stornieren
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => handleAction('delete', e)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </Button>
                  )}
                </div>
              )}
            </div>
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
            <CalendarDays className="w-4 h-4" style={{ opacity: 0.7 }} />
            <span>{slot.formattedDateLong}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ opacity: 0.7 }} />
            <span>{slot.formattedTime} ({slot.formattedDuration})</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" style={{ opacity: 0.7 }} />
            <span>Kranführer: {slot.craneOperator.name}</span>
          </div>
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
            <div className="space-y-1 text-sm" style={{ color: slot.colors.text, opacity: 0.9 }}>
              <p>{slot.bookedMember.name}</p>
              {slot.bookedMember.email && <p>{slot.bookedMember.email}</p>}
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
