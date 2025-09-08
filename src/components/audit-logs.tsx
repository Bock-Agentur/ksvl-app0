import { useState } from "react";
import { Calendar, Clock, User, Edit, Plus, Trash2, UserCheck, Filter, Search, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AuditLogEntry, UserRole } from "@/types";
import { SearchableList, StandardStats } from "@/components/common/searchable-list";
import { useSearchFilter, useCommonFilters } from "@/hooks/use-search-filter";
import { getRoleLabel } from "@/lib/business-logic";

// Custom search function for nested properties  
const searchAuditLogs = (logs: AuditLogEntry[], searchTerm: string) => {
  if (!searchTerm) return logs;
  
  const lowerTerm = searchTerm.toLowerCase();
  return logs.filter(log => 
    log.description.toLowerCase().includes(lowerTerm) ||
    log.actor.name.toLowerCase().includes(lowerTerm) ||
    (log.details.member && log.details.member.toLowerCase().includes(lowerTerm))
  );
};

// Mock audit log data
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "log1",
    timestamp: new Date("2024-01-15T14:30:00"),
    action: "slot_created",
    actor: { id: "admin1", name: "Max Mustermann", role: "admin" },
    details: {
      slotDate: "2024-01-20",
      slotTime: "09:00",
      craneOperator: "Anna Schmidt"
    },
    description: "Neuer Slot erstellt für 20.01.2024 um 09:00 mit Kranführer Anna Schmidt"
  },
  {
    id: "log2",
    timestamp: new Date("2024-01-15T15:45:00"),
    action: "slot_booked",
    actor: { id: "member1", name: "Peter Fischer", role: "mitglied" },
    target: { type: "slot", id: "slot1", name: "Slot 20.01.2024 09:00" },
    details: {
      slotDate: "2024-01-20",
      slotTime: "09:00",
      member: "Peter Fischer (M-001)"
    },
    description: "Slot gebucht für 20.01.2024 um 09:00 von Peter Fischer"
  },
  {
    id: "log3",
    timestamp: new Date("2024-01-15T16:20:00"),
    action: "slot_updated",
    actor: { id: "admin1", name: "Max Mustermann", role: "admin" },
    target: { type: "slot", id: "slot2", name: "Slot 22.01.2024 14:00" },
    details: {
      slotDate: "2024-01-22",
      slotTime: "14:00",
      changes: {
        time: { from: "14:00", to: "15:00" },
        duration: { from: 60, to: 90 }
      }
    },
    description: "Slot-Zeit geändert von 14:00 auf 15:00, Dauer von 60 auf 90 Minuten"
  },
  {
    id: "log4",
    timestamp: new Date("2024-01-14T10:15:00"),
    action: "slot_cancelled",
    actor: { id: "member2", name: "Maria Huber", role: "mitglied" },
    target: { type: "slot", id: "slot3", name: "Slot 18.01.2024 11:00" },
    details: {
      slotDate: "2024-01-18",
      slotTime: "11:00",
      member: "Maria Huber (M-002)"
    },
    description: "Buchung storniert für 18.01.2024 um 11:00 von Maria Huber"
  },
  {
    id: "log5",
    timestamp: new Date("2024-01-13T09:00:00"),
    action: "slot_deleted",
    actor: { id: "admin2", name: "Thomas Weber", role: "admin" },
    details: {
      slotDate: "2024-01-25",
      slotTime: "16:00",
      craneOperator: "Max Mustermann"
    },
    description: "Slot gelöscht für 25.01.2024 um 16:00 (Kranführer: Max Mustermann)"
  }
];

const actionLabels: Record<AuditLogEntry["action"], string> = {
  slot_created: "Slot erstellt",
  slot_updated: "Slot geändert", 
  slot_deleted: "Slot gelöscht",
  slot_booked: "Slot gebucht",
  slot_cancelled: "Buchung storniert"
};

