import { useState, useCallback } from "react";

/**
 * Global footer animation state hook
 * Ensures footer animation only triggers once per browser session
 */
export function useFooterAnimation() {
  const [hasAnimated, setHasAnimated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('footer-animated') === 'true';
  });
  
  const markAsAnimated = useCallback(() => {
    sessionStorage.setItem('footer-animated', 'true');
    setHasAnimated(true);
  }, []);
  
  return { hasAnimated, markAsAnimated };
}
