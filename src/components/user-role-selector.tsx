import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole, generateRolesFromPrimary } from "@/types";

interface UserRoleSelectorProps {
  selectedRoles: UserRole[];
  onRolesChange: (roles: UserRole[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  "gastmitglied": "Gastmitglied",
  "mitglied": "Mitglied",
  "kranfuehrer": "Kranführer", 
  "admin": "Administrator",
  "vorstand": "Vorstand"
};

export function UserRoleSelector({ 
  selectedRoles, 
  onRolesChange, 
  disabled = false,
  showLabel = true 
}: UserRoleSelectorProps) {
  const allRoles: UserRole[] = ["gastmitglied", "mitglied", "kranfuehrer", "admin", "vorstand"];
  
  const handleRoleToggle = (role: UserRole, checked: boolean) => {
    let newRoles: UserRole[];
    
    if (checked) {
      // Add role if not already present
      newRoles = [...selectedRoles, role];
      
      // Auto-add dependent roles
      if (role === "kranfuehrer" && !selectedRoles.includes("mitglied") && !selectedRoles.includes("gastmitglied")) {
        newRoles.push("mitglied");
      }
      if (role === "admin") {
        // Admin gets all non-vorstand roles
        newRoles = ["admin", "kranfuehrer", "mitglied", "gastmitglied"];
      }
      if (role === "vorstand") {
        // Vorstand gets all roles
        newRoles = ["vorstand", "admin", "kranfuehrer", "mitglied", "gastmitglied"];
      }
    } else {
      // Remove role
      newRoles = selectedRoles.filter(r => r !== role);
      
      // Auto-remove dependent roles  
      if (role === "mitglied" || role === "gastmitglied") {
        // If removing base member roles, also remove higher roles
        newRoles = newRoles.filter(r => r !== "kranfuehrer" && r !== "admin" && r !== "vorstand");
      }
      if (role === "kranfuehrer") {
        // If removing kranfuehrer role, also remove admin and vorstand
        newRoles = newRoles.filter(r => r !== "admin" && r !== "vorstand");
      }
      if (role === "admin") {
        // If removing admin role, also remove vorstand
        newRoles = newRoles.filter(r => r !== "vorstand");
      }
    }
    
    // Remove duplicates and ensure consistent order
    const uniqueRoles = Array.from(new Set(newRoles));
    const orderedRoles = allRoles.filter(role => uniqueRoles.includes(role));
    
    onRolesChange(orderedRoles);
  };

  return (
    <div className="space-y-3">
      {showLabel && (
        <Label className="text-sm font-medium">Rollen</Label>
      )}
      <div className="space-y-2">
        {allRoles.map((role) => (
          <div key={role} className="flex items-center space-x-2">
            <Checkbox
              id={`role-${role}`}
              checked={selectedRoles.includes(role)}
              onCheckedChange={(checked) => handleRoleToggle(role, Boolean(checked))}
              disabled={disabled}
            />
            <Label
              htmlFor={`role-${role}`}
              className="text-sm font-normal cursor-pointer"
            >
              {roleLabels[role]}
            </Label>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        <p>• Gastmitglieder haben die gleichen Rechte wie Mitglieder</p>
        <p>• Kranführer sind automatisch auch Mitglieder</p>
        <p>• Administratoren haben automatisch alle Rollen außer Vorstand</p>
        <p>• Vorstand hat automatisch alle Rollen</p>
      </div>
    </div>
  );
}