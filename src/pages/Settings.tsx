import React, { useState, useEffect } from "react";
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
import { CustomFieldsManager } from "@/components/custom-fields-manager";
import { LoginBackgroundSettings } from "@/components/login-background-settings";
import { AIAssistantSettings } from "@/components/ai-assistant-settings";
import { AIWelcomeMessageSettings } from "@/components/ai-welcome-message-settings";
import { StickyHeaderLayoutSettings } from "@/components/sticky-header-layout-settings";
import { HeaderMessageSettings } from "@/components/header-message-settings";
import { PageLoader } from "@/components/common/page-loader";
import { PageLayout } from "@/components/common/page-layout";
import { useStickyHeaderLayout, useRole, useIsMobile, useLoginBackground, ConsecutiveSlotsProvider } from "@/hooks";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/registry/routes";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Menu, 
  List, 
  Palette, 
  Brush, 
  Image, 
  Monitor, 
  ListChecks, 
  Bot, 
  Settings as SettingsIcon, 
  Database, 
  ChevronRight, 
  ArrowLeft,
  Type,
  StickyNote,
  FolderOpen,
  type LucideIcon
} from "lucide-react";

type SettingSection = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  component?: React.ComponentType;
  route?: string;
  group: string;
};

function SettingsContent() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isOverview, setIsOverview] = useState(true);
  const { currentRole, currentUser, isLoading: roleLoading } = useRole();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // ✅ Nur laden wenn Overview sichtbar (Background benötigt)
  const { background, isLoading: bgLoading } = useLoginBackground({ enabled: isOverview });
  const { isPageSticky } = useStickyHeaderLayout({ enabled: isOverview });
  const isStickyEnabled = isPageSticky('settings');
  
  const showBackground = false; // Desktop background feature removed
  const isPageLoading = roleLoading || (isOverview && bgLoading);

  // KRITISCH: Prüfe TATSÄCHLICHE Rollen, nicht die ausgewählte Role-Switch-Rolle
  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('vorstand');
  
  // Access control - redirect if not authorized
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Zugriff verweigert", {
        description: "Sie haben keine Berechtigung, auf die Einstellungen zuzugreifen."
      });
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);
  
  // Zeige Loader während der Prüfung oder wenn kein Zugriff
  if (roleLoading || !isAdmin) {
    return <PageLoader />;
  }

  // Helper: prüft ob User die tatsächliche Rolle hat (nicht die ausgewählte)
  const userHasRole = (role: UserRole) => currentUser?.roles?.includes(role) ?? false;
  const userIsAdminOrVorstand = userHasRole('admin') || userHasRole('vorstand');
  const userIsAdmin = userHasRole('admin');

  const sections: SettingSection[] = [
    { id: "dashboard", label: "Dashboard", description: "Widgets und Layout anpassen", icon: LayoutDashboard, component: DashboardSettings, group: "dashboard" },
    { id: "headermessage", label: "Header-Nachricht", description: "Dashboard-Überschrift anpassen", icon: Type, component: HeaderMessageSettings, group: "dashboard" },
    { id: "messages", label: "Startnachrichten", description: "Willkommensnachrichten nach Rolle", icon: MessageSquare, component: RoleWelcomeSettings, group: "dashboard" },
    ...(userIsAdminOrVorstand ? [
      { id: "aiwelcome", label: "AI-Startnachricht", description: "KI-generierte Begrüßung", icon: Bot, component: AIWelcomeMessageSettings, group: "dashboard" }
    ] : []),
    { id: "menu", label: "Drawer-Menü", description: "Navigation anpassen", icon: Menu, component: MenuSettings, group: "navigation" },
    { id: "footer", label: "Footer-Menü", description: "Fußzeile konfigurieren", icon: List, component: FooterMenuSettings, group: "navigation" },
    { id: "design", label: "Design", description: "Farben und Stile", icon: Palette, component: DesignSettings, group: "design" },
    { id: "theme", label: "Theme", description: "Hell/Dunkel-Modus", icon: Brush, component: ThemeManager, group: "design" },
    ...(userIsAdminOrVorstand ? [
      { id: "loginpage", label: "Login-Seite", description: "Hintergrundbild anpassen", icon: Image, component: LoginBackgroundSettings, group: "design" },
      { id: "stickyheader", label: "Fixierte Ansicht", description: "Header-Cards fixieren", icon: StickyNote, component: StickyHeaderLayoutSettings, group: "design" }
    ] : []),
    ...(userIsAdminOrVorstand ? [
      { id: "filemanager", label: "Dateimanager", description: "Medien und Dateien verwalten", icon: FolderOpen, route: ROUTES.protected.fileManager.path, group: "advanced" }
    ] : []),
    { id: "customfields", label: "Custom Fields", description: "Benutzerdefinierte Felder", icon: ListChecks, component: CustomFieldsManager, group: "advanced" },
    ...(userIsAdminOrVorstand ? [
      { id: "aiassistant", label: "AI-Assistent", description: "KI-Einstellungen", icon: Bot, component: AIAssistantSettings, group: "advanced" }
    ] : []),
    ...(userIsAdmin ? [
      { id: "settingsmanager", label: "Settings Manager", description: "Alle Settings verwalten", icon: Database, route: "/einstellungen/settings-manager", group: "advanced" }
    ] : []),
    { id: "system", label: "System", description: "Systemeinstellungen", icon: SettingsIcon, component: ConsecutiveSlotsSettings, group: "advanced" },
    { id: "testdata", label: "Testdaten", description: "Testdaten verwalten", icon: Database, component: TestDataManager, group: "advanced" },
  ];

  const groupedSections = {
    dashboard: sections.filter(s => s.group === "dashboard"),
    navigation: sections.filter(s => s.group === "navigation"),
    design: sections.filter(s => s.group === "design"),
    advanced: sections.filter(s => s.group === "advanced"),
  };

  const handleSelectSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section?.route) {
      navigate(section.route);
    } else {
      setActiveSection(sectionId);
      setIsOverview(false);
    }
  };

  const handleBack = () => {
    setIsOverview(true);
    setActiveSection(null);
  };

  const ActiveComponent = sections.find(section => section.id === activeSection)?.component;
  const activeLabel = sections.find(section => section.id === activeSection)?.label;


  if (isOverview) {
    return (
      <PageLayout>
      <div
        className={cn(
          "min-h-screen pb-20 bg-background",
          isMobile ? "pt-4" : "p-6"
        )}
        style={showBackground ? {
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        } : undefined}
      >
    <div className={cn("max-w-4xl mx-auto")}>
      {/* Header */}
      <Card className={cn(
        "bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6",
        isMobile && "mx-4"
      )}>
          <CardHeader className="pb-6">
            <CardTitle className={cn(
              "font-bold",
              isMobile ? "text-3xl" : "text-4xl"
            )}>
              Settings
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Settings Cards Groups */}
        <div className={cn("space-y-4", isMobile ? "px-4" : "")}>
          {/* Dashboard & Ansicht */}
          {groupedSections.dashboard.length > 0 && (
            <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 overflow-hidden">
              {groupedSections.dashboard.map((section, index) => (
                <div key={section.id}>
                  <div
                    onClick={() => handleSelectSection(section.id)}
                    className="flex items-center justify-between py-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <section.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{section.label}</div>
                        {section.description && (
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {index < groupedSections.dashboard.length - 1 && (
                    <div className="border-t border-border/50 mx-6" />
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Navigation */}
          {groupedSections.navigation.length > 0 && (
            <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 overflow-hidden">
              {groupedSections.navigation.map((section, index) => (
                <div key={section.id}>
                  <div
                    onClick={() => handleSelectSection(section.id)}
                    className="flex items-center justify-between py-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <section.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{section.label}</div>
                        {section.description && (
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {index < groupedSections.navigation.length - 1 && (
                    <div className="border-t border-border/50 mx-6" />
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Design & Darstellung */}
          {groupedSections.design.length > 0 && (
            <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 overflow-hidden">
              {groupedSections.design.map((section, index) => (
                <div key={section.id}>
                  <div
                    onClick={() => handleSelectSection(section.id)}
                    className="flex items-center justify-between py-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <section.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{section.label}</div>
                        {section.description && (
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {index < groupedSections.design.length - 1 && (
                    <div className="border-t border-border/50 mx-6" />
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Erweitert */}
          {groupedSections.advanced.length > 0 && (
            <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 overflow-hidden">
              {groupedSections.advanced.map((section, index) => (
                <div key={section.id}>
                  <div
                    onClick={() => handleSelectSection(section.id)}
                    className="flex items-center justify-between py-4 px-6 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <section.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{section.label}</div>
                        {section.description && (
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {index < groupedSections.advanced.length - 1 && (
                    <div className="border-t border-border/50 mx-6" />
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
        </div>
      </div>
      </PageLayout>
    );
  }

  // Detail View
  return (
    <PageLayout>
    <div
      className={cn(
        "min-h-screen pb-20 bg-background",
        isMobile ? "pt-4" : "p-6",
        isStickyEnabled ? "flex flex-col h-screen overflow-hidden" : ""
      )}
      style={showBackground ? {
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : undefined}
    >
      <div className={cn(
        "max-w-4xl mx-auto",
        isStickyEnabled ? "flex flex-col h-full overflow-hidden" : ""
      )}>
        {/* Sticky Header */}
        <div className={cn(
          isStickyEnabled ? "flex-shrink-0 relative z-10" : ""
        )}>
          <Card className={cn(
            "bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0 mb-6",
            isMobile && "mx-4"
          )}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className={cn(
                    "rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors shadow-md",
                    isMobile ? "w-8 h-8" : "w-10 h-10"
                  )}
                >
                  <ArrowLeft className={cn(
                    "text-foreground",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                </button>
                <CardTitle className={cn(
                  "font-bold flex-1 text-center text-white",
                  isMobile ? "text-xl" : "text-2xl"
                )}>
                  {activeLabel}
                </CardTitle>
                <div className="w-10" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Scrollable Settings Content */}
        <div className={cn(
          isMobile ? "px-4" : "",
          isStickyEnabled ? "flex-1 overflow-y-auto" : ""
        )}>
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
    </PageLayout>
  );
}

export function Settings() {
  return (
    <ConsecutiveSlotsProvider>
      <SettingsContent />
    </ConsecutiveSlotsProvider>
  );
}