import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        "bg-background backdrop-blur-md",
        "animate-fade-in",
        className
      )}
      style={{
        animation: "fade-in 0.2s ease-out"
      }}
    >
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <Anchor 
          className="h-16 w-16 text-primary animate-pulse" 
          strokeWidth={2.5}
        />
        <p className="text-lg font-medium text-foreground/90">
          Lade...
        </p>
      </div>
    </div>
  );
}
