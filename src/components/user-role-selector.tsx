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
  "mitglied": "Mitglied",
  "kranfuehrer": "Kranführer", 
  "admin": "Administrator"
};

export function UserRoleSelector({ 
  selectedRoles, 
  onRolesChange, 
  disabled = false,
  showLabel = true 
}: UserRoleSelectorProps) {
  const allRoles: UserRole[] = ["mitglied", "kranfuehrer", "admin"];
  
  const handleRoleToggle = (role: UserRole, checked: boolean) => {
    let newRoles: UserRole[];
    
    if (checked) {
      // Add role if not already present
      newRoles = [...selectedRoles, role];
      
      // Auto-add dependent roles
      if (role === "kranfuehrer" && !selectedRoles.includes("mitglied")) {
        newRoles.push("mitglied");
      }
      if (role === "admin") {
        // Admin gets all roles
        newRoles = ["admin", "kranfuehrer", "mitglied"];
      }
    } else {
      // Remove role
      newRoles = selectedRoles.filter(r => r !== role);
      
      // Auto-remove dependent roles  
      if (role === "mitglied") {
        // If removing member role, also remove kranfuehrer and admin
        newRoles = newRoles.filter(r => r !== "kranfuehrer" && r !== "admin");
      }
      if (role === "kranfuehrer") {
        // If removing kranfuehrer role, also remove admin
        newRoles = newRoles.filter(r => r !== "admin");
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
        <p>• Kranführer sind automatisch auch Mitglieder</p>
        <p>• Administratoren haben automatisch alle Rollen</p>
      </div>
    </div>
  );
}