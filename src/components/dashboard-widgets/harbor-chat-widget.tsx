import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast, useRole, useProfileData, useHarborChatData } from "@/hooks";
import { cn } from "@/lib/utils";
import { apiLogger } from "@/lib/logger";
import { formatChatContent } from "@/lib/sanitize";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function HarborChatWidget() {
  const { agentName, isLoading: agentLoading } = useHarborChatData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentRole } = useRole();
  const { firstName: profileFirstName } = useProfileData();

  // Auto-scroll function
  const scrollToBottom = () => {
    // Nur scrollen wenn mehr als die Welcome-Message vorhanden ist
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Pre-load welcome message immediately when agent name is available
  useEffect(() => {
    if (!agentLoading && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Ahoi! Ich bin ${agentName}, dein KSVL-Assistent. Ich kann dir bei Kranterminen, Buchungen und Mitgliederdaten helfen. Was willst du wissen?`
      }]);
      // Small delay for smooth fade-in
      setTimeout(() => setIsInitializing(false), 50);
    }
  }, [agentLoading, agentName, messages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    // Nur bei neuen Nachrichten scrollen, nicht beim initialen Laden
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  // Show skeleton while initializing
  if (agentLoading || isInitializing) {
    return (
      <Card className="w-full bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white border-0 rounded-[2rem] card-shadow-soft-lg">
        <CardHeader className="pt-12 pb-4 px-[15px]">
          <Skeleton className="h-6 w-48 bg-white/20" />
        </CardHeader>
        <CardContent className="px-[15px] pb-8">
          <Skeleton className="h-[400px] bg-white/10 rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use cached profile data instead of direct DB query
      const firstName = profileFirstName || 'Segelfreund';

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
      apiLogger.error('Harbor chat error', error);
      
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
    <Card 
      className="w-full bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white border-0 rounded-[2rem] card-shadow-soft-lg"
      id="harbor-chat-widget"
    >
      <CardHeader className="pt-12 pb-4 px-[15px]">
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
          <Bot className="h-6 w-6" />
          KSVL-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="px-[15px] pb-8">
        <ScrollArea className="h-[400px] mb-4 bg-white rounded-2xl" ref={scrollRef}>
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
                      __html: formatChatContent(msg.content)
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
        <div className="space-y-2">
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
          <p className="text-xs text-white/80">
            💡 {agentName} kann dir bei Terminen, Buchungen, Mitgliederdaten und Statistiken helfen
          </p>
        </div>
      </CardContent>
    </Card>
  );
}