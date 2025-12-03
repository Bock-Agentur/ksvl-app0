/**
 * SlotStatusBadge - Einheitliches Status-Badge für Slots
 * Nutzt STATUS_LABELS für konsistente Texte
 */

import React from "react";
import { SlotStatus } from "@/types";
import { STATUS_LABELS } from "@/lib/slots/slot-view-model";

interface SlotStatusBadgeProps {
  status: SlotStatus;
  colors: {
    background: string;
    text: string;
    label: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { padding: "2px 8px", fontSize: "12px", borderRadius: "4px" },
  md: { padding: "4px 12px", fontSize: "14px", borderRadius: "6px" },
  lg: { padding: "6px 16px", fontSize: "16px", borderRadius: "8px" },
};

export function SlotStatusBadge({
  status,
  colors,
  size = "sm",
  className = "",
}: SlotStatusBadgeProps) {
  const config = sizeConfig[size];
  const label = STATUS_LABELS[status];
  
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        padding: config.padding,
        fontSize: config.fontSize,
        fontWeight: 500,
        borderRadius: config.borderRadius,
        backgroundColor: colors.label,
        color: colors.text,
        border: "none",
        outline: "none",
      }}
    >
      {label}
    </span>
  );
}
