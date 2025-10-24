import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Loader2, Send, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatMiniWidget() {
  const [agentName, setAgentName] = useState('Capitano');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Am Anfang eingeklappt
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentRole } = useRole();

  // Load agent name from settings
  useEffect(() => {
    const loadAgentName = async () => {
      try {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'aiAssistantSettings')
          .eq('is_global', true)
          .maybeSingle();

        if (settings?.setting_value) {
          const aiSettings = settings.setting_value as any;
          const name = aiSettings.agentName || 'Capitano';
          setAgentName(name);
        }
      } catch (error) {
        console.error('Error loading agent name:', error);
      }
    };
    loadAgentName();
  }, []);

  // Auto-scroll nur wenn Nachrichten vorhanden sind und gesendet werden
  const scrollToBottom = () => {
    // Nur scrollen wenn Nachrichten vorhanden sind
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    // Nur bei neuen Nachrichten scrollen, nicht beim initialen Laden
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Automatisch ausklappen bei neuer Nachricht
    setIsOpen(true);

    try {
      // Get user data for first name
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, name')
        .eq('id', user?.id)
        .single();

      const firstName = profileData?.first_name || 
                       profileData?.name?.split(' ')[0] || 
                       user?.email?.split('@')[0] || 
                       'User';

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
    <Card 
      className="w-full bg-gradient-to-r from-[hsl(var(--navy-deep))] to-[hsl(var(--navy-primary))] text-white border-0 rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)]"
    >
      <CardHeader className="pt-8 pb-4 px-[15px]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Bot className="h-5 w-5" />
            AI-Assistent
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 w-9 p-0 text-white hover:text-white hover:bg-white/20 rounded-full border border-white/30"
          >
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-[15px] pb-6">
        {/* Collapsible Messages Area */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            {messages.length > 0 && (
              <ScrollArea className="h-[250px] mb-4 bg-white rounded-2xl">
                <div className="space-y-3 p-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
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
                    <div className="flex justify-start">
                      <div className="bg-white/95 rounded-xl px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Input Field - Always Visible */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Frage ${agentName}...`}
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
      </CardContent>
    </Card>
  );
}
