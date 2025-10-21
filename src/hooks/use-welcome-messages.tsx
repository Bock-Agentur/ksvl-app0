import { useAppSettings } from "./use-app-settings";
import { UserRole } from "@/types/user";

const DEFAULT_MESSAGES: Record<UserRole, string> = {
  mitglied: "🌊 Willkommen im Hafenverwaltungssystem! \n\nAls Mitglied können Sie:\n• Termine buchen 📅\n• Ihre Buchungen verwalten 📋\n• Den Kalender einsehen 👀\n\nViel Spaß beim Segeln! ⛵",
  kranfuehrer: "🚢 Willkommen Kranführer! \n\nIhre Aufgaben:\n• Termine erstellen und verwalten ⚙️\n• Kranführung koordinieren 🎯\n• Mitglieder unterstützen 🤝\n\nBereit für den Hafenbetrieb! ⚓",
  admin: "⚙️ Administrator-Dashboard \n\nVollzugriff auf:\n• Benutzerverwaltung 👥\n• Systemeinstellungen 🔧\n• Alle Termine und Buchungen 📊\n• Dashboard-Konfiguration 📋\n\nSystem bereit! ✅"
};

export function useWelcomeMessages() {
  const { value: messages, setValue: setMessages } = useAppSettings<Record<UserRole, string>>(
    "roleWelcomeMessages",
    DEFAULT_MESSAGES,
    true // Global
  );

  const getWelcomeMessage = (role: UserRole): string => {
    return messages[role] || DEFAULT_MESSAGES[role];
  };

  const updateMessage = (role: UserRole, message: string) => {
    const newMessages = { ...messages, [role]: message };
    setMessages(newMessages);
  };

  return {
    getWelcomeMessage,
    updateMessage,
    messages
  };
}