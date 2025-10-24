import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll sofort nach oben
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Zusätzlich document.documentElement für alle Browser
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
