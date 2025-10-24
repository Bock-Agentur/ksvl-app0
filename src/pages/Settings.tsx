import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConsecutiveSlotsSettings } from "@/components/consecutive-slots-settings";
import { DashboardSettings } from "@/components/dashboard-settings";
import { RoleWelcomeSettings } from "@/components/role-welcome-settings";
import { FooterMenuSettings } from "@/components/footer-menu-settings";
import { MenuSettings } from "@/components/menu-settings";
import { DesignSettings } from "@/components/design-settings";
import { ThemeManager } from "@/components/theme-manager";
import { TestDataManager } from "@/components/test-data-manager";
import { UserListDatabase } from "@/components/user-list-database";
import { CustomFieldsManager } from "@/components/custom-fields-manager";
import { LoginBackgroundSettings } from "@/components/login-background-settings";
import { DesktopBackgroundSettings } from "@/components/desktop-background-settings";
import { AIAssistantSettings } from "@/components/ai-assistant-settings";
import { AIWelcomeMessageSettings } from "@/components/ai-welcome-message-settings";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { useIsMobile } from "@/hooks/use-mobile";

export function Settings() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { currentRole } = useRole();
  const isMobile = useIsMobile();

  const sections = [
    { id: "dashboard", label: "Dashboard", component: DashboardSettings },
    { id: "messages", label: "Startnachrichten", component: RoleWelcomeSettings },
    { id: "menu", label: "Drawer-Menü", component: MenuSettings },
    { id: "footer", label: "Footer-Menü", component: FooterMenuSettings },
    { id: "design", label: "Design", component: DesignSettings },
    { id: "theme", label: "Theme", component: ThemeManager },
    { id: "customfields", label: "Custom Fields", component: CustomFieldsManager },
    { id: "system", label: "System", component: ConsecutiveSlotsSettings },
    { id: "testdata", label: "Testdaten", component: TestDataManager },
    ...(currentRole === 'admin' || currentRole === 'vorstand' ? [
      { id: "aiassistant", label: "AI-Assistent", component: AIAssistantSettings },
      { id: "aiwelcome", label: "AI-Startnachricht", component: AIWelcomeMessageSettings },
      { id: "loginpage", label: "Login-Seite", component: LoginBackgroundSettings },
      { id: "desktopbg", label: "Desktop-Hintergrund", component: DesktopBackgroundSettings }
    ] : []),
  ];

  const ActiveComponent = sections.find(section => section.id === activeSection)?.component || DashboardSettings;

  return (
    <div className={cn(
      "space-y-4 max-w-7xl mx-auto",
      isMobile ? "p-0" : "p-4 space-y-6"
    )}>
      {/* Header Card - Mobile optimiert */}
      <Card className={cn(
        "bg-primary text-primary-foreground",
        isMobile && "rounded-none border-x-0"
      )}>
        <CardHeader className={isMobile ? "pb-3" : ""}>
          <CardTitle className={cn(
            "font-bold text-center",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            Einstellungen
          </CardTitle>
        </CardHeader>
        {!isMobile && (
          <CardContent className="text-center py-4">
            <p className="text-primary-foreground/90 mb-3">
              Hier können Sie die Systemeinstellungen verwalten.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Navigation Buttons - Mobile optimiert */}
      <div className={cn(
        "flex flex-wrap gap-2 justify-center",
        isMobile ? "px-2" : "gap-4"
      )}>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "font-medium transition-all",
              isMobile ? "px-3 py-2 text-xs h-auto" : "px-6 py-3 text-sm",
              activeSection === section.id 
                ? "shadow-md" 
                : "hover:shadow-sm"
            )}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {/* Active Section Content - Mobile optimiert */}
      <div className={isMobile ? "" : "mt-8"}>
        <ActiveComponent />
      </div>
    </div>
  );
}