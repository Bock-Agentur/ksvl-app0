import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({ value, onChange, className, placeholder = "Zeit auswählen" }: TimePickerProps) {
  const [hours, setHours] = React.useState('12');
  const [minutes, setMinutes] = React.useState('00');
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h || '12');
      setMinutes(m || '00');
    }
  }, [value]);

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const timeString = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
    onChange?.(timeString);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push({
          hours: h.toString().padStart(2, '0'),
          minutes: m.toString().padStart(2, '0'),
          display: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Label htmlFor="hours">Stunden</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => {
                  const newHours = Math.max(0, Math.min(23, parseInt(e.target.value) || 0)).toString();
                  setHours(newHours);
                  handleTimeChange(newHours, minutes);
                }}
                className="w-20"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="minutes">Minuten</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                step="15"
                value={minutes}
                onChange={(e) => {
                  const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0)).toString();
                  setMinutes(newMinutes);
                  handleTimeChange(hours, newMinutes);
                }}
                className="w-20"
              />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Schnellauswahl</Label>
            <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
              {timeOptions.map((time) => (
                <Button
                  key={time.display}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setHours(time.hours);
                    setMinutes(time.minutes);
                    handleTimeChange(time.hours, time.minutes);
                    setIsOpen(false);
                  }}
                >
                  {time.display}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}