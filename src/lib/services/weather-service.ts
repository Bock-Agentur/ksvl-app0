/**
 * Weather Service
 * Fetches real weather data from Open-Meteo API (free, no API key required)
 */

export interface CurrentWeather {
  temperature: number;        // °C
  apparentTemperature: number; // °C - Gefühlte Temperatur
  humidity: number;           // %
  windSpeed: number;          // km/h
  windGusts: number;          // km/h - Windböen
  windDirection: number;      // Degrees (0-360)
  windDirectionText: string;  // N, NE, E, SE, S, SW, W, NW
  beaufort: number;           // 0-12 Beaufort scale
  beaufortText: string;       // German Beaufort description
  weatherCode: number;        // WMO Weather Code
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'stormy' | 'snowy';
  description: string;        // German description
  isDay: boolean;
  time: string;               // ISO timestamp
}

export interface WeatherConfig {
  latitude: number;
  longitude: number;
  units: 'metric' | 'imperial';
  provider: 'open-meteo';
  refreshInterval: number;    // milliseconds
}

export const DEFAULT_WEATHER_CONFIG: WeatherConfig = {
  latitude: 46.610,           // Wörthersee / KSVL
  longitude: 14.272,
  units: 'metric',
  provider: 'open-meteo',
  refreshInterval: 300000     // 5 minutes
};

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    is_day: number;
  };
}

/**
 * Maps WMO Weather Code to condition and German description
 */
function mapWeatherCode(code: number, isDay: boolean): { condition: CurrentWeather['condition']; description: string } {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  const weatherMap: Record<number, { condition: CurrentWeather['condition']; description: string }> = {
    0: { condition: 'sunny', description: isDay ? 'Sonnig' : 'Klar' },
    1: { condition: 'sunny', description: 'Überwiegend klar' },
    2: { condition: 'cloudy', description: 'Teilweise bewölkt' },
    3: { condition: 'cloudy', description: 'Bewölkt' },
    45: { condition: 'cloudy', description: 'Nebel' },
    48: { condition: 'cloudy', description: 'Nebel mit Reif' },
    51: { condition: 'rainy', description: 'Leichter Nieselregen' },
    53: { condition: 'rainy', description: 'Nieselregen' },
    55: { condition: 'rainy', description: 'Starker Nieselregen' },
    56: { condition: 'rainy', description: 'Gefrierender Nieselregen' },
    57: { condition: 'rainy', description: 'Starker gefr. Nieselregen' },
    61: { condition: 'rainy', description: 'Leichter Regen' },
    63: { condition: 'rainy', description: 'Regen' },
    65: { condition: 'rainy', description: 'Starker Regen' },
    66: { condition: 'rainy', description: 'Gefrierender Regen' },
    67: { condition: 'rainy', description: 'Starker gefr. Regen' },
    71: { condition: 'snowy', description: 'Leichter Schneefall' },
    73: { condition: 'snowy', description: 'Schneefall' },
    75: { condition: 'snowy', description: 'Starker Schneefall' },
    77: { condition: 'snowy', description: 'Schneekörner' },
    80: { condition: 'rainy', description: 'Leichte Regenschauer' },
    81: { condition: 'rainy', description: 'Regenschauer' },
    82: { condition: 'rainy', description: 'Starke Regenschauer' },
    85: { condition: 'snowy', description: 'Leichte Schneeschauer' },
    86: { condition: 'snowy', description: 'Schneeschauer' },
    95: { condition: 'stormy', description: 'Gewitter' },
    96: { condition: 'stormy', description: 'Gewitter mit Hagel' },
    99: { condition: 'stormy', description: 'Gewitter mit starkem Hagel' },
  };

  return weatherMap[code] || { condition: 'cloudy', description: 'Unbekannt' };
}

/**
 * Converts wind direction degrees to compass text
 */
function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Converts wind speed (km/h) to Beaufort scale
 */
function windSpeedToBeaufort(kmh: number): { beaufort: number; text: string } {
  if (kmh < 1) return { beaufort: 0, text: 'Windstille' };
  if (kmh < 6) return { beaufort: 1, text: 'Leiser Zug' };
  if (kmh < 12) return { beaufort: 2, text: 'Leichte Brise' };
  if (kmh < 20) return { beaufort: 3, text: 'Schwache Brise' };
  if (kmh < 29) return { beaufort: 4, text: 'Mäßige Brise' };
  if (kmh < 39) return { beaufort: 5, text: 'Frische Brise' };
  if (kmh < 50) return { beaufort: 6, text: 'Starker Wind' };
  if (kmh < 62) return { beaufort: 7, text: 'Steifer Wind' };
  if (kmh < 75) return { beaufort: 8, text: 'Stürmischer Wind' };
  if (kmh < 89) return { beaufort: 9, text: 'Sturm' };
  if (kmh < 103) return { beaufort: 10, text: 'Schwerer Sturm' };
  if (kmh < 117) return { beaufort: 11, text: 'Orkanartiger Sturm' };
  return { beaufort: 12, text: 'Orkan' };
}

/**
 * Determines if conditions are windy based on wind speed
 */
function isWindy(windSpeed: number): boolean {
  return windSpeed > 30; // km/h
}

class WeatherService {
  private baseUrl = 'https://api.open-meteo.com/v1/forecast';

  async getCurrentWeather(config: WeatherConfig): Promise<CurrentWeather> {
    const params = new URLSearchParams({
      latitude: config.latitude.toString(),
      longitude: config.longitude.toString(),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,is_day',
      timezone: 'Europe/Vienna',
      wind_speed_unit: 'kmh'
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();
    const current = data.current;
    const isDay = current.is_day === 1;
    
    let { condition, description } = mapWeatherCode(current.weather_code, isDay);
    
    // Override condition if very windy
    if (isWindy(current.wind_speed_10m) && condition !== 'stormy') {
      condition = 'windy';
    }

    const windSpeed = Math.round(current.wind_speed_10m);
    const { beaufort, text: beaufortText } = windSpeedToBeaufort(windSpeed);

    return {
      temperature: Math.round(current.temperature_2m * 10) / 10,
      apparentTemperature: Math.round(current.apparent_temperature * 10) / 10,
      humidity: current.relative_humidity_2m,
      windSpeed,
      windGusts: Math.round(current.wind_gusts_10m),
      windDirection: current.wind_direction_10m,
      windDirectionText: getWindDirectionText(current.wind_direction_10m),
      beaufort,
      beaufortText,
      weatherCode: current.weather_code,
      condition,
      description,
      isDay,
      time: current.time
    };
  }
}

export const weatherService = new WeatherService();
