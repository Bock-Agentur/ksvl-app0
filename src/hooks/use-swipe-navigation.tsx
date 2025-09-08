import { useEffect, useRef, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeState {
  isActive: boolean;
  startX: number;
  currentX: number;
  direction: 'left' | 'right' | null;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity for a swipe

export function useSwipeNavigation(handlers: SwipeHandlers) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    startX: 0,
    currentX: 0,
    direction: null
  });
  
  const startTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startTimeRef.current = Date.now();
      setSwipeState({
        isActive: true,
        startX: touch.clientX,
        currentX: touch.clientX,
        direction: null
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeState.isActive) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      
      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX,
        direction: deltaX > 0 ? 'right' : 'left'
      }));
    };

    const handleTouchEnd = () => {
      if (!swipeState.isActive) return;

      const endTime = Date.now();
      const deltaTime = endTime - startTimeRef.current;
      const deltaX = swipeState.currentX - swipeState.startX;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Check if swipe meets threshold criteria
      if (Math.abs(deltaX) >= SWIPE_THRESHOLD && velocity >= SWIPE_VELOCITY_THRESHOLD) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }

      setSwipeState({
        isActive: false,
        startX: 0,
        currentX: 0,
        direction: null
      });
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      startTimeRef.current = Date.now();
      setSwipeState({
        isActive: true,
        startX: e.clientX,
        currentX: e.clientX,
        direction: null
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!swipeState.isActive) return;
      
      const deltaX = e.clientX - swipeState.startX;
      
      setSwipeState(prev => ({
        ...prev,
        currentX: e.clientX,
        direction: deltaX > 0 ? 'right' : 'left'
      }));
    };

    const handleMouseUp = () => {
      if (!swipeState.isActive) return;

      const endTime = Date.now();
      const deltaTime = endTime - startTimeRef.current;
      const deltaX = swipeState.currentX - swipeState.startX;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Check if swipe meets threshold criteria
      if (Math.abs(deltaX) >= SWIPE_THRESHOLD && velocity >= SWIPE_VELOCITY_THRESHOLD) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }

      setSwipeState({
        isActive: false,
        startX: 0,
        currentX: 0,
        direction: null
      });
    };

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mouse events for desktop
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
  }, [swipeState.isActive, swipeState.startX, handlers]);

  return {
    containerRef,
    swipeState,
    isSwipeActive: swipeState.isActive
  };
}