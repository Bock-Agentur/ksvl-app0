import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsSectionLoaderProps {
  isLoading: boolean;
  title: string;
  children: ReactNode;
}

export function SettingsSectionLoader({ isLoading, title, children }: SettingsSectionLoaderProps) {
  if (isLoading) {
    return (
      <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
