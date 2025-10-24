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

export function HarborChatWidget() {
  const [agentName, setAgentName] = useState('Capitano');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Ahoi! Ich bin ${agentName}, dein KSVL-Assistent. Ich kann dir bei Kranterminen, Buchungen und Mitgliederdaten helfen. Was willst du wissen?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentRole } = useRole();

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
          setMessages([{
            role: 'assistant',
            content: `👋 Ahoi! Ich bin ${name}, dein KSVL-Assistent. Ich kann dir bei Kranterminen, Buchungen und Mitgliederdaten helfen. Was willst du wissen?`
          }]);
        }
      } catch (error) {
        console.error('Error loading agent name:', error);
      }
    };
    loadAgentName();
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsOpen(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, name, email')
        .eq('id', user?.id)
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

      if (error) throw error;

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
      id="harbor-chat-widget"
    >
      <CardHeader className="pt-12 pb-4 px-[15px]">
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
          <Bot className="h-6 w-6" />
          AI-Assistent
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-[15px] pb-8 space-y-2">
        {/* Toggle Button - Immer sichtbar, außerhalb Collapsible */}
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-10 w-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-0 transition-all"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsible Chat Area */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <ScrollArea className="h-[400px] mb-4 bg-white rounded-2xl">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Input Area */}
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
      </CardContent>
    </Card>
  );
}
