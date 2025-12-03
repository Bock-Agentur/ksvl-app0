import { useEffect } from "react";
import { useThemeSettings } from "@/hooks";

/**
 * ThemeLoader - Lädt und wendet Theme-Einstellungen beim App-Start an
 * Muss innerhalb von QueryClientProvider eingebettet sein
 */
export function ThemeLoader() {
  const { settings, applyTheme } = useThemeSettings();

  useEffect(() => {
    if (settings && settings.length > 0) {
      applyTheme();
    }
  }, [settings, applyTheme]);

  return null; // Rendert nichts, nur Side-Effect
}
