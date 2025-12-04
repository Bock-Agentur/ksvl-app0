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
  duration: 500,
  easing: 'ease-out',
  effect: 'fade-slide',
  loaderFadeOutDuration: 400,
  translateDistance: 12,
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
    // SOFORT Defaults verwenden, nicht auf DB warten
    const effectiveSettings = isLoading ? DEFAULT_SETTINGS : settings;
    
    // Wenn disabled oder none, sofort sichtbar ohne Animation
    if (!effectiveSettings.enabled || effectiveSettings.effect === 'none') {
      return { opacity: 1 };
    }

    const keyframeName = getKeyframeName(effectiveSettings.effect);
    if (keyframeName === 'none') {
      return { opacity: 1 };
    }

    // animation-fill-mode: both sorgt für:
    // - VOR Animation: opacity aus "from" (0)
    // - NACH Animation: opacity aus "to" (1)
    return {
      animationName: keyframeName,
      animationDuration: `${effectiveSettings.duration}ms`,
      animationTimingFunction: effectiveSettings.easing,
      animationFillMode: 'both',
      '--translate-distance': `${effectiveSettings.translateDistance}px`,
    } as React.CSSProperties;
  }, [settings, isLoading]);

  return (
    <div className={cn(className)} style={animationStyle}>
      {children}
    </div>
  );
}
