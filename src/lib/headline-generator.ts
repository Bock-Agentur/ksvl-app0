/**
 * Automatic Headline Generator
 * Generates contextual headlines based on time of day, season, and special occasions
 */

export function generateAutomaticHeadline(): string {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  // Check for special occasions first
  const specialOccasion = getSpecialOccasion(month, day);
  if (specialOccasion) return specialOccasion;

  // Check season
  const seasonalHeadline = getSeasonalHeadline(month, hour);
  if (seasonalHeadline) return seasonalHeadline;

  // Default time-based headlines
  return getTimeBasedHeadline(hour);
}

function getSpecialOccasion(month: number, day: number): string | null {
  // Christmas Season (December)
  if (month === 11 && day >= 1 && day <= 26) {
    return "Frohe Weihnachten! ⛵🎄\nBereit für eine Winterfahrt?";
  }

  // New Year
  if (month === 0 && day === 1) {
    return "Frohes neues Jahr! 🎊\nNeue Ziele, neue Abenteuer!";
  }

  // Easter (approximate - early April)
  if (month === 3 && day >= 1 && day <= 20) {
    return "Frohe Ostern! 🐰⛵\nPerfekt für einen Segeltörn!";
  }

  // Summer Start (June 1)
  if (month === 5 && day === 1) {
    return "Der Sommer ist da! ☀️\nWo geht die Reise hin?";
  }

  return null;
}

function getSeasonalHeadline(month: number, hour: number): string | null {
  // Spring (March-May)
  if (month >= 2 && month <= 4) {
    if (hour < 12) return "Guten Morgen! 🌸\nPerfektes Frühlingswetter zum Segeln!";
    if (hour < 18) return "Ahoi! 🌸\nDie Frühlingsbrisen rufen!";
    return "Schönen Abend! 🌅\nNoch eine Runde segeln?";
  }

  // Summer (June-August)
  if (month >= 5 && month <= 7) {
    if (hour < 12) return "Moin Moin! ☀️\nBereit für Sommerabenteuer?";
    if (hour < 18) return "Ahoi! 🏖️\nWo soll's heute hingehen?";
    return "Laue Sommernacht! 🌙\nNoch Lust auf eine Fahrt?";
  }

  // Autumn (September-November)
  if (month >= 8 && month <= 10) {
    if (hour < 12) return "Guten Morgen! 🍂\nHerbstwind im Rücken?";
    if (hour < 18) return "Moin! 🍁\nPerfekte Segelbedingungen!";
    return "Schöner Herbstabend! 🌇\nNoch eine Tour?";
  }

  // Winter (December-February)
  if (month === 11 || month <= 1) {
    if (hour < 12) return "Guten Morgen! ❄️\nWinterliches Segelabenteuer?";
    if (hour < 18) return "Moin! ⛄\nMutige segeln auch im Winter!";
    return "Winterabend! 🌨️\nGemütlich bleiben oder raus?";
  }

  return null;
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
