import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, User, Mail, CalendarDays, ChevronDown, ChevronUp, XCircle, StickyNote } from "lucide-react";
import { Slot } from "@/types";
import { useConsecutiveSlots, useSlotDesign } from "@/hooks";
import { STATUS_LABELS, formatDuration, formatDateShort, formatDateLong } from "@/lib/slots/slot-view-model";
import { SlotStatusBadge } from "@/components/slots/slot-status-badge";

interface SlotListItemProps {
  slot: Slot;
  allSlots: Slot[];
  onEdit: (slot: Slot) => void;
  onDelete: (slotId: string) => void;
  onCancel: (slotId: string) => void;
  onShowDetails: (slot: Slot) => void;
}

export function SlotListItem({ slot, allSlots, onEdit, onDelete, onCancel, onShowDetails }: SlotListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getSlotStatus } = useConsecutiveSlots();
  const { settings } = useSlotDesign();

  const status = getSlotStatus(slot, allSlots);
  const colors = settings[status];

  return (
    <Card 
      className="border hover:shadow-md transition-shadow"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      <CardContent className="p-4">
        {/* Compact View */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Einheitliches Status-Badge mit STATUS_LABELS */}
            <SlotStatusBadge 
              status={status} 
              colors={colors}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm" style={{ color: colors.text }}>
                  {formatDateShort(slot.date)}
                </span>
                <Badge variant="outline" className="text-xs" style={{ color: colors.text, borderColor: colors.border }}>
                  {slot.time} Uhr
                </Badge>
                {/* Einheitliches Dauer-Format */}
                <Badge variant="secondary" className="text-xs" style={{ color: colors.text }}>
                  {formatDuration(slot.duration)}
                </Badge>
              </div>
              <p className="text-xs truncate" style={{ color: colors.text, opacity: 0.8 }}>{slot.craneOperator.name}</p>
            </div>
          </div>

          {/* Expand Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ color: colors.text }}>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" style={{ color: colors.text, opacity: 0.7 }} />
                <span>{formatDateLong(slot.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: colors.text, opacity: 0.7 }} />
                <span>{slot.time} Uhr ({formatDuration(slot.duration)})</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: colors.text, opacity: 0.7 }} />
                <span>Kranführer: {slot.craneOperator.name}</span>
              </div>
              {slot.craneOperator.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: colors.text, opacity: 0.7 }} />
                  <span className="truncate">{slot.craneOperator.email}</span>
                </div>
              )}
            </div>

            {/* Booking Information */}
            {slot.isBooked && slot.member && (
              <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: `${colors.background}dd`, borderLeft: `3px solid ${colors.border}` }}>
                <p className="text-sm font-medium" style={{ color: colors.text }}>Gebucht von:</p>
                <div className="space-y-1 text-sm" style={{ color: colors.text, opacity: 0.9 }}>
                  <p>{slot.member.name}</p>
                  {slot.member.email && <p>{slot.member.email}</p>}
                  {slot.member.memberNumber && <p>Mitgliedsnr.: {slot.member.memberNumber}</p>}
                </div>
              </div>
            )}

            {/* Notes */}
            {slot.notes && (
              <div className="text-sm" style={{ color: colors.text }}>
                <div className="flex items-center gap-2 mb-1">
                  <StickyNote className="w-4 h-4" style={{ opacity: 0.7 }} />
                  <span className="font-medium">Notizen:</span>
                </div>
                <p style={{ opacity: 0.9 }}>{slot.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => onShowDetails(slot)} className="flex-1">
                Details
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(slot)}>
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
              {slot.isBooked ? (
                <Button variant="destructive" size="sm" onClick={() => onCancel(slot.id)}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Stornieren
                </Button>
              ) : (
                <Button variant="destructive" size="sm" onClick={() => onDelete(slot.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
