import { useState, useEffect } from "react";
import { RoleProvider, useRole } from "@/hooks/use-role";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { TestDataProvider, useTestData } from "@/hooks/use-test-data";
import { ConsecutiveSlotsProvider } from "@/hooks/use-consecutive-slots";
import { storage } from "@/lib/storage";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { UserManagementRefactored as UserManagement } from "@/components/user-management";
import { SlotManagement } from "@/components/slot-management";
import { ProfileView } from "@/components/profile-view";
import { Settings } from "@/pages/Settings";
import { AuditLogs } from "@/components/audit-logs";
import { CalendarView } from "@/components/calendar-view";

// Inner component that uses the role context
function AppContent() {
  const { currentRole, currentUser, setRole } = useRole();
  const testData = useTestData();
  
  // Load active tab from localStorage, fallback to "dashboard"
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = storage.getItem('activeTab', 'dashboard');
    return savedTab;
  });
  
  // Initialize slot design system
  useSlotDesign();

  // Save active tab to localStorage when it changes
  useEffect(() => {
    storage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Let TestDataProvider handle initialization - no forced scenario loading

  const renderContent = () => {
    console.log("Rendering content for activeTab:", activeTab);
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "calendar":
        console.log("Rendering CalendarView");
        return <CalendarView />;
      case "bookings":
        return (
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Buchungen</h2>
            <p className="text-muted-foreground">Buchungsverwaltung wird hier implementiert...</p>
          </div>
        );
      case "profile":
        return <ProfileView currentRole={currentRole} />;
      case "users":
        return <UserManagement />;
      case "slots":
        return <SlotManagement />;
      case "audit-logs":
        return <AuditLogs />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppShell
      currentRole={currentRole}
      currentUser={currentUser}
      onRoleChange={setRole}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </AppShell>
  );
}

const Index = () => {
  return (
    <TestDataProvider>
      <RoleProvider>
        <ConsecutiveSlotsProvider>
          <AppContent />
        </ConsecutiveSlotsProvider>
      </RoleProvider>
    </TestDataProvider>
  );
};

export default Index;
