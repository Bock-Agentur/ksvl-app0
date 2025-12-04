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

/**
 * AnimatedPage - CSS-only Animation für sanfte Seitenübergänge
 * 
 * KRITISCH: Verwendet animation-fill-mode: both, was garantiert:
 * - VOR der Animation: opacity: 0 (aus den Keyframes)
 * - NACH der Animation: opacity: 1 (aus den Keyframes)
 * 
 * Dadurch gibt es keinen "Flash" des Contents vor der Animation,
 * da der Browser den initialen Keyframe-State sofort anwendet.
 */
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const { settings, isLoading } = usePageTransitionSettings();

  // Defaults verwenden während Settings laden - KEIN Warten auf DB
  const effectiveSettings = isLoading ? DEFAULT_SETTINGS : settings;
  const shouldAnimate = effectiveSettings.enabled && effectiveSettings.effect !== 'none';

  const animationStyle = useMemo((): React.CSSProperties => {
    // Wenn nicht animiert, sofort sichtbar ohne Animation
    if (!shouldAnimate) {
      return { opacity: 1 };
    }

    const keyframeName = getKeyframeName(effectiveSettings.effect);

    // CSS-only Animation:
    // - animation-fill-mode: both wendet den ERSTEN Keyframe (opacity: 0) sofort an
    // - Dadurch ist der Content GARANTIERT unsichtbar vor dem ersten Paint
    // - Die Animation startet dann sauber von opacity: 0 zu opacity: 1
    return {
      animationName: keyframeName,
      animationDuration: `${effectiveSettings.duration}ms`,
      animationTimingFunction: effectiveSettings.easing,
      animationFillMode: 'both', // KRITISCH: Wendet Start- UND End-Keyframe an
      '--translate-distance': `${effectiveSettings.translateDistance}px`,
    } as React.CSSProperties;
  }, [shouldAnimate, effectiveSettings]);

  return (
    <div className={cn(className)} style={animationStyle}>
      {children}
    </div>
  );
}
