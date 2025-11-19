import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        "animate-fade-in",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Anchor 
          className="h-12 w-12 text-primary animate-pulse" 
          strokeWidth={2}
        />
        <p className="text-lg font-medium text-foreground/80">
          Lade...
        </p>
      </div>
    </div>
  );
}
