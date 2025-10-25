import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/user";
import { MessageSquare, Smile, Save, RotateCcw, UserCircle, Shield, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWelcomeMessages } from "@/hooks/use-welcome-messages";
import { useIsMobile } from "@/hooks/use-mobile";

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
  gastmitglied: "👋 Willkommen als Gast! \n\nAls Gastmitglied können Sie:\n• Termine einsehen 📅\n• Den Kalender ansehen 👀\n• Profil verwalten 📋\n\nSchön, dass Sie da sind! ⛵",
  mitglied: "🌊 Willkommen im Hafenverwaltungssystem! \n\nAls Mitglied können Sie:\n• Termine buchen 📅\n• Ihre Buchungen verwalten 📋\n• Den Kalender einsehen 👀\n\nViel Spaß beim Segeln! ⛵",
  kranfuehrer: "🚢 Willkommen Kranführer! \n\nIhre Aufgaben:\n• Termine erstellen und verwalten ⚙️\n• Kranführung koordinieren 🎯\n• Mitglieder unterstützen 🤝\n\nBereit für den Hafenbetrieb! ⚓",
  admin: "⚙️ Administrator-Dashboard \n\nVollzugriff auf:\n• Benutzerverwaltung 👥\n• Systemeinstellungen 🔧\n• Alle Termine und Buchungen 📊\n• Dashboard-Konfiguration 📋\n\nSystem bereit! ✅",
  vorstand: "🏛️ Vorstand-Dashboard \n\nVollzugriff auf:\n• Benutzerverwaltung 👥\n• Systemeinstellungen 🔧\n• Alle Termine und Buchungen 📊\n• Strategische Übersicht 📈\n\nGuten Tag, Vorstand! ✅"
};

export function RoleWelcomeSettings() {
  const { toast } = useToast();
  const { messages, updateMessage } = useWelcomeMessages();
  const [activeRole, setActiveRole] = useState<UserRole>("admin");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isMobile = useIsMobile();

  const handleSave = () => {
    toast({
      title: "Startnachrichten gespeichert",
      description: "Die Nachrichten wurden automatisch in der Datenbank gespeichert."
    });
  };

  const handleReset = (role: UserRole) => {
    updateMessage(role, DEFAULT_MESSAGES[role]);
    toast({
      title: "Nachricht zurückgesetzt",
      description: `Die Standardnachricht für ${getRoleDisplayName(role)} wurde wiederhergestellt.`
    });
  };

  const handleMessageChange = (role: UserRole, message: string) => {
    updateMessage(role, message);
  };

  const insertEmoji = (emoji: string) => {
    const currentMessage = messages[activeRole];
    const newMessage = currentMessage + emoji;
    handleMessageChange(activeRole, newMessage);
    setShowEmojiPicker(false);
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      gastmitglied: isMobile ? "Gast" : "Gastmitglied",
      mitglied: "Mitglied",
      kranfuehrer: "Kranführer",
      admin: "Admin",
      vorstand: "Vorstand",
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "gastmitglied":
      case "mitglied":
        return UserCircle;
      case "kranfuehrer":
        return Wrench;
      case "admin":
      case "vorstand":
        return Shield;
      default:
        return UserCircle;
    }
  };

  return (
    <div className="space-y-6">
      <Card className={cn(
        isMobile ? "rounded-none border-x-0" : "bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0"
      )}>
        <CardHeader className={isMobile ? "px-4 py-3" : ""}>
          <CardTitle className={cn(
            "flex items-center gap-2 font-bold",
            isMobile ? "text-lg" : "text-2xl"
          )}>
            <MessageSquare className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
            Rollen-Startnachrichten
          </CardTitle>
          {!isMobile && (
            <p className="text-sm text-muted-foreground">
              Definieren Sie benutzerdefinierte Willkommensnachrichten für jede Benutzerrolle.
            </p>
          )}
        </CardHeader>
        <CardContent className={cn(
          "space-y-6",
          isMobile && "px-4 pb-4"
        )}>
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className={cn(
              "font-medium",
              isMobile ? "text-sm" : "text-base"
            )}>Rolle auswählen</Label>
            <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
              {(["admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"] as UserRole[]).map((role) => {
                const Icon = getRoleIcon(role);
                const roleLabel = getRoleDisplayName(role);
                
                return (
                  <Card 
                    key={role}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      isMobile ? "w-16 sm:w-20" : "w-20 sm:w-24",
                      activeRole === role 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:shadow-sm"
                    )}
                    onClick={() => setActiveRole(role)}
                  >
                    <CardContent className={cn(
                      "text-center",
                      isMobile ? "p-2" : "p-3"
                    )}>
                      <Icon className={cn(
                        "mx-auto mb-1",
                        isMobile ? "h-5 w-5" : "h-6 w-6"
                      )} />
                      <p className={cn(
                        "font-medium",
                        isMobile ? "text-[10px]" : "text-xs"
                      )}>{roleLabel}</p>
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
      <Card className={cn(
        isMobile ? "rounded-none border-x-0" : "bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0"
      )}>
        <CardHeader className={isMobile ? "px-4 py-3" : ""}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-base" : ""
          )}>
            <MessageSquare className="w-5 h-5" />
            Übersicht aller Rollen
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          "space-y-3",
          isMobile && "px-4 pb-4"
        )}>
          <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
            {(["admin", "vorstand", "kranfuehrer", "mitglied", "gastmitglied"] as UserRole[]).map((role) => {
              const Icon = getRoleIcon(role);
              const roleLabel = getRoleDisplayName(role);
              
              return (
                <Card 
                  key={role}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    isMobile ? "w-16 sm:w-20" : "w-20 sm:w-24",
                    activeRole === role 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:shadow-sm"
                  )}
                  onClick={() => setActiveRole(role)}
                >
                  <CardContent className={cn(
                    "text-center",
                    isMobile ? "p-2" : "p-3"
                  )}>
                    <Icon className={cn(
                      "mx-auto mb-1",
                      isMobile ? "h-5 w-5" : "h-6 w-6"
                    )} />
                    <p className={cn(
                      "font-medium",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>{roleLabel}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}