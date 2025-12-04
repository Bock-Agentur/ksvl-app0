import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageTransitionSettings } from "@/hooks/core/settings/use-page-transition-settings";

interface PageLoaderProps {
  className?: string;
  isExiting?: boolean;
}

export function PageLoader({ className, isExiting }: PageLoaderProps) {
  const { settings, isLoading: settingsLoading } = usePageTransitionSettings();

  // Get dynamic animation style based on settings
  const getAnimationStyle = (): React.CSSProperties => {
    // Use defaults if settings still loading
    const duration = settingsLoading ? 200 : settings.loaderFadeOutDuration;
    const easing = settingsLoading ? 'ease-out' : settings.easing;
    const enabled = settingsLoading ? true : settings.enabled;

    if (!enabled) {
      return { opacity: isExiting ? 0 : 1 };
    }

    return {
      animationName: isExiting ? 'loader-fade-out' : 'loader-fade-in',
      animationDuration: `${duration}ms`,
      animationTimingFunction: easing,
      animationFillMode: 'forwards',
    };
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background",
        className
      )}
      style={getAnimationStyle()}
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
