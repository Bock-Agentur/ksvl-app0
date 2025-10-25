import { Bell, Send, Loader2, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import defaultAvatar from "@/assets/default-avatar.png";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useRole } from "@/hooks/use-role";
import { generateAutomaticHeadline } from "@/lib/headline-generator";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAIWelcomeMessage } from "@/hooks/use-ai-welcome-message";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { enabled: welcomeEnabled, message: welcomeMessage } = useAIWelcomeMessage();
  const [welcomeShown, setWelcomeShown] = useState(false);

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

  // Auto-scroll nur wenn Nachrichten gesendet werden (nicht beim initialen Laden)
  useEffect(() => {
    // Nur scrollen wenn es mehr als die Welcome-Message gibt
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const [displayName, setDisplayName] = useState<string>("");

  // Load first name from profile
  useEffect(() => {
    const loadFirstName = async () => {
      if (!currentUser?.id) {
        setDisplayName("User");
        return;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, name')
        .eq('id', currentUser.id)
        .single();
      
      setDisplayName(
        profileData?.first_name || 
        profileData?.name?.split(' ')[0] || 
        userName?.split(' ')[0] ||
        (currentUser as any)?.user_metadata?.full_name?.split(' ')[0] || 
        currentUser?.email?.split('@')[0] || 
        "User"
      );
    };

    loadFirstName();
  }, [currentUser, userName]);

  // Show welcome message on mount
  useEffect(() => {
    if (welcomeEnabled && welcomeMessage && !welcomeShown && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: welcomeMessage
      }]);
      setWelcomeShown(true);
    }
  }, [welcomeEnabled, welcomeMessage, welcomeShown, messages.length]);

  const displayImage = userImage || (currentUser as any)?.user_metadata?.avatar_url;

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get first name from profile
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, name, email')
        .eq('id', currentUser?.id)
        .single();

      const firstName = profileData?.first_name || 
                       profileData?.name?.split(' ')[0] || 
                       user?.email?.split('@')[0] || 
                       'Segelfreund';

      const { data, error } = await supabase.functions.invoke('harbor-chat', {
        body: { 
          messages: [...messages, userMessage],
          firstName: firstName,
          userRole: currentRole
        }
      });

      if (error) {
        throw error;
      }

      const assistantMessage = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

    } catch (error: any) {
      console.error('Chat-Fehler:', error);
      
      let errorMessage = 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.';
      
      if (error.message?.includes('429')) {
        errorMessage = 'Zu viele Anfragen. Bitte warten Sie einen Moment.';
      } else if (error.message?.includes('402')) {
        errorMessage = 'AI-Kontingent aufgebraucht. Bitte kontaktieren Sie den Administrator.';
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);

      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

      {/* Chat Messages - nur anzeigen wenn Nachrichten vorhanden sind */}
      {messages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-6 w-6 text-white" />
            <span className="text-2xl font-bold text-white">AI-Assistent</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto rounded-full text-white/80 hover:text-white hover:bg-white/10"
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          </div>
          {!isCollapsed && (
            <ScrollArea className="h-[300px] bg-white rounded-2xl">
              <div className="space-y-3 p-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-muted text-foreground'
                          : 'bg-[hsl(var(--navy-primary))] text-white'
                      }`}
                    >
                      <div 
                        className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                        dangerouslySetInnerHTML={{ 
                          __html: msg.content
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="font-medium">$1</a>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-end">
                    <div className="bg-[hsl(var(--navy-primary))] text-white rounded-xl px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Chat Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Frage zu Terminen oder Mitgliedern..."
          disabled={isLoading}
          className="flex-1 bg-white/95 backdrop-blur-sm text-foreground border-0 rounded-2xl placeholder:text-muted-foreground"
          autoComplete="off"
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="flex-shrink-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
