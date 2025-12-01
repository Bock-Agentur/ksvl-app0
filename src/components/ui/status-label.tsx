import React from "react";
import { useSlotDesign } from "@/hooks";

export type SlotStatus = "available" | "booked" | "blocked";

interface StatusLabelProps {
  status: SlotStatus;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusLabel({ 
  status, 
  children, 
  size = "sm", 
  className = "" 
}: StatusLabelProps) {
  const { settings } = useSlotDesign();
  
  // Verwende Settings für alle Slot-Typen
  const directColors = {
    available: {
      background: settings.available.label,
      text: settings.available.text
    },
    booked: {
      background: settings.booked.label,
      text: settings.booked.text
    },
    blocked: {
      background: settings.blocked.label,
      text: settings.blocked.text
    }
  };
  
  const colorConfig = directColors[status];
  
  // Size configurations
  const sizeConfig = {
    sm: { padding: "2px 8px", fontSize: "12px", borderRadius: "4px" },
    md: { padding: "4px 12px", fontSize: "14px", borderRadius: "6px" },
    lg: { padding: "6px 16px", fontSize: "16px", borderRadius: "8px" }
  };
  
  const config = sizeConfig[size];
  
  // MAXIMALE CSS-ÜBERSCHREIBUNG
  const forceStyle: React.CSSProperties = {
    display: "inline-block",
    padding: config.padding,
    fontSize: config.fontSize,
    fontWeight: "500",
    borderRadius: config.borderRadius,
    backgroundColor: colorConfig.background,
    color: colorConfig.text,
    border: "none",
    outline: "none",
    // FORCE ÜBERSCHREIBUNG ALLER MÖGLICHEN CSS-KONFLIKTE
    backgroundImage: "none",
    backgroundClip: "padding-box",
    backgroundOrigin: "padding-box",
    backgroundAttachment: "scroll",
    backgroundRepeat: "no-repeat",
    boxShadow: "none",
    textShadow: "none",
    opacity: "1",
    visibility: "visible",
    transform: "none",
    filter: "none",
    mixBlendMode: "normal",
    isolation: "auto"
  };
  
  return (
    <span style={forceStyle}>
      {children}
    </span>
  );
}