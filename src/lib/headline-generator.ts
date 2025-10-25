/**
 * Automatic Headline Generator
 * Generates contextual headlines based on time of day
 */

import { toZonedTime } from 'date-fns-tz';

export function generateAutomaticHeadline(): string {
  // Use Vienna timezone
  const viennaTime = toZonedTime(new Date(), 'Europe/Vienna');
  const hour = viennaTime.getHours();

  // Only use time-based headlines
  return getTimeBasedHeadline(hour);
}

function getTimeBasedHeadline(hour: number): string {
  const headlines = {
    earlyMorning: [
      "Früher Vogel! 🌅\nWo geht's heute hin?",
      "Moin Moin! ⛵\nBereit für neue Abenteuer?",
      "Guten Morgen! 🌊\nDie See ruft!"
    ],
    morning: [
      "Guten Morgen! ☀️\nWo wollen Sie segeln?",
      "Ahoi! ⛵\nWelches Ziel heute?",
      "Moin! 🌊\nBereit fürs Wasser?"
    ],
    noon: [
      "Schönen Mittag! 🌞\nZeit für eine Ausfahrt?",
      "Hallo! ⛵\nWo geht die Reise hin?",
      "Mahlzeit! 🌊\nLust auf segeln?"
    ],
    afternoon: [
      "Guten Tag! ☀️\nPerfektes Segelwetter!",
      "Ahoi! ⛵\nNoch Zeit für eine Tour?",
      "Moin! 🌊\nWohin soll's gehen?"
    ],
    evening: [
      "Guten Abend! 🌅\nSonnenuntergangstour?",
      "Schöner Abend! ⛵\nNoch segeln gehen?",
      "Moin! 🌇\nLaue Abendbrise nutzen?"
    ],
    night: [
      "Gute Nacht! 🌙\nTräumen Sie von Abenteuern?",
      "Ahoi Nachtschwärmer! ⭐\nSternensegeln?",
      "Späte Stunde! 🌟\nNachttour geplant?"
    ]
  };

  let timeCategory: keyof typeof headlines;
  if (hour < 6) timeCategory = "earlyMorning";
  else if (hour < 12) timeCategory = "morning";
  else if (hour < 14) timeCategory = "noon";
  else if (hour < 18) timeCategory = "afternoon";
  else if (hour < 22) timeCategory = "evening";
  else timeCategory = "night";

  const options = headlines[timeCategory];
  return options[Math.floor(Math.random() * options.length)];
}
