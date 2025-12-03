/**
 * LazyWidget - Intersection Observer based lazy loading wrapper
 * 
 * Only renders children when the component becomes visible in the viewport.
 * Reduces initial render cost for dashboard widgets below the fold.
 */

import { useState, useEffect, useRef, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyWidgetProps {
  children: ReactNode;
  /** Height of the placeholder skeleton (default: 150px) */
  minHeight?: number;
  /** Root margin for intersection observer (default: "100px") */
  rootMargin?: string;
  /** Unique ID for debugging */
  id?: string;
}

export function LazyWidget({ 
  children, 
  minHeight = 150,
  rootMargin = "100px",
  id 
}: LazyWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is available
    if (!("IntersectionObserver" in window)) {
      // Fallback: render immediately if IO not supported
      setIsVisible(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, keep it loaded (don't unload on scroll away)
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin, // Start loading slightly before visible
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  // Once loaded, always render (prevents re-mounting on scroll)
  if (hasLoaded) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} style={{ minHeight }}>
      {isVisible ? (
        children
      ) : (
        <Card className="animate-pulse">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
