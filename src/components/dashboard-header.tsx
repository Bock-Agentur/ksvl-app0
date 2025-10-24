import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import defaultAvatar from "@/assets/default-avatar.png";

interface DashboardHeaderProps {
  userName?: string;
  userImage?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export function DashboardHeader({ 
  userName = "User",
  userImage,
  onSearch,
  showSearch = true
}: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white pt-12 pb-8 px-[15px] rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)]">
      {/* White Headline */}
      <h2 className="text-white text-2xl font-bold mb-6">Dashboard</h2>
      
      {/* Header mit Profilbild und Glocke */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {/* Profilbild */}
          <Avatar className="w-12 h-12 ring-2 ring-white/20">
            <AvatarImage src={userImage || defaultAvatar} alt={userName} />
            <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Begrüßung */}
          <div>
            <p className="text-sm text-white/80">{getGreeting()}</p>
            <h1 className="text-xl font-bold">{userName}</h1>
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

      {/* Suchleiste */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Suche..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/95 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg border-0"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
