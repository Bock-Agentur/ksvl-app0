/**
 * Dashboard Animations Hook
 * Handles different animation types for dashboard components
 */

import { useEffect, useState } from "react";
import { useDashboardSettings } from "./use-dashboard-settings";
import { useRole } from "./use-role";

export type AnimationState = "hidden" | "animating" | "visible";

export function useDashboardAnimations() {
  const { currentRole } = useRole();
  const { settings } = useDashboardSettings(currentRole, false);
  const [animationStates, setAnimationStates] = useState<Record<string, AnimationState>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize animation states
  useEffect(() => {
    if (!settings.animationEnabled || settings.animationType === "none") {
      setAnimationStates({});
      setIsInitialized(true);
      return;
    }

    // Reset all states to hidden
    const initialStates: Record<string, AnimationState> = {
      headerCard: "hidden",
      welcome: "hidden",
      stats: "hidden",
      widgets: "hidden",
      quickActions: "hidden",
      activityFeed: "hidden"
    };

    setAnimationStates(initialStates);

    // Start animations after a brief delay
    const timer = setTimeout(() => {
      startAnimationSequence();
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [settings.animationEnabled, settings.animationType]);

  const startAnimationSequence = () => {
    const { animationType } = settings;
    
    switch (animationType) {
      case "fadeIn":
        startFadeInAnimation();
        break;
      case "dropDown":
        startDropDownAnimation();
        break;
      case "scrollReveal":
        startScrollRevealAnimation();
        break;
      case "slideFromSides":
        startSlideFromSidesAnimation();
        break;
      case "staggered":
        startStaggeredAnimation();
        break;
      case "bounce":
        startBounceAnimation();
        break;
      default:
        // Show all immediately
        setAnimationStates({
          headerCard: "visible",
          welcome: "visible",
          stats: "visible",
          widgets: "visible",
          quickActions: "visible",
          activityFeed: "visible"
        });
    }
  };

  const startFadeInAnimation = () => {
    const sections = ["headerCard", "welcome", "stats", "widgets", "quickActions", "activityFeed"];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, [section]: "visible" }));
      }, index * 800);
    });
  };

  const startDropDownAnimation = () => {
    const sections = ["headerCard", "welcome", "stats", "widgets", "quickActions", "activityFeed"];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, [section]: "animating" }));
        setTimeout(() => {
          setAnimationStates(prev => ({ ...prev, [section]: "visible" }));
        }, 300);
      }, index * 1000);
    });
  };

  const startScrollRevealAnimation = () => {
    // For scroll reveal, we'll show elements immediately but with scroll-based classes
    setAnimationStates({
      headerCard: "visible",
      welcome: "visible",
      stats: "visible", 
      widgets: "visible",
      quickActions: "visible",
      activityFeed: "visible"
    });
  };

  const startSlideFromSidesAnimation = () => {
    const sections = ["headerCard", "welcome", "stats", "widgets", "quickActions", "activityFeed"];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, [section]: "animating" }));
        setTimeout(() => {
          setAnimationStates(prev => ({ ...prev, [section]: "visible" }));
        }, 300);
      }, index * 800);
    });
  };

  const startStaggeredAnimation = () => {
    const sections = ["headerCard", "welcome", "stats", "widgets", "quickActions", "activityFeed"];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, [section]: "visible" }));
      }, index * 600 + Math.random() * 300); // Add some randomness
    });
  };

  const startBounceAnimation = () => {
    const sections = ["headerCard", "welcome", "stats", "widgets", "quickActions", "activityFeed"];
    sections.forEach((section, index) => {
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, [section]: "animating" }));
        setTimeout(() => {
          setAnimationStates(prev => ({ ...prev, [section]: "visible" }));
        }, 500);
      }, index * 800);
    });
  };

  const getAnimationClass = (sectionId: string): string => {
    if (!settings.animationEnabled || settings.animationType === "none") {
      return "";
    }

    const state = animationStates[sectionId];
    const { animationType } = settings;

    if (state === "hidden") {
      switch (animationType) {
        case "fadeIn":
          return "opacity-0 translate-y-4 transition-all duration-[1500ms] ease-out";
        case "dropDown":
          return "opacity-0 -translate-y-8 transition-all duration-[1500ms] ease-out";
        case "scrollReveal":
          return "opacity-0 translate-y-8 transition-all duration-[2000ms] ease-out";
        case "slideFromSides":
          const isEven = sectionId === "stats" || sectionId === "quickActions";
          return `opacity-0 ${isEven ? "translate-x-8" : "-translate-x-8"} transition-all duration-[1800ms] ease-out`;
        case "staggered":
          return "opacity-0 translate-y-6 scale-95 transition-all duration-[1200ms] ease-out";
        case "bounce":
          return "opacity-0 translate-y-4 scale-90 transition-all duration-[1500ms] ease-out";
        default:
          return "";
      }
    }

    if (state === "animating") {
      switch (animationType) {
        case "dropDown":
          return "opacity-100 translate-y-0 animate-bounce transition-all duration-[1500ms] ease-out";
        case "slideFromSides":
          return "opacity-100 translate-x-0 transition-all duration-[1800ms] ease-out";
        case "bounce":
          return "opacity-100 translate-y-0 scale-100 animate-bounce transition-all duration-[1500ms] ease-out";
        default:
          return "opacity-100 translate-y-0 translate-x-0 scale-100 transition-all duration-[1500ms] ease-out";
      }
    }

    // state === "visible"
    return "opacity-100 translate-y-0 translate-x-0 scale-100 transition-all duration-[1500ms] ease-out";
  };

  const getCardAnimationClass = (index: number, sectionId: string): string => {
    if (!settings.animationEnabled || settings.animationType === "none") {
      return "";
    }

    const state = animationStates[sectionId];
    if (state !== "visible") return "opacity-0";

    switch (settings.animationType) {
      case "staggered":
        return `opacity-100 animate-fade-in` + (index > 0 ? ` delay-[${index * 100}ms]` : "");
      case "scrollReveal":
        return "opacity-100 scroll-reveal";
      default:
        return "opacity-100";
    }
  };

  return {
    getAnimationClass,
    getCardAnimationClass,
    isAnimationEnabled: settings.animationEnabled && settings.animationType !== "none",
    animationType: settings.animationType,
    isInitialized
  };
}