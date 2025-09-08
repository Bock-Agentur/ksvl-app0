import { useEffect, useRef, useState, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeProgress?: (progress: number, direction: 'left' | 'right' | null) => void;
}

interface SwipeState {
  isActive: boolean;
  startX: number;
  currentX: number;
  direction: 'left' | 'right' | null;
  isAnimating: boolean;
  progress: number; // 0-1, how far the swipe has progressed
}

const SWIPE_THRESHOLD = 80; // Minimum distance for a completed swipe
const MAX_SWIPE_DISTANCE = 200; // Maximum distance for calculating progress

export function useSwipeNavigation(handlers: SwipeHandlers) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    startX: 0,
    currentX: 0,
    direction: null,
    isAnimating: false,
    progress: 0
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSwipeProgress = useCallback((deltaX: number) => {
    const progress = Math.min(Math.abs(deltaX) / MAX_SWIPE_DISTANCE, 1);
    const direction = deltaX > 0 ? 'right' : 'left';
    
    setSwipeState(prev => ({
      ...prev,
      direction,
      progress
    }));
    
    if (handlers.onSwipeProgress) {
      handlers.onSwipeProgress(progress, direction);
    }
  }, [handlers]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (swipeState.isAnimating) return;
      
      const touch = e.touches[0];
      setSwipeState({
        isActive: true,
        startX: touch.clientX,
        currentX: touch.clientX,
        direction: null,
        isAnimating: false,
        progress: 0
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeState.isActive || swipeState.isAnimating) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      
      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX
      }));
      
      updateSwipeProgress(deltaX);
    };

    const handleTouchEnd = () => {
      if (!swipeState.isActive || swipeState.isAnimating) return;

      const deltaX = swipeState.currentX - swipeState.startX;
      const shouldComplete = Math.abs(deltaX) >= SWIPE_THRESHOLD;

      if (shouldComplete) {
        setSwipeState(prev => ({ ...prev, isAnimating: true }));
        
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
        
        // Reset after animation completes
        setTimeout(() => {
          setSwipeState({
            isActive: false,
            startX: 0,
            currentX: 0,
            direction: null,
            isAnimating: false,
            progress: 0
          });
          
          if (handlers.onSwipeProgress) {
            handlers.onSwipeProgress(0, null);
          }
        }, 300);
      } else {
        // Snap back animation
        setSwipeState(prev => ({ ...prev, isAnimating: true }));
        
        setTimeout(() => {
          setSwipeState({
            isActive: false,
            startX: 0,
            currentX: 0,
            direction: null,
            isAnimating: false,
            progress: 0
          });
          
          if (handlers.onSwipeProgress) {
            handlers.onSwipeProgress(0, null);
          }
        }, 200);
      }
    };

    // Mouse events for desktop
    const handleMouseDown = (e: MouseEvent) => {
      if (swipeState.isAnimating) return;
      
      setSwipeState({
        isActive: true,
        startX: e.clientX,
        currentX: e.clientX,
        direction: null,
        isAnimating: false,
        progress: 0
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!swipeState.isActive || swipeState.isAnimating) return;
      
      const deltaX = e.clientX - swipeState.startX;
      
      setSwipeState(prev => ({
        ...prev,
        currentX: e.clientX
      }));
      
      updateSwipeProgress(deltaX);
    };

    const handleMouseUp = () => {
      if (!swipeState.isActive || swipeState.isAnimating) return;

      const deltaX = swipeState.currentX - swipeState.startX;
      const shouldComplete = Math.abs(deltaX) >= SWIPE_THRESHOLD;

      if (shouldComplete) {
        setSwipeState(prev => ({ ...prev, isAnimating: true }));
        
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
        
        setTimeout(() => {
          setSwipeState({
            isActive: false,
            startX: 0,
            currentX: 0,
            direction: null,
            isAnimating: false,
            progress: 0
          });
          
          if (handlers.onSwipeProgress) {
            handlers.onSwipeProgress(0, null);
          }
        }, 300);
      } else {
        setSwipeState(prev => ({ ...prev, isAnimating: true }));
        
        setTimeout(() => {
          setSwipeState({
            isActive: false,
            startX: 0,
            currentX: 0,
            direction: null,
            isAnimating: false,
            progress: 0
          });
          
          if (handlers.onSwipeProgress) {
            handlers.onSwipeProgress(0, null);
          }
        }, 200);
      }
    };

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [swipeState.isActive, swipeState.startX, swipeState.isAnimating, handlers, updateSwipeProgress]);

  return {
    containerRef,
    swipeState,
    isSwipeActive: swipeState.isActive,
    isAnimating: swipeState.isAnimating,
    swipeDirection: swipeState.direction,
    swipeProgress: swipeState.progress
  };
}