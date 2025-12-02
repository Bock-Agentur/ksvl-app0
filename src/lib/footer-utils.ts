import { Settings, Palette, TestTube, Users, Calendar, FileText, Layers, FolderOpen, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { UserRole } from "@/types";
import { QueryClient } from "@tanstack/react-query";

/**
 * Icon mapping for dynamic footer menu items
 */
export const FOOTER_ICON_MAP = {
  Palette,
  TestTube,
  Users,
  Calendar,
  FileText,
  Settings,
  Layers,
  FolderOpen,
  LogOut
} as const;

/**
 * Role colors for badge styling
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  gastmitglied: "bg-muted text-muted-foreground",
  mitglied: "bg-accent text-accent-foreground",
  kranfuehrer: "bg-gradient-ocean text-primary-foreground",
  admin: "bg-gradient-deep text-primary-foreground",
  vorstand: "bg-gradient-deep text-primary-foreground"
};

/**
 * Handle user logout with navigation and cache clearing
 */
export async function handleFooterLogout(
  navigate: (path: string) => void,
  queryClient?: QueryClient
): Promise<void> {
  try {
    // ✅ Clear all caches BEFORE signOut to prevent stale data
    if (queryClient) {
      queryClient.clear();
    }
    
    await supabase.auth.signOut();
    toast.success("Erfolgreich abgemeldet");
    navigate('/auth');
  } catch (error) {
    logger.error('AUTH', 'Logout error', error);
    toast.error("Fehler beim Abmelden");
  }
}
