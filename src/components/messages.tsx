import { useState } from "react";
import { Send, MessageSquare, Users, Mail, Phone, Calendar, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UserRole, Message, MessageTemplate, MessagesProps } from "@/types";

// Mock data
const mockMessages: Message[] = [
  {
    id: "1",
    subject: "Krantermin morgen - Wichtige Informationen",
    content: "Liebe Mitglieder, bitte beachten Sie die geänderten Zeiten für morgen...",
    recipient: "custom",
    customRecipients: ["hans.mueller@email.com", "maria.schmidt@email.com"],
    sender: "Franz Weber",
    timestamp: new Date("2024-01-15T10:30:00Z"),
    status: "sent"
  },
  {
    id: "2",
    subject: "Wartungsarbeiten am Kran",
    content: "Aufgrund von Wartungsarbeiten ist der Kran am kommenden Samstag nicht verfügbar...",
    recipient: "all",
    sender: "Anna Bauer",
    timestamp: new Date("2024-01-10T15:45:00Z"),
    status: "sent"
  }
];

const messageTemplates: MessageTemplate[] = [
  {
    id: "booking_confirmation",
    name: "Buchungsbestätigung",
    subject: "Ihr Krantermin am {date}",
    content: "Liebe/r {name},\n\nIhr Krantermin wurde bestätigt:\n\nDatum: {date}\nUhrzeit: {time}\nKranführer: {operator}\n\nBitte seien Sie pünktlich vor Ort.\n\nMit freundlichen Grüßen\nIhr KSVL Team",
    category: "booking"
  },
  {
    id: "reminder_24h",
    name: "24h Erinnerung",
    subject: "Erinnerung: Krantermin morgen",
    content: "Liebe/r {name},\n\nwir erinnern Sie an Ihren Krantermin morgen:\n\nDatum: {date}\nUhrzeit: {time}\nKranführer: {operator}\n\nBei Fragen können Sie uns gerne kontaktieren.\n\nViele Grüße\nIhr KSVL Team",
    category: "reminder"
  }
];

const recipientGroups = [
  { id: "all", label: "Alle Mitglieder", icon: Users },
  { id: "members", label: "Nur Mitglieder", icon: Users },
  { id: "operators", label: "Nur Kranführer", icon: Users },
  { id: "admins", label: "Nur Administratoren", icon: Users },
  { id: "active_bookings", label: "Mitglieder mit aktiven Buchungen", icon: Calendar },
];

// MessagesProps is now imported from @/types

