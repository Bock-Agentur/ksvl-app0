import { useRole } from './use-role';

export function usePermissions() {
  const { currentRole, currentUser } = useRole();

  // FIXED: Multi-Role System - Admin, Vorstand und Kranführer können Slots verwalten
  const canManageSlots = 
    currentUser?.roles?.includes("kranfuehrer") || 
    currentUser?.roles?.includes("admin") || 
    currentUser?.roles?.includes("vorstand") ||
    currentRole === "kranfuehrer" || 
    currentRole === "admin" || 
    currentRole === "vorstand";

  const canBookSlots = 
    currentUser?.roles?.includes("mitglied") || 
    currentUser?.roles?.includes("kranfuehrer") || 
    currentUser?.roles?.includes("admin") || 
    currentUser?.roles?.includes("vorstand") ||
    currentRole === "mitglied" || 
    currentRole === "kranfuehrer" || 
    currentRole === "admin" || 
    currentRole === "vorstand";

  return {
    canManageSlots,
    canBookSlots,
    currentRole,
    currentUser
  };
}
