import { ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePageTransitionSettings } from "@/hooks/core/settings/use-page-transition-settings";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const { settings, isLoading } = usePageTransitionSettings();

  const animationStyle = useMemo((): React.CSSProperties => {
    // Don't animate while loading settings or if disabled
    if (isLoading || !settings.enabled || settings.effect === 'none') {
      return {};
    }

    const keyframeName = settings.effect === 'fade' ? 'page-fade' 
      : settings.effect === 'slide-up' ? 'page-slide-up'
      : settings.effect === 'slide-down' ? 'page-slide-down'
      : settings.effect === 'scale' ? 'page-scale'
      : settings.effect === 'fade-slide' ? 'page-fade-slide'
      : 'none';

    if (keyframeName === 'none') return {};

    return {
      animationName: keyframeName,
      animationDuration: `${settings.duration}ms`,
      animationTimingFunction: settings.easing,
      animationFillMode: 'forwards',
      '--translate-distance': `${settings.translateDistance}px`,
    } as React.CSSProperties;
  }, [settings, isLoading]);

  // If animations disabled or loading, render without animation
  if (isLoading || !settings.enabled || settings.effect === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(className)} style={animationStyle}>
      {children}
    </div>
  );
}