export function Messages({ currentRole }: MessagesProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [activeTab, setActiveTab] = useState<"compose" | "history" | "templates">("compose");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Compose form
  const [messageForm, setMessageForm] = useState({
    subject: "",
    content: "",
    recipients: [] as string[],
    recipientGroup: "",
    customRecipients: "",
    scheduleDate: "",
    scheduleTime: ""
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleSendMessage = () => {
    if (!messageForm.subject || !messageForm.content) {
      toast({
        title: "Fehler",
        description: "Betreff und Nachricht sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    let recipients: string[] = [];
    if (messageForm.recipientGroup) {
      recipients = [messageForm.recipientGroup];
    } else if (messageForm.customRecipients) {
      recipients = messageForm.customRecipients.split(',').map(r => r.trim());
    }

    if (recipients.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie Empfänger aus.",
        variant: "destructive"
      });
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      subject: messageForm.subject,
      content: messageForm.content,
      recipient: messageForm.recipientGroup as "all" | "members" | "operators" | "admins" | "custom" || "all",
      customRecipients: messageForm.recipientGroup ? undefined : recipients,
      sender: "Aktueller Benutzer", // Would be dynamic in real app
      timestamp: new Date(),
      status: messageForm.scheduleDate ? "scheduled" : "sent",
      scheduledFor: messageForm.scheduleDate ? new Date(`${messageForm.scheduleDate}T${messageForm.scheduleTime || "09:00"}`) : undefined
    };

    setMessages(prev => [newMessage, ...prev]);
    setMessageForm({
      subject: "",
      content: "",
      recipients: [],
      recipientGroup: "",
      customRecipients: "",
      scheduleDate: "",
      scheduleTime: ""
    });

    toast({
      title: "Nachricht gesendet",
      description: `Nachricht wurde erfolgreich ${messageForm.scheduleDate ? 'geplant' : 'gesendet'}.`
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setMessageForm(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content
      }));
    }
    setSelectedTemplate(templateId);
  };

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canSendMessages = currentRole === "kranfuehrer" || currentRole === "admin";

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nachrichten</h1>
          <p className="text-sm text-muted-foreground">
            {canSendMessages 
              ? "Versenden Sie Nachrichten an Mitglieder" 
              : "Ihre erhaltenen Nachrichten"}
          </p>
        </div>
        
        {canSendMessages && (
          <div className="flex gap-2">
            <Button
              variant={activeTab === "compose" ? "default" : "outline"}
              onClick={() => setActiveTab("compose")}
            >
              <Send className="w-4 h-4 mr-2" />
              Verfassen
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "outline"}
              onClick={() => setActiveTab("history")}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Verlauf
            </Button>
            <Button
              variant={activeTab === "templates" ? "default" : "outline"}
              onClick={() => setActiveTab("templates")}
            >
              <Filter className="w-4 h-4 mr-2" />
              Vorlagen
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {canSendMessages && activeTab === "compose" && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Nachricht verfassen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Vorlage verwenden (optional)</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vorlage auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {messageTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Empfänger</Label>
              <div className="space-y-3">
                <Select
                  value={messageForm.recipientGroup}
                  onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipientGroup: value, customRecipients: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Empfängergruppe auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientGroups.map(group => {
                      const Icon = group.icon;
                      return (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {group.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-muted-foreground text-center">oder</div>
                
                <div>
                  <Input
                    placeholder="Individuelle E-Mail-Adressen (kommagetrennt)"
                    value={messageForm.customRecipients}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, customRecipients: e.target.value, recipientGroup: "" }))}
                  />
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Betreff *</Label>
              <Input
                id="subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Betreff der Nachricht"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Nachricht *</Label>
              <Textarea
                id="content"
                value={messageForm.content}
                onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Verfassen Sie Ihre Nachricht..."
                rows={8}
              />
            </div>

            {/* Schedule (optional) */}
            <div className="space-y-2">
              <Label>Geplanter Versand (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={messageForm.scheduleDate}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, scheduleDate: e.target.value }))}
                />
                <Input
                  type="time"
                  value={messageForm.scheduleTime}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, scheduleTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSendMessage} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                {messageForm.scheduleDate ? "Planen" : "Senden"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMessageForm({
                  subject: "",
                  content: "",
                  recipients: [],
                  recipientGroup: "",
                  customRecipients: "",
                  scheduleDate: "",
                  scheduleTime: ""
                })}
              >
                Zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message History */}
      {(activeTab === "history" || !canSendMessages) && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Nachrichten durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Nachrichten gefunden</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Versuchen Sie andere Suchbegriffe." : "Noch keine Nachrichten vorhanden."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-foreground truncate">{message.subject}</h3>
                          <Badge 
                            variant={message.status === "sent" ? "default" : message.status === "scheduled" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {message.status === "sent" ? "Gesendet" : message.status === "scheduled" ? "Geplant" : "Entwurf"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Von: {message.sender}</span>
                          <span>An: {message.recipient === "custom" && message.customRecipients ? 
                            message.customRecipients.join(", ") : 
                            recipientGroups.find(g => g.id === message.recipient)?.label || message.recipient}</span>
                          <span>{message.timestamp.toLocaleDateString('de-AT', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Templates Management */}
      {canSendMessages && activeTab === "templates" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nachrichtenvorlagen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messageTemplates.map((template) => (
                  <Card key={template.id} className="border-2 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Betreff: {template.subject}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.content}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            handleTemplateSelect(template.id);
                            setActiveTab("compose");
                          }}
                        >
                          Verwenden
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}