import { useState, useEffect } from "react";
import { Cloud, Wind, Thermometer, Droplets, Sun, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  waterTemp: number;
  condition: "sunny" | "cloudy" | "rainy" | "windy";
  description: string;
  suitable: boolean;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    windDirection: "-",
    waterTemp: 0,
    condition: "cloudy",
    description: "Keine Wetterdaten",
    suitable: false
  });

  // Mock weather updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temperature: prev.temperature + (Math.random() - 0.5) * 2,
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 5),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "sunny": return <Sun className="h-6 w-6 text-yellow-500" />;
      case "rainy": return <CloudRain className="h-6 w-6 text-blue-500" />;
      case "windy": return <Wind className="h-6 w-6 text-cyan-500" />;
      default: return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Card className="bg-white rounded-[2rem] card-shadow-soft border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {getWeatherIcon()}
          Wetter & Bedingungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{Math.round(weather.temperature)}°C</p>
            <p className="text-sm text-muted-foreground">{weather.description}</p>
          </div>
          <Badge 
            variant={weather.suitable ? "default" : "destructive"}
            className="text-xs"
          >
            {weather.suitable ? "Geeignet" : "Ungünstig"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span>{Math.round(weather.windSpeed)} km/h {weather.windDirection}</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span>{weather.humidity}% Luftf.</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span>{weather.waterTemp}°C Wasser</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}