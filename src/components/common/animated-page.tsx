import { ReactNode, useMemo, useState, useLayoutEffect } from "react";
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
  const [isReady, setIsReady] = useState(false);

  // useLayoutEffect läuft synchron VOR dem Paint
  // Dadurch wird isReady=true gesetzt bevor der Browser malt
  useLayoutEffect(() => {
    setIsReady(true);
  }, []);

  const effectiveSettings = isLoading ? DEFAULT_SETTINGS : settings;
  const shouldAnimate = effectiveSettings.enabled && effectiveSettings.effect !== 'none';

  const animationStyle = useMemo((): React.CSSProperties => {
    // Wenn nicht animiert, sofort sichtbar
    if (!shouldAnimate) {
      return { opacity: 1 };
    }

    const keyframeName = getKeyframeName(effectiveSettings.effect);
    
    // VOR isReady: komplett versteckt (kein Flash möglich)
    if (!isReady) {
      return { opacity: 0 };
    }

    // NACH isReady: Animation startet
    return {
      animationName: keyframeName,
      animationDuration: `${effectiveSettings.duration}ms`,
      animationTimingFunction: effectiveSettings.easing,
      animationFillMode: 'both',
      '--translate-distance': `${effectiveSettings.translateDistance}px`,
    } as React.CSSProperties;
  }, [shouldAnimate, effectiveSettings, isReady]);

  return (
    <div className={cn(className)} style={animationStyle}>
      {children}
    </div>
  );
}
