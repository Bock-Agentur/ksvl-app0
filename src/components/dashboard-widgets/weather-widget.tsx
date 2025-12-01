import { Cloud, Wind, Thermometer, Droplets, Sun, CloudRain, CloudSnow, CloudLightning, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeather, type CurrentWeather } from "@/hooks";

function getWeatherIcon(condition: CurrentWeather['condition'], isDay: boolean) {
  const iconClass = "h-6 w-6";
  
  switch (condition) {
    case 'sunny':
      return <Sun className={`${iconClass} text-yellow-500`} />;
    case 'rainy':
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    case 'snowy':
      return <CloudSnow className={`${iconClass} text-blue-300`} />;
    case 'stormy':
      return <CloudLightning className={`${iconClass} text-purple-500`} />;
    case 'windy':
      return <Wind className={`${iconClass} text-cyan-500`} />;
    default:
      return <Cloud className={`${iconClass} text-gray-500`} />;
  }
}

function WeatherWidgetSkeleton() {
  return (
    <Card className="bg-card rounded-[2rem] card-shadow-soft border-0">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherWidgetError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="bg-card rounded-[2rem] card-shadow-soft border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="h-6 w-6 text-muted-foreground" />
          Wetter & Bedingungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wetterdaten konnten nicht geladen werden.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </Button>
      </CardContent>
    </Card>
  );
}

export function WeatherWidget() {
  const { weather, isLoading, error, refetch, isSuitableForSailing, sailingConditionsText } = useWeather();

  if (isLoading) {
    return <WeatherWidgetSkeleton />;
  }

  if (error || !weather) {
    return <WeatherWidgetError onRetry={() => refetch()} />;
  }

  return (
    <Card className="bg-card rounded-[2rem] card-shadow-soft border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getWeatherIcon(weather.condition, weather.isDay)}
          Wetter & Bedingungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{weather.temperature}°C</p>
            <p className="text-sm text-muted-foreground">{weather.description}</p>
          </div>
          <Badge 
            variant={isSuitableForSailing ? "default" : "destructive"}
            className="text-xs"
          >
            {sailingConditionsText}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span>{weather.windSpeed} km/h {weather.windDirectionText}</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span>{weather.humidity}% Luftf.</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span>Wörthersee</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
