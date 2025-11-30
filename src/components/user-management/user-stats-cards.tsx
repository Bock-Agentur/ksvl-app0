import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UserStatsCardsProps {
  stats: {
    total: number;
    active: number;
    roleCount: {
      mitglied: number;
      kranfuehrer: number;
      admin: number;
    };
  };
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  return (
    <>
      {/* Mobile Collapsible */}
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen} className="sm:hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between card-maritime-hero hover:bg-white/90 px-6 py-4 h-auto"
          >
            <span className="font-semibold text-sm">Statistiken anzeigen</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isStatsOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="card-maritime-hero">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Card className="card-maritime-hero">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-primary">{stats.total}</div>
                    <p className="text-[10px] text-muted-foreground">Gesamt</p>
                  </CardContent>
                </Card>
                <Card className="card-maritime-hero">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-green-600">{stats.active}</div>
                    <p className="text-[10px] text-muted-foreground">Aktiv</p>
                  </CardContent>
                </Card>
                <Card className="card-maritime-hero">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-blue-600">{stats.roleCount.mitglied}</div>
                    <p className="text-[10px] text-muted-foreground">Mitglieder</p>
                  </CardContent>
                </Card>
                <Card className="card-maritime-hero">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-purple-600">{stats.roleCount.kranfuehrer}</div>
                    <p className="text-[10px] text-muted-foreground">Kranführer</p>
                  </CardContent>
                </Card>
                <Card className="col-span-2 card-maritime-hero">
                  <CardContent className="pt-3 pb-2">
                    <div className="text-lg font-bold text-red-600">{stats.roleCount.admin}</div>
                    <p className="text-[10px] text-muted-foreground">Admins</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card className="card-maritime-hero">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-primary">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card className="card-maritime-hero">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-green-600">{stats.active}</div>
            <p className="text-[10px] text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card className="card-maritime-hero">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-blue-600">{stats.roleCount.mitglied}</div>
            <p className="text-[10px] text-muted-foreground">Mitglieder</p>
          </CardContent>
        </Card>
        <Card className="card-maritime-hero">
          <CardContent className="pt-3 pb-2">
             <div className="text-lg font-bold text-purple-600">{stats.roleCount.kranfuehrer}</div>
             <p className="text-[10px] text-muted-foreground">Kranführer</p>
          </CardContent>
        </Card>
        <Card className="card-maritime-hero">
          <CardContent className="pt-3 pb-2">
            <div className="text-lg font-bold text-red-600">{stats.roleCount.admin}</div>
            <p className="text-[10px] text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
