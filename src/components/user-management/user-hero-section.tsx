import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UserHeroSectionProps {
  stats: {
    total: number;
    active: number;
    roleCount: {
      admin: number;
      [key: string]: number;
    };
    activeRate: number;
  };
  onAddUser: () => void;
  onExport: () => void;
}

export function UserHeroSection({ stats, onAddUser, onExport }: UserHeroSectionProps) {
  return (
    <Card className="card-maritime-hero">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mitgliederverwaltung</h1>
            <p className="text-muted-foreground hidden sm:block">
              {stats.total} Mitglieder • {stats.active} aktiv • {stats.roleCount.admin} Admins • {stats.activeRate}% Aktivitätsrate
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={onExport}
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-auto"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button 
              onClick={onAddUser}
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-auto"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Benutzer hinzufügen</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
