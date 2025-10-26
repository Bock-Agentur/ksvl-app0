import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface HistoryEntry {
  status?: string;
  position?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  changedBy?: string;
}

interface UserHistoryTimelineProps {
  membershipHistory?: HistoryEntry[];
  boardHistory?: HistoryEntry[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  modifiedBy?: string;
}

export function UserHistoryTimeline({
  membershipHistory = [],
  boardHistory = [],
  createdAt,
  createdBy,
  updatedAt,
  modifiedBy
}: UserHistoryTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗂️ Historie & Verwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mitgliedsstatus Historie */}
        {membershipHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Mitgliedsstatus Historie</h4>
            <div className="space-y-3">
              {membershipHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entry.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    {entry.changedBy && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Geändert von: {entry.changedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vorstands Historie */}
        {boardHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Vorstands Historie</h4>
            <div className="space-y-3">
              {boardHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entry.position}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.startDate && new Date(entry.startDate).toLocaleDateString('de-DE')}
                        {entry.endDate && ` - ${new Date(entry.endDate).toLocaleDateString('de-DE')}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Erstellt / Geändert Info */}
        <div className="pt-3 border-t space-y-2">
          {createdAt && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Erstellt am:</span>
              <span>{new Date(createdAt).toLocaleString('de-DE')}</span>
            </div>
          )}
          {createdBy && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Erstellt von:</span>
              <span>{createdBy}</span>
            </div>
          )}
          {updatedAt && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Geändert am:</span>
              <span>{new Date(updatedAt).toLocaleString('de-DE')}</span>
            </div>
          )}
          {modifiedBy && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Geändert von:</span>
              <span>{modifiedBy}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
