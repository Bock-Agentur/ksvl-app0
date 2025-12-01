import { useSettingsBatch } from "./use-settings-batch";
import { UserRole } from "@/types/user";

const DEFAULT_MESSAGES: Record<UserRole, string> = {
  gastmitglied: "🌊 Willkommen als Gast im Hafenverwaltungssystem! \n\nAls Gastmitglied können Sie:\n• Termine buchen 📅\n• Ihre Buchungen verwalten 📋\n• Den Kalender einsehen 👀\n\nViel Spaß beim Segeln! ⛵",
  mitglied: "🌊 Willkommen im Hafenverwaltungssystem! \n\nAls Mitglied können Sie:\n• Termine buchen 📅\n• Ihre Buchungen verwalten 📋\n• Den Kalender einsehen 👀\n\nViel Spaß beim Segeln! ⛵",
  kranfuehrer: "🚢 Willkommen Kranführer! \n\nIhre Aufgaben:\n• Termine erstellen und verwalten ⚙️\n• Kranführung koordinieren 🎯\n• Mitglieder unterstützen 🤝\n\nBereit für den Hafenbetrieb! ⚓",
  admin: "⚙️ Administrator-Dashboard \n\nVollzugriff auf:\n• Benutzerverwaltung 👥\n• Systemeinstellungen 🔧\n• Alle Termine und Buchungen 📊\n• Dashboard-Konfiguration 📋\n\nSystem bereit! ✅",
  vorstand: "👔 Vorstand-Dashboard \n\nVollzugriff auf:\n• Benutzerverwaltung 👥\n• Systemeinstellungen 🔧\n• Alle Termine und Buchungen 📊\n• Dashboard-Konfiguration 📋\n• Vorstandsfunktionen 🏛️\n\nSystem bereit! ✅"
};

export function useWelcomeMessages() {
  const { getSetting, updateSetting } = useSettingsBatch();
  
  const messages = getSetting<Record<UserRole, string>>(
    "roleWelcomeMessages",
    DEFAULT_MESSAGES
  );

  const getWelcomeMessage = (role: UserRole): string => {
    return messages[role] || DEFAULT_MESSAGES[role];
  };

  const updateMessage = async (role: UserRole, message: string) => {
    const newMessages = { ...messages, [role]: message };
    await updateSetting("roleWelcomeMessages", newMessages, true);
  };

  return {
    getWelcomeMessage,
    updateMessage,
    messages
  };
}