const actionColors: Record<AuditLogEntry["action"], string> = {
  slot_created: "bg-action-created-bg text-action-created-foreground",
  slot_updated: "bg-action-updated-bg text-action-updated-foreground", 
  slot_deleted: "bg-action-deleted-bg text-action-deleted-foreground",
  slot_booked: "bg-action-booked-bg text-action-booked-foreground",
  slot_cancelled: "bg-action-cancelled-bg text-action-cancelled-foreground"
};

const roleLabels: Record<AuditLogEntry["actor"]["role"], string> = {
  mitglied: "Mitglied",
  kranfuehrer: "Kranführer",
  admin: "Administrator"
};

export function AuditLogs() {
  const [logs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Custom filtering for nested properties
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm ? searchAuditLogs([log], searchTerm).length > 0 : true;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesRole = roleFilter === "all" || log.actor.role === roleFilter;
    return matchesSearch && matchesAction && matchesRole;
  });

  const toggleLogDetails = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionIcon = (action: AuditLogEntry["action"]) => {
    switch (action) {
      case "slot_created":
        return <Plus className="h-4 w-4" />;
      case "slot_updated":
        return <Edit className="h-4 w-4" />;
      case "slot_deleted":
        return <Trash2 className="h-4 w-4" />;
      case "slot_booked":
        return <UserCheck className="h-4 w-4" />;
      case "slot_cancelled":
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Aktivitätsprotokoll</h1>
        <p className="text-muted-foreground">
          Übersicht aller Slot-Aktivitäten und Buchungsänderungen
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nach Aktivität, Person oder Mitglied suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label>Aktion</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Aktionen</SelectItem>
                  <SelectItem value="slot_created">Slot erstellt</SelectItem>
                  <SelectItem value="slot_updated">Slot geändert</SelectItem>
                  <SelectItem value="slot_deleted">Slot gelöscht</SelectItem>
                  <SelectItem value="slot_booked">Slot gebucht</SelectItem>
                  <SelectItem value="slot_cancelled">Buchung storniert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:w-48">
              <Label>Rolle</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="kranfuehrer">Kranführer</SelectItem>
                  <SelectItem value="mitglied">Mitglied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-xs text-muted-foreground">Gesamt Einträge</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {filteredLogs.filter(log => log.action.includes("created")).length}
            </div>
            <p className="text-xs text-muted-foreground">Slots erstellt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {filteredLogs.filter(log => log.action === "slot_booked").length}
            </div>
            <p className="text-xs text-muted-foreground">Buchungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {filteredLogs.filter(log => log.action.includes("updated")).length}
            </div>
            <p className="text-xs text-muted-foreground">Änderungen</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Einträge gefunden.</p>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Versuche einen anderen Suchbegriff oder entferne die Filter.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
          <Card key={log.id} className="overflow-hidden">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleLogDetails(log.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${actionColors[log.action]}`}>
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={actionColors[log.action]}>
                          {actionLabels[log.action]}
                        </Badge>
                        <Badge variant="outline">
                          {getRoleLabel(log.actor.role)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(log.timestamp, "dd.MM.yyyy HH:mm")}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium mb-1">
                        {log.description}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        von {log.actor.name}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedLogs.has(log.id) ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {log.details.slotDate && (
                        <div>
                          <span className="font-medium">Datum:</span> {log.details.slotDate}
                        </div>
                      )}
                      {log.details.slotTime && (
                        <div>
                          <span className="font-medium">Zeit:</span> {log.details.slotTime}
                        </div>
                      )}
                      {log.details.craneOperator && (
                        <div>
                          <span className="font-medium">Kranführer:</span> {log.details.craneOperator}
                        </div>
                      )}
                      {log.details.member && (
                        <div>
                          <span className="font-medium">Mitglied:</span> {log.details.member}
                        </div>
                      )}
                    </div>
                    
                    {log.details.changes && (
                      <div className="mt-3">
                        <span className="font-medium">Änderungen:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(log.details.changes).map(([field, change]) => (
                            <div key={field} className="text-xs bg-background p-2 rounded">
                              <span className="font-medium">{field}:</span> 
                              <span className="text-action-deleted"> {change.from}</span> → 
                              <span className="text-action-created"> {change.to}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
          ))
        )}
      </div>
    </div>
  );
}