import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import defaultAvatar from "@/assets/default-avatar.png";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useRole } from "@/hooks/use-role";
import { generateAutomaticHeadline } from "@/lib/headline-generator";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  userName?: string;
  userImage?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  currentUser?: any;
  stats?: any;
  currentRole?: any;
  onNavigate?: any;
}

export function DashboardHeader({ 
  userName,
  userImage,
  onSearch,
  showSearch = true,
  currentUser
}: DashboardHeaderProps) {
  const { currentRole } = useRole();
  const { settings } = useDashboardSettings(currentRole, false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [headline, setHeadline] = useState<string>("");

  // Generate headline on mount and when settings change
  useEffect(() => {
    if (settings.headlineMode === "manual" && settings.customHeadline) {
      setHeadline(settings.customHeadline);
    } else {
      setHeadline(generateAutomaticHeadline());
    }
  }, [settings.headlineMode, settings.customHeadline]);

  const displayName = userName || (currentUser as any)?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "User";
  const displayImage = userImage || (currentUser as any)?.user_metadata?.avatar_url;

  return (
    <div className="bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white pt-12 pb-8 px-[15px] rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)]">
      {/* Header mit Profilbild, Name und Glocke */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Profilbild */}
          <Avatar className="w-12 h-12 ring-2 ring-white/20">
            <AvatarImage src={displayImage || defaultAvatar} alt={displayName} />
            <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Name mit Begrüßung */}
          <div>
            <p className="text-base text-white font-normal">Hai, {displayName}!</p>
          </div>
        </div>
        
        {/* Notification Bell */}
        <Button 
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
        >
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      {/* Weiße fette Headline */}
      <h1 className="text-white text-3xl font-bold mb-6 whitespace-pre-line">
        {headline}
      </h1>

      {/* Suchleiste mit Lupe */}
      {showSearch && (
        <div className="relative">
          <Input
            type="text"
            placeholder="Search your sailing destination!"
            className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/95 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg border-0"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      )}
    </div>
  );
}
