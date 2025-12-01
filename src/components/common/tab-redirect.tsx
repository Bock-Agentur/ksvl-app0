/**
 * TabRedirect Component
 * 
 * Handles backward-compatible redirects from old ?tab= URLs to new speaking routes.
 * Runs once on app load to redirect any legacy bookmarked URLs.
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_REDIRECT_MAP: Record<string, string> = {
  'calendar': '/kalender',
  'profile': '/profil',
  'slots': '/slots',
  'dashboard': '/',
  'users': '/mitglieder',
  'settings': '/einstellungen',
};

export function TabRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only process on root path with tab parameter
    if (location.pathname !== '/') return;
    
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    if (tab && TAB_REDIRECT_MAP[tab]) {
      // Preserve any other query params (like date for calendar)
      params.delete('tab');
      const remainingParams = params.toString();
      const newPath = TAB_REDIRECT_MAP[tab] + (remainingParams ? `?${remainingParams}` : '');
      
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  return null;
}
