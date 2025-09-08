import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/user";
import { MessageSquare, Smile, Save, RotateCcw, Users, UserCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Emoji-Kategorien für den einfachen Emoji-Picker
const EMOJI_CATEGORIES = {
  gesichter: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘"],
  aktivitaeten: ["⚓", "🚢", "⛵", "🛥️", "🏊", "🚣", "🏄", "⭐", "🌊", "🌅", "🌄", "⛰️", "🏔️", "🗻"],
  symbole: ["✅", "❌", "⚡", "🔥", "💎", "🎯", "🎪", "🎨", "🔧", "⚙️", "📋", "📊", "📈", "💼", "🎉", "🎊"],
  haende: ["👋", "🤝", "👍", "👎", "👏", "🤜", "🤛", "✊", "✋", "🤚", "🖐️", "💪", "🙏", "✌️", "🤟"]
};

interface RoleWelcomeMessage {
  role: UserRole;
  message: string;
}

const DEFAULT_MESSAGES: Record<UserRole, string> = {
  mitglied: "🌊 Willkommen im Hafenverwaltungssystem! \n\nAls Mitglied können Sie:\n• Termine buchen 📅\n• Ihre Buchungen verwalten 📋\n• Den Kalender einsehen 👀\n\nViel Spaß beim Segeln! ⛵",
  kranfuehrer: "🚢 Willkommen Kranführer! \n\nIhre Aufgaben:\n• Termine erstellen und verwalten ⚙️\n• Kranführung koordinieren 🎯\n• Mitglieder unterstützen 🤝\n\nBereit für den Hafenbetrieb! ⚓",
  admin: "⚙️ Administrator-Dashboard \n\nVollzugriff auf:\n• Benutzerverwaltung 👥\n• Systemeinstellungen 🔧\n• Alle Termine und Buchungen 📊\n• Dashboard-Konfiguration 📋\n\nSystem bereit! ✅"
};

export function RoleWelcomeSettings() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Record<UserRole, string>>(DEFAULT_MESSAGES);
  const [activeRole, setActiveRole] = useState<UserRole>("mitglied");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("roleWelcomeMessages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages({ ...DEFAULT_MESSAGES, ...parsed });
      } catch (error) {
        console.error("Error loading welcome messages:", error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("roleWelcomeMessages", JSON.stringify(messages));
      toast({
        title: "Startnachrichten gespeichert",
        description: "Die Nachrichten wurden erfolgreich aktualisiert."
      });
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Die Nachrichten konnten nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleReset = (role: UserRole) => {
    const newMessages = { ...messages };
    newMessages[role] = DEFAULT_MESSAGES[role];
    setMessages(newMessages);
    toast({
      title: "Nachricht zurückgesetzt",
      description: `Die Standardnachricht für ${getRoleDisplayName(role)} wurde wiederhergestellt.`
    });
  };

  const handleMessageChange = (role: UserRole, message: string) => {
    setMessages(prev => ({
      ...prev,
      [role]: message
    }));
  };

  const insertEmoji = (emoji: string) => {
    const currentMessage = messages[activeRole];
    const newMessage = currentMessage + emoji;
    handleMessageChange(activeRole, newMessage);
    setShowEmojiPicker(false);
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "mitglied": return "Mitglied";
      case "kranfuehrer": return "Kranführer";
      case "admin": return "Administrator";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "mitglied": return Users;
      case "kranfuehrer": return UserCheck;
      case "admin": return Shield;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Rollen-Startnachrichten
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Definieren Sie benutzerdefinierte Willkommensnachrichten für jede Benutzerrolle.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Rolle auswählen</Label>
            <div className="flex gap-2 justify-center sm:justify-start">
              {(["mitglied", "kranfuehrer", "admin"] as UserRole[]).map((role) => {
                const Icon = getRoleIcon(role);
                return (
                  <Card 
                    key={role}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50 w-20 sm:w-24",
                      activeRole === role 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:shadow-sm"
                    )}
                    onClick={() => setActiveRole(role)}
                  >
                    <CardContent className="p-3 text-center">
                      <Icon className={cn(
                        "h-6 w-6 mx-auto mb-1",
                        activeRole === role ? "text-primary" : "text-muted-foreground"
                      )} />
                      <p className={cn(
                        "font-medium text-xs",
                        activeRole === role ? "text-primary" : "text-foreground"
                      )}>
                        {role === "mitglied" ? "Mitgl." : role === "kranfuehrer" ? "Kran" : "Admin"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Message Editor */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Label className="text-base font-medium">
                  Nachricht für {getRoleDisplayName(activeRole)}
                </Label>
                <div className="flex items-center gap-2">
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        Emoji
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid grid-cols-8 gap-2 p-2 max-h-60 overflow-y-auto">
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <div key={category} className="col-span-8">
                            <h4 className="text-sm font-medium mb-2 capitalize">{category}</h4>
                            <div className="grid grid-cols-8 gap-1">
                              {emojis.map((emoji, index) => (
                                <button
                                  key={index}
                                  onClick={() => insertEmoji(emoji)}
                                  className="p-1 hover:bg-muted rounded text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Textarea
                value={messages[activeRole]}
                onChange={(e) => handleMessageChange(activeRole, e.target.value)}
                placeholder={`Geben Sie die Startnachricht für ${getRoleDisplayName(activeRole)} ein...`}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{messages[activeRole]?.length || 0} Zeichen</span>
                <span className="hidden sm:inline">Emojis werden unterstützt</span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Vorschau</Label>
              <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                <div className="whitespace-pre-wrap text-sm">
                  {messages[activeRole] || `Keine Nachricht für ${getRoleDisplayName(activeRole)} festgelegt.`}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleReset(activeRole)}
                className="w-full sm:w-auto"
              >
                Zurücksetzen
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(["mitglied", "kranfuehrer", "admin"] as UserRole[]).map((role) => {
              const Icon = getRoleIcon(role);
              return (
                <div key={role} className="text-center p-3 bg-muted/30 rounded-lg">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-medium text-xs mb-1">
                    {role === "mitglied" ? "Mitgl." : role === "kranfuehrer" ? "Kran" : "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {messages[role]?.length || 0} Z.
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}