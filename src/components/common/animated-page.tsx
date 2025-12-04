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

const getAnimationClass = (effect: PageTransitionSettings['effect']): string => {
  switch (effect) {
    case 'fade': return 'animate-fade';
    case 'slide-up': return 'animate-slide-up';
    case 'slide-down': return 'animate-slide-down';
    case 'scale': return 'animate-scale';
    case 'fade-slide': return 'animate-fade-slide';
    default: return '';
  }
};

/**
 * AnimatedPage - CSS-Klassen-basierte Animation für sanfte Seitenübergänge
 * 
 * KRITISCH: Verwendet CSS-Klassen statt Inline-Styles!
 * - CSS-Klassen werden VOR dem ersten Browser-Paint angewendet
 * - Inline-Styles können einen Frame verzögert sein → Flash
 * - .animate-page-enter hat opacity: 0 im CSS → garantiert unsichtbar
 * - animation-fill-mode: both im CSS → sauberer Start/End-State
 */
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const { settings, isLoading } = usePageTransitionSettings();

  // Defaults verwenden während Settings laden - KEIN Warten auf DB
  const effectiveSettings = isLoading ? DEFAULT_SETTINGS : settings;
  const shouldAnimate = effectiveSettings.enabled && effectiveSettings.effect !== 'none';

  // CSS-Variablen für dynamische Werte (duration, easing, translateDistance)
  const cssVariables = useMemo((): React.CSSProperties => {
    if (!shouldAnimate) {
      return {};
    }
    return {
      '--translate-distance': `${effectiveSettings.translateDistance}px`,
      animationDuration: `${effectiveSettings.duration}ms`,
      animationTimingFunction: effectiveSettings.easing,
    } as React.CSSProperties;
  }, [shouldAnimate, effectiveSettings]);

  // Wenn keine Animation, direkt sichtbar rendern
  if (!shouldAnimate) {
    return (
      <div className={cn(className)}>
        {children}
      </div>
    );
  }

  // Mit Animation: CSS-Klassen für garantierte opacity: 0 vor erstem Paint
  const animationClass = getAnimationClass(effectiveSettings.effect);

  return (
    <div 
      className={cn(
        "animate-page-enter", // Basis-Klasse: opacity: 0, animation-fill-mode: both
        animationClass,        // Spezifische Animation (fade, slide-up, etc.)
        className
      )} 
      style={cssVariables}
    >
      {children}
    </div>
  );
}
