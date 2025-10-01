import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConsecutiveSlotsSettings } from "@/components/consecutive-slots-settings";
import { DashboardSettings } from "@/components/dashboard-settings";
import { RoleWelcomeSettings } from "@/components/role-welcome-settings";
import { FooterMenuSettings } from "@/components/footer-menu-settings";
import { MenuSettings } from "@/components/menu-settings";
import { DesignSettings } from "@/components/design-settings";
import { cn } from "@/lib/utils";

export function Settings() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections = [
    { id: "dashboard", label: "Dashboard", component: DashboardSettings },
    { id: "messages", label: "Startnachrichten", component: RoleWelcomeSettings },
    { id: "menu", label: "Menü", component: MenuSettings },
    { id: "footer", label: "Footer-Menü", component: FooterMenuSettings },
    { id: "design", label: "Design", component: DesignSettings },
    { id: "system", label: "System", component: ConsecutiveSlotsSettings },
  ];

  const ActiveComponent = sections.find(section => section.id === activeSection)?.component || DashboardSettings;

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <p className="text-primary-foreground/90 mb-3">
            Hier können Sie die Systemeinstellungen verwalten.
          </p>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-all",
              activeSection === section.id 
                ? "shadow-md" 
                : "hover:shadow-sm"
            )}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {/* Active Section Content */}
      <div className="mt-8">
        <ActiveComponent />
      </div>
    </div>
  );
}