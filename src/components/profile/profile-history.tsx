import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserHistoryTimeline } from "@/components/common/user-history-timeline";

interface ProfileHistoryProps {
  membershipHistory: any;
  boardHistory: any;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  modifiedBy?: string;
}

export function ProfileHistory({
  membershipHistory,
  boardHistory,
  createdAt,
  createdBy,
  updatedAt,
  modifiedBy
}: ProfileHistoryProps) {
  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          🗂️ Historie & Verwaltung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UserHistoryTimeline
          membershipHistory={membershipHistory}
          boardHistory={boardHistory}
          createdAt={createdAt}
          createdBy={createdBy}
          updatedAt={updatedAt}
          modifiedBy={modifiedBy}
        />
      </CardContent>
    </Card>
  );
}
