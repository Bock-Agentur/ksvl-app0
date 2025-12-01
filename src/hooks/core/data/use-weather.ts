/**
 * Weather Hook
 * Provides real-time weather data with React Query caching
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAppSettings } from '../settings/use-app-settings';
import { 
  weatherService, 
  DEFAULT_WEATHER_CONFIG,
  type CurrentWeather,
  type WeatherConfig 
} from '@/lib/services/weather-service';

export type { CurrentWeather, WeatherConfig };
export { DEFAULT_WEATHER_CONFIG };

interface UseWeatherOptions {
  enabled?: boolean;
}

export function useWeather(options?: UseWeatherOptions) {
  // Load weather config from app_settings
  const { value: weatherConfig, isLoading: configLoading } = useAppSettings<WeatherConfig>(
    'weather_config',
    DEFAULT_WEATHER_CONFIG,
    true // isGlobal
  );

  // Fetch weather data with React Query
  const { 
    data: weather, 
    isLoading: weatherLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['weather', weatherConfig.latitude, weatherConfig.longitude],
    queryFn: () => weatherService.getCurrentWeather(weatherConfig),
    refetchInterval: weatherConfig.refreshInterval,
    staleTime: 60000, // 1 minute
    enabled: (options?.enabled ?? true) && !configLoading,
    retry: 2,
    retryDelay: 5000
  });

  // Calculate sailing suitability for KSVL context
  const isSuitableForSailing = useMemo(() => {
    if (!weather) return false;
    
    // Good sailing conditions:
    // - Wind between 5-25 km/h (light to moderate)
    // - No rain or storms
    // - Temperature above 10°C
    const goodWind = weather.windSpeed >= 5 && weather.windSpeed <= 25;
    const noRain = !['rainy', 'stormy', 'snowy'].includes(weather.condition);
    const warmEnough = weather.temperature >= 10;
    
    return goodWind && noRain && warmEnough;
  }, [weather]);

  // Sailing conditions text
  const sailingConditionsText = useMemo(() => {
    if (!weather) return 'Lade...';
    
    if (weather.condition === 'stormy') return 'Gewitter - Nicht segeln!';
    if (weather.condition === 'rainy') return 'Regen - Eingeschränkt';
    if (weather.windSpeed < 5) return 'Zu wenig Wind';
    if (weather.windSpeed > 30) return 'Zu starker Wind';
    if (weather.windSpeed > 25) return 'Starker Wind - Erfahrene';
    if (weather.temperature < 10) return 'Kalt - Warm anziehen';
    
    return 'Gute Bedingungen';
  }, [weather]);

  return {
    weather,
    weatherConfig,
    isLoading: configLoading || weatherLoading,
    error,
    refetch,
    isSuitableForSailing,
    sailingConditionsText
  };
}
