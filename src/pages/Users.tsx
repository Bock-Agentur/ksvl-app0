import { UserManagementRefactored } from "@/components/user-management";

/**
 * Mitgliederverwaltung Page
 * 
 * Zentrale Seite für die Verwaltung von Mitgliedern.
 * Zugriff nur für Admin und Vorstand.
 */
export function Users() {
  return <UserManagementRefactored />;
}
