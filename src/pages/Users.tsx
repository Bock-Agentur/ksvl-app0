import { UserManagementRefactored } from "@/components/user-management";
import { PageLayout } from "@/components/common/page-layout";

/**
 * Mitgliederverwaltung Page
 * 
 * Zentrale Seite für die Verwaltung von Mitgliedern.
 * Zugriff nur für Admin und Vorstand.
 */
export function Users() {
  return (
    <PageLayout>
      <UserManagementRefactored />
    </PageLayout>
  );
}
