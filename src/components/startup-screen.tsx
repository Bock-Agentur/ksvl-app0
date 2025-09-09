import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Anchor } from 'lucide-react';

interface StartupScreenProps {
  isVisible: boolean;
  onComplete: () => void;
  settings: {
    duration: number;
    text: string;
    backgroundType: 'gradient' | 'solid';
    backgroundGradient: string;
    backgroundColor: string;
    enterAnimation: string;
    exitAnimation: string;
    mainPageAnimation: string;
    iconAnimation: string;
    textAnimation: string;
    containerAnimation: string;
    backgroundAnimation: string;
    animationSpeed: number;
    animationEasing: string;
    enterDuration: number;
    exitDuration: number;
    mainPageDuration: number;
    iconDelay: number;
    textDelay: number;
    elementStagger: number;
    parallaxEffect: boolean;
    blurEffect: boolean;
    glowEffect: boolean;
    shadowIntensity: number;
    rotationEffect: boolean;
    scaleEffect: boolean;
    smoothTransitions: boolean;
    hardwareAcceleration: boolean;
    reducedMotion: boolean;
  };
}

export function StartupScreen({ isVisible, onComplete, settings }: StartupScreenProps) {
  const [phase, setPhase] = useState<'hidden' | 'loading' | 'entering' | 'showing' | 'exiting'>('hidden');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // First, set loading state and wait for next frame to ensure DOM is ready
      setPhase('loading');
      
      // Use requestAnimationFrame to ensure smooth animation start
      const animationFrame = requestAnimationFrame(() => {
        // Small delay to prevent flickering and ensure CSS is loaded
        const readyTimeout = setTimeout(() => {
          setIsReady(true);
          setPhase('entering');
          
          // After entrance animation, show content
          const showTimeout = setTimeout(() => {
            setPhase('showing');
            
            // After display duration, start exit
            const exitTimeout = setTimeout(() => {
              // Set body back to white before exit animation
              document.body.style.backgroundColor = 'white';
              setPhase('exiting');
              
              // After exit animation, complete with main page animation
              const completeTimeout = setTimeout(() => {
                // Trigger main page animation
                document.body.classList.add('startup-complete');
                onComplete();
              }, settings.exitDuration / settings.animationSpeed);
              
              return () => clearTimeout(completeTimeout);
            }, settings.duration);
            
            return () => clearTimeout(exitTimeout);
          }, settings.enterDuration / settings.animationSpeed);
          
          return () => clearTimeout(showTimeout);
        }, 50); // Small delay to prevent flicker
        
        return () => clearTimeout(readyTimeout);
      });
      
      return () => cancelAnimationFrame(animationFrame);
    } else {
      setIsReady(false);
      setPhase('hidden');
    }
  }, [isVisible, settings.duration, settings.enterDuration, settings.exitDuration, settings.animationSpeed, onComplete]);

  if (!isVisible && phase === 'hidden') return null;

  const getScreenAnimationClass = () => {
    const getEnterClass = () => {
      switch (settings.enterAnimation) {
        case 'slide-up': return 'translate-y-full';
        case 'slide-down': return '-translate-y-full';
        case 'slide-left': return 'translate-x-full';
        case 'slide-right': return '-translate-x-full';
        case 'fade': return 'opacity-0';
        case 'scale': return 'scale-50 opacity-0';
        case 'scale-rotate': return 'scale-50 rotate-180 opacity-0';
        case 'flip-x': return 'rotate-x-90 opacity-0';
        case 'flip-y': return 'rotate-y-90 opacity-0';
        case 'zoom-in': return 'scale-0 opacity-0';
        case 'spiral-in': return 'scale-50 rotate-[720deg] opacity-0';
        case 'elastic-in': return 'scale-75 opacity-0';
        case 'bounce-in': return 'scale-125 opacity-0';
        case 'roll-in': return 'translate-x-full rotate-180 opacity-0';
        case 'unfold': return 'scale-y-0 opacity-0';
        default: return 'translate-y-full';
      }
    };

    const getExitClass = () => {
      switch (settings.exitAnimation) {
        case 'slide-up': return '-translate-y-full';
        case 'slide-down': return 'translate-y-full';
        case 'slide-left': return '-translate-x-full';
        case 'slide-right': return 'translate-x-full';
        case 'fade': return 'opacity-0';
        case 'scale': return 'scale-150 opacity-0';
        case 'scale-rotate': return 'scale-150 rotate-180 opacity-0';
        case 'flip-x': return 'rotate-x-90 opacity-0';
        case 'flip-y': return 'rotate-y-90 opacity-0';
        case 'zoom-out': return 'scale-[3] opacity-0';
        case 'spiral-out': return 'scale-150 rotate-[-720deg] opacity-0';
        case 'elastic-out': return 'scale-125 opacity-0';
        case 'bounce-out': return 'scale-75 opacity-0';
        case 'roll-out': return '-translate-x-full rotate-180 opacity-0';
        case 'fold': return 'scale-y-0 opacity-0';
        default: return '-translate-y-full';
      }
    };

    if (phase === 'loading') return `${getEnterClass()} opacity-0`;
    if (phase === 'entering') return isReady ? 'translate-y-0 scale-100 opacity-100' : `${getEnterClass()} opacity-0`;
    if (phase === 'exiting') return getExitClass();
    return 'translate-y-0 scale-100 opacity-100';
  };

  const getIconAnimationClass = () => {
    if (phase !== 'showing') return '';
    
    switch (settings.iconAnimation) {
      case 'bounce': return 'animate-bounce';
      case 'pulse': return 'animate-pulse';
      case 'spin': return 'animate-spin';
      case 'ping': return 'animate-ping';
      case 'wiggle': return 'wiggle';
      case 'glow-pulse': return 'glow-pulse';
      case 'float': return 'float';
      case 'shake': return 'shake';
      case 'breathe': return 'breathe';
      case 'orbit': return 'orbit';
      case 'morph': return 'morph';
      default: return 'pulse-glow';
    }
  };

  const getTextAnimationClass = () => {
    if (phase !== 'showing') return '';
    
    switch (settings.textAnimation) {
      case 'bounce': return 'animate-bounce';
      case 'pulse': return 'animate-pulse';
      case 'fade': return 'animate-fade-in';
      case 'slide-up': return 'slide-up';
      case 'scale': return 'scale-up';
      case 'wiggle': return 'wiggle';
      case 'typewriter': return 'typewriter';
      case 'glitch': return 'glitch';
      case 'neon-flicker': return 'neon-flicker';
      case 'wave-text': return 'wave-text';
      case 'letter-dance': return 'letter-dance';
      case 'glow-text': return 'glow-text';
      default: return 'slide-up';
    }
  };

  const getContainerAnimationClass = () => {
    if (phase !== 'showing') return '';
    
    switch (settings.containerAnimation) {
      case 'none': return '';
      case 'scale-in': return 'scale-in';
      case 'rotate-in': return 'rotate-in';
      case 'float': return 'float';
      case 'breathe': return 'breathe';
      case 'elastic': return 'elastic';
      case 'magnetic': return 'magnetic';
      default: return 'scale-in';
    }
  };

  const getBackgroundStyle = () => {
    if (settings.backgroundType === 'gradient') {
      switch (settings.backgroundGradient) {
        case 'navy-pink':
          return 'bg-gradient-to-br from-trendy-navy to-trendy-pink';
        case 'cyan-green':
          return 'bg-gradient-to-br from-trendy-cyan to-trendy-green';
        case 'pink-cyan':
          return 'bg-gradient-to-br from-trendy-pink to-trendy-cyan';
        case 'navy-cyan':
          return 'bg-gradient-to-br from-trendy-navy to-trendy-cyan';
        case 'maritime-sunset':
          return 'bg-gradient-maritime-sunset';
        case 'ocean-breeze':
          return 'bg-gradient-ocean-breeze';
        default:
          return 'bg-gradient-to-br from-trendy-navy to-trendy-pink';
      }
    } else {
      switch (settings.backgroundColor) {
        case 'trendy-navy':
          return 'bg-trendy-navy';
        case 'trendy-pink':
          return 'bg-trendy-pink';
        case 'trendy-cyan':
          return 'bg-trendy-cyan';
        case 'trendy-green':
          return 'bg-trendy-green';
        case 'primary':
          return 'bg-primary';
        default:
          return 'bg-trendy-navy';
      }
    }
  };

  const getTransitionStyle = () => {
    const duration = phase === 'entering' 
      ? settings.enterDuration / settings.animationSpeed
      : settings.exitDuration / settings.animationSpeed;
    
    const baseStyle = {
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: settings.animationEasing
    };

    // Add performance optimizations
    if (settings.hardwareAcceleration) {
      baseStyle['transform'] = baseStyle['transform'] || '';
      baseStyle['willChange'] = 'transform, opacity';
    }

    return baseStyle;
  };

  const getEffectStyles = () => {
    const styles = {};
    
    if (settings.blurEffect && phase === 'entering') {
      styles['filter'] = 'blur(10px)';
    }
    
    if (settings.glowEffect) {
      styles['filter'] = (styles['filter'] || '') + ` drop-shadow(0 0 ${settings.shadowIntensity * 20}px hsl(var(--primary) / ${settings.shadowIntensity}))`;
    }
    
    if (settings.reducedMotion) {
      styles['animation'] = 'none';
      styles['transition'] = 'opacity 0.3s ease';
    }
    
    return styles;
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center transition-all",
          getBackgroundStyle(),
          getScreenAnimationClass()
        )}
        style={getTransitionStyle()}
      >
        <div className={cn("flex flex-col items-center space-y-8", getContainerAnimationClass())}
             style={{
               animationDelay: `${settings.elementStagger}ms`,
               ...getEffectStyles()
             }}>
          {/* Icon */}
          <div className={cn("text-white transition-all", getIconAnimationClass())}
               style={{ 
                 animationDuration: `${1000 / settings.animationSpeed}ms`,
                 animationDelay: `${settings.iconDelay}ms`,
                 transform: settings.rotationEffect ? 'rotate(360deg)' : '',
                 scale: settings.scaleEffect ? '1.1' : '1'
               }}>
            <Anchor size={80} strokeWidth={1.5} />
          </div>
          
          {/* Text */}
          <div className={cn("text-center transition-all", getTextAnimationClass())}
               style={{ 
                 animationDuration: `${800 / settings.animationSpeed}ms`,
                 animationDelay: `${settings.textDelay}ms`
               }}>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wide">
              {settings.text}
            </h1>
          </div>
        </div>
      </div>
      
      {/* Main Page Animation Styles */}
      <style>{`
        body.startup-complete {
          animation: ${settings.mainPageAnimation} ${settings.mainPageDuration / settings.animationSpeed}ms ${settings.animationEasing};
        }
        
        ${settings.reducedMotion ? `
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        ` : ''}
      `}</style>
    </>
  );
}