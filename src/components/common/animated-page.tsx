import { ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePageTransitionSettings, type PageTransitionSettings } from "@/hooks/core/settings/use-page-transition-settings";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

// Default settings für sofortige Animation ohne DB-Wartezeit
const DEFAULT_SETTINGS: PageTransitionSettings = {
  enabled: true,
  duration: 300,
  easing: 'ease-out',
  effect: 'fade-slide',
  loaderFadeOutDuration: 200,
  translateDistance: 10,
};

const getKeyframeName = (effect: PageTransitionSettings['effect']): string => {
  switch (effect) {
    case 'fade': return 'page-fade';
    case 'slide-up': return 'page-slide-up';
    case 'slide-down': return 'page-slide-down';
    case 'scale': return 'page-scale';
    case 'fade-slide': return 'page-fade-slide';
    default: return 'none';
  }
};

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const { settings, isLoading } = usePageTransitionSettings();

  const animationStyle = useMemo((): React.CSSProperties => {
    // SOFORT Defaults verwenden, nicht auf DB warten - verhindert Layoutsprünge
    const effectiveSettings = isLoading ? DEFAULT_SETTINGS : settings;
    
    // Wenn disabled oder none, keine Animation aber auch kein Flash
    if (!effectiveSettings.enabled || effectiveSettings.effect === 'none') {
      return { opacity: 1 };
    }

    const keyframeName = getKeyframeName(effectiveSettings.effect);
    if (keyframeName === 'none') {
      return { opacity: 1 };
    }

    return {
      opacity: 0, // Initial opacity: 0 um Flash zu verhindern
      animationName: keyframeName,
      animationDuration: `${effectiveSettings.duration}ms`,
      animationTimingFunction: effectiveSettings.easing,
      animationFillMode: 'forwards',
      '--translate-distance': `${effectiveSettings.translateDistance}px`,
    } as React.CSSProperties;
  }, [settings, isLoading]);

  return (
    <div className={cn(className)} style={animationStyle}>
      {children}
    </div>
  );
}
