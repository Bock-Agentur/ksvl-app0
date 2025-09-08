import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSlotDesign } from "@/hooks/use-slot-design";
import { 
  Heart, 
  Star, 
  Zap, 
  Sparkles, 
  Moon, 
  Sun, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Palette,
  Mouse,
  Eye,
  Code,
  Layers,
  Move,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Users,
  Calendar as CalendarIcon,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Shield,
  Anchor,
  Waves,
  Ship,
  Compass,
  Navigation,
  Wind,
  Fish,
  Sailboat,
  Construction,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  RotateCw,
  Maximize2,
  Minimize2,
  // Currently used icons in the app
  Home,
  MessageSquare,
  User,
  UserCheck,
  Menu,
  X,
  FileText,
  TestTube,
  CalendarDays,
  Send,
  Mail,
  Phone,
  Save,
  BookOpen,
  Database,
  Euro,
  TrendingUp,
  CreditCard,
  Wrench,
  UserPlus,
  Cloud,
  Thermometer,
  Droplets,
  CloudRain,
  MoreHorizontal,
  Check,
  Circle,
  Dot,
  AlertCircle,
  RefreshCw as Refresh,
  Smile,
  EyeOff,
  MousePointer2,
  MoveHorizontal,
  ArrowLeft as ChevronLeftIcon,
  ArrowRight as ChevronRightIcon,
  Truck,
  BarChart3,
  Type
} from "lucide-react";
import { TimePicker } from "@/components/ui/time-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";

// Demo Slot-Termin-Konfiguration Komponente
function SlotTerminDemo() {
  const [formData, setFormData] = useState({
    date: new Date(),
    time: "09:00",
    craneOperator: "Max Mustermann",
    notes: "",
    slotBlockDurations: [60] as (15 | 30 | 45 | 60)[]
  });
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 15-minütige Zeitslots generieren
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 20; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      slots.push(`${hourStr}:00`);
      slots.push(`${hourStr}:15`);
      slots.push(`${hourStr}:30`);
      slots.push(`${hourStr}:45`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleSubmitDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Demo: Keine echten Slots anlegen
    console.log("Demo Slot-Konfiguration:", formData);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <form onSubmit={handleSubmitDemo} className="space-y-4">
      {/* Grunddaten */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground border-b pb-2">Grunddaten</h5>
        
        {/* Datum */}
        <div className="space-y-1">
          <Label className="text-trendy-navy font-medium">Datum</Label>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal ring-trendy-cyan focus-visible:ring-2"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.date, "dd.MM.yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => {
                  if (date) {
                    setFormData(prev => ({ ...prev, date }));
                    setDatePopoverOpen(false);
                  }
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Zeit */}
        <div className="space-y-1">
          <Label className="text-trendy-navy font-medium">Zeit</Label>
          <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal ring-trendy-pink focus-visible:ring-2"
              >
                <Clock className="mr-2 h-4 w-4" />
                {formData.time}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Command className="w-[200px]">
                <CommandInput placeholder="Zeit suchen..." className="h-9" />
                <CommandList className="max-h-[200px] overflow-y-auto">
                  <CommandEmpty>Keine Zeit gefunden.</CommandEmpty>
                  <CommandGroup>
                    {timeSlots.map((time) => (
                      <CommandItem
                        key={time}
                        value={time}
                        onSelect={() => {
                          setFormData(prev => ({ ...prev, time }));
                          setTimePopoverOpen(false);
                        }}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Check
                          className={`h-4 w-4 ${
                            formData.time === time ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span>{time}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Termine konfigurieren */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <Label className="text-sm font-medium text-trendy-green">
          Mehrere Termine konfigurieren
        </Label>
        
        <div className="space-y-3">
          {formData.slotBlockDurations.map((duration, index) => {
            // Berechne Start- und Endzeit für diesen Slot
            const calculateSlotTimes = () => {
              const [startHour, startMinute] = formData.time.split(':').map(Number);
              let currentMinutes = startHour * 60 + startMinute;
              
              // Addiere die Dauern aller vorherigen Slots
              for (let i = 0; i < index; i++) {
                currentMinutes += formData.slotBlockDurations[i];
              }
              
              const slotStartHour = Math.floor(currentMinutes / 60);
              const slotStartMinute = currentMinutes % 60;
              const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
              
              const endMinutes = currentMinutes + duration;
              const slotEndHour = Math.floor(endMinutes / 60);
              const slotEndMinute = endMinutes % 60;
              const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
              
              return { startTime: slotStartTime, endTime: slotEndTime };
            };
            
            const { startTime, endTime } = calculateSlotTimes();
            
            return (
              <div key={index} className="flex items-center gap-2 p-3 bg-background border rounded-lg">
                <div className="flex flex-col min-w-[100px]">
                  <span className="text-sm font-medium">Termin {index + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {startTime} - {endTime}
                  </span>
                </div>
                
                <Select 
                  value={duration.toString()} 
                  onValueChange={(value) => {
                    const newDurations = [...formData.slotBlockDurations];
                    newDurations[index] = parseInt(value) as 15 | 30 | 45 | 60;
                    setFormData(prev => ({ 
                      ...prev, 
                      slotBlockDurations: newDurations
                    }));
                  }}
                >
                  <SelectTrigger className="w-32 ring-trendy-green focus-visible:ring-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Min.</SelectItem>
                    <SelectItem value="30">30 Min.</SelectItem>
                    <SelectItem value="45">45 Min.</SelectItem>
                    <SelectItem value="60">60 Min.</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.slotBlockDurations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full bg-trendy-pink hover:bg-trendy-pink/80 text-primary-foreground"
                    onClick={() => {
                      const newDurations = formData.slotBlockDurations.filter((_, i) => i !== index);
                      setFormData(prev => ({ 
                        ...prev, 
                        slotBlockDurations: newDurations
                      }));
                    }}
                  >
                    <Minus className="h-3 w-3 stroke-[3]" />
                  </Button>
                )}
              </div>
            );
          })}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFormData(prev => ({ 
              ...prev, 
              slotBlockDurations: [...prev.slotBlockDurations, 60]
            }))}
            className="w-full bg-trendy-green/10 hover:bg-trendy-green/20 text-trendy-green border-trendy-green"
          >
            <Plus className="h-4 w-4 mr-2" />
            Weiteren Termin hinzufügen
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Erstellt {formData.slotBlockDurations.length} aufeinanderfolgende Termine ab {formData.time}.
            <br />
            Gesamtdauer: {formData.slotBlockDurations.reduce((sum, d) => sum + d, 0)} Minuten
          </p>
        </div>
      </div>

      {/* Kranführer und Notizen */}
      <div className="space-y-4">
        <div>
          <Label className="text-trendy-navy font-medium">Kranführer</Label>
          <Select 
            value={formData.craneOperator} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, craneOperator: value }))}
          >
            <SelectTrigger className="w-full ring-trendy-cyan focus-visible:ring-2 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Max Mustermann">Max Mustermann (Kranführer)</SelectItem>
              <SelectItem value="Anna Schmidt">Anna Schmidt (Admin)</SelectItem>
              <SelectItem value="Tom Weber">Tom Weber (Kranführer)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-trendy-navy font-medium">Notizen</Label>
          <Textarea
            placeholder="Optionale Notizen zum Slot..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="ring-trendy-green focus-visible:ring-2 mt-1"
            rows={2}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className={`w-full bg-trendy-navy text-white hover:bg-trendy-navy/90 ${
          isSubmitting ? 'animate-bounce' : ''
        }`}
        disabled={isSubmitting}
      >
        <Anchor className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Erstelle Demo Termine...' : 
         formData.slotBlockDurations.length === 1 ? 'Demo Termin erstellen' : `${formData.slotBlockDurations.length} Demo Termine erstellen`}
      </Button>
    </form>
  );
}

// Live Vorschau Komponente
function SlotPreview() {
  const [formData] = useState({
    date: new Date(),
    time: "09:00",
    slotBlockDurations: [60, 45, 30] as (15 | 30 | 45 | 60)[]
  });

  const generatePreviewSlots = () => {
    const [startHour, startMinute] = formData.time.split(':').map(Number);
    let currentMinutes = startHour * 60 + startMinute;
    
    return formData.slotBlockDurations.map((duration, index) => {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMinute = currentMinutes % 60;
      const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
      
      const endMinutes = currentMinutes + duration;
      const slotEndHour = Math.floor(endMinutes / 60);
      const slotEndMinute = endMinutes % 60;
      const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
      
      const result = {
        id: index + 1,
        startTime: slotStartTime,
        endTime: slotEndTime,
        duration,
        color: index % 4 === 0 ? 'trendy-navy' : index % 4 === 1 ? 'trendy-cyan' : index % 4 === 2 ? 'trendy-green' : 'trendy-pink'
      };
      
      currentMinutes = endMinutes;
      return result;
    });
  };

  const previewSlots = generatePreviewSlots();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="h-4 w-4 text-trendy-navy" />
        <span className="text-sm font-medium">{format(formData.date, "dd.MM.yyyy")}</span>
      </div>
      
      {previewSlots.map((slot, index) => (
        <div
          key={slot.id}
          className={`p-3 rounded-lg border-l-4 bg-${slot.color}/10 border-l-${slot.color} hover-grow transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Termin {slot.id} • {slot.duration} Minuten
              </p>
            </div>
            <Badge variant="default">
              Slot {slot.id}
            </Badge>
          </div>
        </div>
      ))}
      
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Gesamtdauer: {previewSlots.reduce((sum, slot) => sum + slot.duration, 0)} Minuten
        </p>
      </div>
    </div>
  );
}

// Live Slot-Design Demo Komponente
function SlotDesignDemo() {
  const { settings } = useSlotDesign();
  const slotTypes = [
    {
      key: "available" as const,
      label: "Verfügbare Slots",
      description: "Slots, die gebucht werden können",
      icon: CheckCircle
    },
    {
      key: "booked" as const, 
      label: "Gebuchte Slots",
      description: "Bereits reservierte Slots",
      icon: CalendarIcon
    },
    {
      key: "blocked" as const,
      label: "Gesperrte Slots", 
      description: "Nicht buchbare Slots",
      icon: XCircle
    }
  ];

  return (
    <div className="space-y-4">
      {/* Info über Trendy Design */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <span className="font-medium">Aktueller Stil:</span>
          <Badge variant="default">
            Trendy Design
          </Badge>
        </div>
      </div>

      {/* Demo Slots - Like Design Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
        {slotTypes.map(({ key, label, icon: Icon }) => (
          <Card 
            key={key}
            className="transition-all hover:shadow-sm cursor-pointer rounded-lg shadow-sm border-0"
            style={{
              backgroundColor: settings[key].background,
              color: settings[key].text
            }}
          >
            <CardContent className="p-4 relative">
              {/* Status badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  className="text-xs border-0"
                  style={{
                    backgroundColor: settings[key].label,
                    color: "hsl(0 0% 100%)"
                  }}
                >
                  {key === "available" ? "Verfügbar" : key === "booked" ? "Gebucht" : "Gesperrt"}
                </Badge>
              </div>

              <div className="pr-16 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary-foreground" />
                  <span className="font-semibold text-primary-foreground">08:00</span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: "hsl(var(--primary-foreground) / 0.2)",
                      color: "hsl(var(--primary-foreground))",
                      borderColor: "transparent"
                    }}
                  >
                    60min
                  </Badge>
                </div>
                <div className="text-sm mb-2 text-primary-foreground">
                  Style Center Demo
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-foreground">
                  <UserCheck className="w-4 h-4 text-primary-foreground" />
                  <span>Kranführer: Max Mustermann</span>
                </div>
                {key === "booked" && (
                  <div className="flex items-center gap-2 text-sm mt-1 text-primary-foreground">
                    <User className="w-4 h-4 text-primary-foreground" />
                    <span>Gebucht von: Maria Schmidt</span>
                  </div>
                )}
              </div>

              {/* Bottom right icons for trendy style */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Icon className="w-3 h-3 text-primary-foreground" />
                {key === "booked" && <CalendarIcon className="w-3 h-3 text-primary-foreground" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <strong>Live Demo:</strong> Diese Slots verwenden das aktuelle Design aus den Einstellungen. 
        Änderungen in den Design-Einstellungen werden sofort hier und im Wochenkalender sichtbar.
      </div>
    </div>
  );
}

export default function StyleCenter() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [progress, setProgress] = useState(33);
  const [sliderValue, setSliderValue] = useState([50]);
  const [animationStates, setAnimationStates] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [tasks, setTasks] = useState([
    { id: 1, title: "Slot Management überprüfen", priority: "Hoch", color: "trendy-pink" },
    { id: 2, title: "Benutzer Registrierungen bearbeiten", priority: "Mittel", color: "trendy-cyan" },
    { id: 3, title: "Kalender synchronisieren", priority: "Niedrig", color: "trendy-green" },
    { id: 4, title: "Berichte generieren", priority: "Mittel", color: "trendy-navy" }
  ]);
  const [categories, setCategories] = useState([
    { id: 1, name: "Administrator", count: 5, icon: Shield },
    { id: 2, name: "Slot Manager", count: 12, icon: Anchor },
    { id: 3, name: "Standard Benutzer", count: 48, icon: User },
    { id: 4, name: "Premium Mitglieder", count: 23, icon: Star }
  ]);
  const [dropZones, setDropZones] = useState({
    backlog: [
      { id: 'demo1', title: "Dashboard Design überarbeiten", type: "task", color: "trendy-cyan" },
      { id: 'demo2', title: "API Performance optimieren", type: "task", color: "trendy-pink" }
    ],
    inProgress: [
      { id: 'demo3', title: "User Management", type: "task", color: "trendy-green" }
    ],
    completed: [
      { id: 'demo4', title: "Login System", type: "task", color: "trendy-navy" }
    ]
  });
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const { settings } = useSlotDesign();

  const triggerAnimation = (animationName: string, duration = 1000) => {
    setAnimationStates(prev => ({
      ...prev,
      [animationName]: true
    }));
    
    setTimeout(() => {
      setAnimationStates(prev => ({
        ...prev,
        [animationName]: false
      }));
    }, duration);
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: any, type: 'task' | 'category') => {
    setDraggedItem({ ...item, type });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...item, type }));
    
    // Add drag image effect
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, listType: 'task' | 'category') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || draggedItem.type !== listType) return;

    if (listType === 'task') {
      const newTasks = [...tasks];
      const draggedIndex = newTasks.findIndex(task => task.id === draggedItem.id);
      if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
        const [draggedTask] = newTasks.splice(draggedIndex, 1);
        const insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
        newTasks.splice(insertIndex, 0, draggedTask);
        setTasks(newTasks);
      }
    } else {
      const newCategories = [...categories];
      const draggedIndex = newCategories.findIndex(cat => cat.id === draggedItem.id);
      if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
        const [draggedCategory] = newCategories.splice(draggedIndex, 1);
        const insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
        newCategories.splice(insertIndex, 0, draggedCategory);
        setCategories(newCategories);
      }
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Drop Zone Handlers
  const handleDropZoneStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDropZoneDrop = (e: React.DragEvent, targetZone: keyof typeof dropZones) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;

    // Find and remove item from its current zone
    const newDropZones = { ...dropZones };
    let sourceZone: keyof typeof dropZones | null = null;

    // Find source zone
    Object.keys(newDropZones).forEach(zone => {
      const zoneKey = zone as keyof typeof dropZones;
      const itemIndex = newDropZones[zoneKey].findIndex(item => item.id === draggedItem.id);
      if (itemIndex !== -1) {
        sourceZone = zoneKey;
        newDropZones[zoneKey] = newDropZones[zoneKey].filter(item => item.id !== draggedItem.id);
      }
    });

    // Add item to target zone if different from source
    if (sourceZone !== targetZone) {
      newDropZones[targetZone] = [...newDropZones[targetZone], draggedItem];
      
      // Trigger bounce animation
      setAnimatingItems(prev => new Set([...prev, draggedItem.id]));
      setTimeout(() => {
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(draggedItem.id);
          return newSet;
        });
      }, 600);
    }

    setDropZones(newDropZones);
    setDraggedItem(null);
  };

  return (
    <TooltipProvider>
      <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="p-6 space-y-12 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-deep bg-clip-text text-transparent flex items-center gap-4">
                <Palette className="h-10 w-10 text-primary" />
                Style Center
              </h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Umfassende Designelemente-Übersicht mit trendigen Effekten und Micro-Animationen
              </p>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-card border rounded-lg shadow-sm">
              <Sun className="h-5 w-5 text-yellow-500" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleDarkModeToggle}
              />
              <Moon className="h-5 w-5 text-blue-500" />
              <Label className="font-medium">Dark Mode</Label>
            </div>
          </div>

          {/* Navigation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Schnellnavigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: "#colors", label: "Farben", icon: Palette },
                  { href: "#icons", label: "Icons", icon: Star },
                  { href: "#typography", label: "Schriften", icon: Code },
                  { href: "#buttons", label: "Buttons", icon: Mouse },
                  { href: "#forms", label: "Formulare", icon: Code },
                  { href: "#cards", label: "Karten", icon: Layers },
                  { href: "#animations", label: "Animationen", icon: Move },
                  { href: "#drag-drop", label: "Drag & Drop", icon: MoveHorizontal },
                  { href: "#switches", label: "Switches", icon: RefreshCw },
                  { href: "#slots", label: "Slots", icon: Anchor },
                  { href: "#timepicker", label: "Zeit & Kalender", icon: Clock },
                  { href: "#components", label: "Komponenten", icon: Settings }
                ].map((item) => (
                  <Button
                    key={item.href}
                    variant="outline"
                    size="sm"
                    className="hover-grow"
                    onClick={() => document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Icons Section */}
          <section id="icons">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Star className="h-6 w-6 text-trendy-pink" />
                  Icon-Bibliothek
                </CardTitle>
                <CardDescription className="text-base">
                  Maritime und App-Icons für den Hafenmanager
                </CardDescription>
              </CardHeader>
               <CardContent className="space-y-8">
                 {/* Maritime Icons */}
                 <div className="space-y-6">
                   <h4 className="text-lg font-semibold mb-6 text-foreground">Maritime Icons</h4>
                    <div className="grid grid-cols-5 gap-6">
                      {[
                        { Icon: Anchor, name: "Anker" },
                        { Icon: Ship, name: "Schiff" },
                        { Icon: Waves, name: "Wellen" },
                        { Icon: Compass, name: "Kompass" },
                        { Icon: Navigation, name: "Navigation" },
                        { Icon: MapPin, name: "Position" },
                        { Icon: Truck, name: "LKW" },
                        { Icon: Construction, name: "Kran" },
                        { Icon: Wind, name: "Wind" },
                        { Icon: Fish, name: "Fisch" },
                        { Icon: Sailboat, name: "Segelboot" },
                        { Icon: Shield, name: "Schutz" }
                      ].map(({ Icon, name }) => (
                        <div key={name} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                          <Icon className="h-6 w-6 text-trendy-navy hover:text-trendy-cyan transition-colors" strokeWidth={1} />
                         <span className="text-xs text-muted-foreground text-center font-medium">{name}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* App Icons */}
                 <div className="space-y-6">
                   <h4 className="text-lg font-semibold mb-6 text-foreground">App Icons</h4>
                    <div className="grid grid-cols-5 gap-6">
                      {[
                        { Icon: Home, name: "Dashboard" },
                        { Icon: CalendarIcon, name: "Kalender" },
                        { Icon: Clock, name: "TimePicker" },
                        { Icon: Users, name: "Nutzer" },
                        { Icon: User, name: "Profil" },
                        { Icon: UserCheck, name: "User Check" },
                        { Icon: Settings, name: "Einstellungen" },
                        { Icon: Bell, name: "Benachrichtigung" },
                        { Icon: FileText, name: "Dokumente" },
                        { Icon: Layers, name: "Slot Manager" },
                        { Icon: Menu, name: "Menü" },
                        { Icon: TestTube, name: "Test Daten" },
                        { Icon: MessageSquare, name: "Nachrichten" },
                        { Icon: Search, name: "Suche" },
                        { Icon: Filter, name: "Filter" },
                        { Icon: Eye, name: "Ansicht" },
                        { Icon: EyeOff, name: "Verstecken" },
                        { Icon: Palette, name: "Design" }
                      ].map(({ Icon, name }) => (
                        <div key={name} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                          <Icon className="h-6 w-6 text-trendy-navy hover:text-trendy-cyan transition-colors" strokeWidth={1} />
                         <span className="text-xs text-muted-foreground text-center font-medium">{name}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Action Icons */}
                 <div className="space-y-6">
                   <h4 className="text-lg font-semibold mb-6 text-foreground">Action Icons</h4>
                    <div className="grid grid-cols-5 gap-6">
                      {[
                        { Icon: Plus, name: "Hinzufügen" },
                        { Icon: Edit, name: "Bearbeiten" },
                        { Icon: Trash2, name: "Löschen" },
                        { Icon: Save, name: "Speichern" },
                        { Icon: Download, name: "Download" },
                        { Icon: Upload, name: "Upload" },
                        { Icon: RefreshCw, name: "Aktualisieren" },
                        { Icon: Check, name: "Bestätigen" },
                        { Icon: X, name: "Schließen" },
                        { Icon: Send, name: "Senden" },
                        { Icon: Mail, name: "E-Mail" },
                        { Icon: Phone, name: "Telefon" },
                        { Icon: BookOpen, name: "Handbuch" },
                        { Icon: CalendarDays, name: "Termine" },
                        { Icon: ArrowRight, name: "Weiter" },
                        { Icon: Move, name: "Verschieben" },
                        { Icon: Maximize2, name: "Vergrößern" },
                        { Icon: Minimize2, name: "Verkleinern" }
                      ].map(({ Icon, name }) => (
                        <div key={name} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                          <Icon className="h-6 w-6 text-trendy-navy hover:text-trendy-cyan transition-colors" strokeWidth={1} />
                         <span className="text-xs text-muted-foreground text-center font-medium">{name}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Status & Alert Icons */}
                 <div className="space-y-6">
                   <h4 className="text-lg font-semibold mb-6 text-foreground">Status & Alert Icons</h4>
                    <div className="grid grid-cols-5 gap-6">
                      {[
                        { Icon: CheckCircle, name: "Erfolg" },
                        { Icon: AlertTriangle, name: "Warnung" },
                        { Icon: XCircle, name: "Fehler" },
                        { Icon: AlertCircle, name: "Info" },
                        { Icon: Info, name: "Information" },
                        { Icon: TrendingUp, name: "Trend ↗" },
                        { Icon: Database, name: "Datenbank" },
                        { Icon: Euro, name: "Euro" },
                        { Icon: CreditCard, name: "Zahlung" },
                        { Icon: Wrench, name: "Werkzeug" },
                        { Icon: UserPlus, name: "User +" },
                        { Icon: Smile, name: "Zufrieden" },
                        { Icon: Heart, name: "Favorit" },
                        { Icon: Star, name: "Bewertung" },
                        { Icon: Zap, name: "Schnell" },
                        { Icon: Sparkles, name: "Neu" }
                      ].map(({ Icon, name }) => (
                        <div key={name} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                          <Icon className="h-6 w-6 text-trendy-navy hover:text-trendy-cyan transition-colors" strokeWidth={1} />
                         <span className="text-xs text-muted-foreground text-center font-medium">{name}</span>
                       </div>
                     ))}
                   </div>
                  </div>

                  {/* Icon Größen-Beispiele */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold mb-6 text-foreground">Icon Größen-Beispiele</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      {[
                        { size: "h-4 w-4", px: "16px", name: "Klein" },
                        { size: "h-6 w-6", px: "24px", name: "Standard" },
                        { size: "h-8 w-8", px: "32px", name: "Mittel" },
                        { size: "h-12 w-12", px: "48px", name: "Groß" }
                      ].map(({ size, px, name }) => (
                        <div key={size} className="flex flex-col items-center gap-3 p-4 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors">
                          <Home className={`${size} text-trendy-navy`} strokeWidth={1} />
                          <div className="text-center">
                            <div className="font-medium text-sm">{name}</div>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">{size}</code>
                            <div className="text-xs text-muted-foreground mt-1">{px}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-harbor-mist rounded-lg">
                   <h5 className="text-gray-800 dark:text-white font-semibold mb-2">Icon Design Prinzipien</h5>
                   <p className="text-gray-600 dark:text-gray-200 text-sm">
                     Alle Icons verwenden einen dünnen, modernen Stil (strokeWidth: 1.5) und 
                     maritime Farbakzente für bessere Wiedererkennung im Hafenkontext.
                   </p>
                 </div>
               </CardContent>
            </Card>
          </section>

          {/* Trendy Color Palette */}
          <section id="colors">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Palette className="h-6 w-6 text-trendy-pink" />
                  Trendy Farbpalette
                </CardTitle>
                <CardDescription className="text-base">
                  Moderne Farbpalette basierend auf aktuellen Design-Trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group cursor-pointer">
                        <div className="h-32 bg-trendy-pink rounded-lg hover-lift shadow-lg flex items-center justify-center transition-all duration-300">
                          <Heart className="h-8 w-8 text-white group-hover:scale-125 transition-transform" />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-trendy-pink text-lg">Trendy Pink</div>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block">#EE4266</code>
                          <div className="text-xs text-muted-foreground mt-1">Akzent & CTA</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hauptakzentfarbe für Call-to-Actions und wichtige Elemente</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group cursor-pointer">
                        <div className="h-32 bg-trendy-navy rounded-lg hover-lift shadow-lg flex items-center justify-center transition-all duration-300">
                          <Shield className="h-8 w-8 text-white group-hover:scale-125 transition-transform" />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-trendy-navy text-lg">Trendy Navy</div>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block">#0B4F6C</code>
                          <div className="text-xs text-muted-foreground mt-1">Text & Header</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Primäre Textfarbe und Überschriften für hohen Kontrast</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group cursor-pointer">
                        <div className="h-32 bg-trendy-cyan rounded-lg hover-lift shadow-lg flex items-center justify-center transition-all duration-300">
                          <Waves className="h-8 w-8 text-white group-hover:scale-125 transition-transform" />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-trendy-cyan text-lg">Trendy Cyan</div>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block">#01BAEF</code>
                          <div className="text-xs text-muted-foreground mt-1">Links & Info</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Informative Elemente und interaktive Links</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group cursor-pointer">
                        <div className="h-32 bg-trendy-light-green rounded-lg hover-lift shadow-lg flex items-center justify-center transition-all duration-300">
                          <Sparkles className="h-8 w-8 text-green-700 group-hover:scale-125 transition-transform" />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-green-700 text-lg">Light Green</div>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block">#D0FCB3</code>
                          <div className="text-xs text-muted-foreground mt-1">Success BG</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hintergrund für Erfolgs- und Bestätigungsnachrichten</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group cursor-pointer">
                        <div className="h-32 bg-trendy-green rounded-lg hover-lift shadow-lg flex items-center justify-center transition-all duration-300">
                          <CheckCircle className="h-8 w-8 text-white group-hover:scale-125 transition-transform" />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="font-bold text-trendy-green text-lg">Trendy Green</div>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block">#9BC59D</code>
                          <div className="text-xs text-muted-foreground mt-1">Success & OK</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Erfolgsmeldungen und positive Status-Indikatoren</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-foreground">Maritime Gradients & Kombinationen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 bg-gradient-maritime-sunset rounded-lg flex items-center justify-center text-white font-bold hover-lift">
                      Maritime Sunset
                    </div>
                    <div className="h-24 bg-gradient-ocean-breeze rounded-lg flex items-center justify-center text-white font-bold hover-lift">
                      Ocean Breeze
                    </div>
                    <div className="h-24 bg-gradient-harbor-mist rounded-lg flex items-center justify-center text-gray-800 dark:text-white font-bold hover-lift">
                      Harbor Mist
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Typography Section */}
          <section id="typography">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Code className="h-6 w-6 text-trendy-green" />
                  Typography & Schriftarten
                </CardTitle>
                <CardDescription className="text-base">
                  Schriftarten, -größen und typographische Elemente für harmonisches Design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-foreground">Überschriften & Headlines</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h1 className="text-5xl font-bold text-foreground mb-2">Headline H1</h1>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-5xl font-bold</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h2 className="text-4xl font-semibold text-foreground mb-2">Headline H2</h2>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-4xl font-semibold</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h3 className="text-3xl font-medium text-foreground mb-2">Headline H3</h3>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-3xl font-medium</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h4 className="text-2xl font-medium text-foreground mb-2">Headline H4</h4>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-2xl font-medium</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-foreground">Fließtext & Paragraphen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                        Großer Fließtext für einleitende Paragraphen und wichtige Textabschnitte. Optimal für Lesbarkeit und Aufmerksamkeit.
                      </p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-lg leading-relaxed</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-base text-gray-600 dark:text-gray-400 mb-2 leading-normal">
                        Standard Fließtext für reguläre Inhalte. Perfekt ausbalanciert für längere Texte und gute Lesbarkeit auf allen Geräten.
                      </p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-base leading-normal</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                        Kleinerer Text für Hilfstexte, Beschreibungen und sekundäre Informationen.
                      </p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-sm</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400 dark:text-gray-600 mb-2">
                        Sehr kleiner Text für Copyright, Disclaimers und minimale Informationen.
                      </p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">text-xs</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-foreground">Schrift-Gewichtungen & Stile</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <p className="text-xl font-thin text-foreground mb-2">Thin 100</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">font-thin</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <p className="text-xl font-light text-foreground mb-2">Light 300</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">font-light</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <p className="text-xl font-normal text-foreground mb-2">Normal 400</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">font-normal</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <p className="text-xl font-medium text-foreground mb-2">Medium 500</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">font-medium</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <p className="text-xl font-semibold text-foreground mb-2">Semibold 600</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">font-semibold</code>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <p className="text-xl font-bold text-foreground mb-2">Bold 700</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">font-bold</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-foreground">Spezielle Typographie-Effekte</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-trendy-pink to-trendy-cyan bg-clip-text text-transparent mb-2">
                        Gradient Text
                      </h3>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">bg-gradient-to-r bg-clip-text text-transparent</code>
                    </div>
                    
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <h3 className="text-3xl font-bold text-trendy-navy drop-shadow-lg mb-2">
                        Shadow Text
                      </h3>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">drop-shadow-lg</code>
                    </div>
                    
                    <div className="p-6 bg-trendy-navy rounded-lg text-center">
                      <h3 className="text-3xl font-bold text-white glow-text mb-2">
                        Glow Effect
                      </h3>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-900">glow-text (custom)</code>
                    </div>
                    
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                      <h3 className="text-3xl font-bold text-trendy-green uppercase tracking-wider mb-2">
                        Spaced Caps
                      </h3>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">uppercase tracking-wider</code>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Spezieller Text & Listen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h5 className="font-semibold text-trendy-navy mb-3">Aufzählung mit maritimen Icons</h5>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Anchor className="h-4 w-4 text-trendy-cyan" />
                          <span>Krantermine verwalten</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Waves className="h-4 w-4 text-trendy-cyan" />
                          <span>Hafenaktivitäten planen</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-trendy-cyan" />
                          <span>Sicherheitsprotokoll befolgen</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <blockquote className="border-l-4 border-trendy-pink pl-4 italic text-trendy-navy">
                        "Exzellente Hafenverwaltung beginnt mit organisierter Terminplanung und effizienter Kommunikation."
                      </blockquote>
                      <cite className="text-sm text-gray-500 mt-2 block">— KSVL Management</cite>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Button Variants */}
          <section id="buttons">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Mouse className="h-6 w-6 text-trendy-cyan" />
                  Button Varianten & Interaktionen
                </CardTitle>
                <CardDescription className="text-base">
                  Alle Button-Styles mit reduzierten Rundungen und modernen Hover-Effekten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Standard Varianten</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="default" className="hover-lift">Default</Button>
                    <Button variant="secondary" className="hover-grow">Secondary</Button>
                    <Button variant="outline" className="hover-glow">Outline</Button>
                    <Button variant="ghost" className="hover-shrink">Ghost</Button>
                    <Button variant="destructive" className="hover-rotate">Destructive</Button>
                    <Button className="bg-trendy-pink text-white hover:bg-trendy-pink/90 hover-lift">
                      <Heart className="h-4 w-4 mr-2" />
                      Pink
                    </Button>
                    <Button className="bg-trendy-navy text-white hover:bg-trendy-navy/90 hover-grow">
                      <Shield className="h-4 w-4 mr-2" />
                      Navy
                    </Button>
                    <Button className="bg-trendy-cyan text-white hover:bg-trendy-cyan/90 pulse-glow">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Cyan Glow
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Interactive Animationen</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      className={`hover-grow bg-trendy-navy text-white ${animationStates.buttonBounce ? 'micro-bounce' : ''}`}
                      onClick={() => triggerAnimation('buttonBounce')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Bounce
                    </Button>
                    <Button 
                      className={`hover-lift bg-trendy-pink text-white ${animationStates.buttonPulse ? 'animate-pulse' : ''}`}
                      onClick={() => triggerAnimation('buttonPulse')}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Pulse
                    </Button>
                    <Button 
                      className={`hover-glow bg-trendy-cyan text-white ${animationStates.buttonRotate ? 'hover-rotate' : ''}`}
                      onClick={() => triggerAnimation('buttonRotate')}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                    <Button 
                      className={`hover-shrink bg-trendy-green text-white ${animationStates.buttonScale ? 'scale-110' : ''}`}
                      onClick={() => triggerAnimation('buttonScale')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Scale
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Button Größen & Icons</h4>
                  <div className="flex flex-wrap gap-4 items-end">
                    <Button size="sm" variant="outline" className="text-trendy-pink border-trendy-pink">
                      <Plus className="h-3 w-3 mr-1" />
                      Klein
                    </Button>
                    <Button variant="outline" className="text-trendy-cyan border-trendy-cyan">
                      <Settings className="h-4 w-4 mr-2" />
                      Standard
                    </Button>
                    <Button size="lg" variant="outline" className="text-trendy-green border-trendy-green">
                      <Download className="h-5 w-5 mr-2" />
                      Groß
                    </Button>
                    <Button size="icon" variant="outline" className="text-trendy-navy border-trendy-navy">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Forms & Input Elements */}
          <section id="forms">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Code className="h-6 w-6 text-trendy-green" />
                  Formular-Elemente & Eingabefelder
                </CardTitle>
                <CardDescription className="text-base">
                  Verschiedene Formular-Komponenten mit reduzierten Rundungen und fokusierten Zuständen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-trendy-navy">Eingabefelder</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-trendy-navy font-medium">Email Adresse</Label>
                        <Input 
                          type="email" 
                          id="email" 
                          placeholder="me@example.com" 
                          className="ring-trendy-cyan focus-visible:ring-2 mt-1" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="password" className="text-trendy-navy font-medium">Passwort</Label>
                        <Input 
                          type="password" 
                          id="password" 
                          placeholder="••••••••" 
                          className="ring-trendy-pink focus-visible:ring-2 mt-1" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="search" className="text-trendy-navy font-medium">Suche</Label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            type="search" 
                            id="search" 
                            placeholder="Suchen..." 
                            className="pl-10 ring-trendy-green focus-visible:ring-2" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-trendy-navy">Auswahl-Elemente</h4>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-trendy-navy font-medium">Dropdown Auswahl</Label>
                        <Select>
                          <SelectTrigger className="w-full ring-trendy-cyan focus-visible:ring-2 mt-1">
                            <SelectValue placeholder="Wähle eine Option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="option1">Option 1</SelectItem>
                            <SelectItem value="option2">Option 2</SelectItem>
                            <SelectItem value="option3">Option 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-trendy-navy font-medium">Radio Gruppe</Label>
                        <RadioGroup defaultValue="option1" className="mt-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option1" id="r1" className="text-trendy-pink" />
                            <Label htmlFor="r1">Option 1</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option2" id="r2" className="text-trendy-cyan" />
                            <Label htmlFor="r2">Option 2</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option3" id="r3" className="text-trendy-green" />
                            <Label htmlFor="r3">Option 3</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-trendy-navy">Textarea & Checkboxen</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <Label htmlFor="message" className="text-trendy-navy font-medium">Nachricht</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Ihre Nachricht hier..." 
                        className="ring-trendy-green focus-visible:ring-2 mt-1 min-h-[120px]" 
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" className="ring-trendy-navy focus-visible:ring-2" />
                        <Label htmlFor="terms" className="text-sm">Ich akzeptiere die Nutzungsbedingungen</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="newsletter" className="ring-trendy-pink focus-visible:ring-2" />
                        <Label htmlFor="newsletter" className="text-sm">Newsletter abonnieren</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="marketing" className="ring-trendy-cyan focus-visible:ring-2" />
                        <Label htmlFor="marketing" className="text-sm">Marketing-E-Mails erhalten</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Slot Termin-Konfiguration Demo */}
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Slot Termin-Konfiguration</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formular */}
                    <div className="space-y-6">
                      <SlotTerminDemo />
                    </div>
                    
                    {/* Live Vorschau */}
                    <div className="space-y-4">
                      <Label className="text-trendy-navy font-medium">Live Vorschau</Label>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <SlotPreview />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Design-Umschaltung Demo</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Live Slot-Design Demo */}
                    <div className="space-y-4">
                      <Label className="text-trendy-navy font-medium">Live Slot-Design aus Einstellungen</Label>
                      <SlotDesignDemo />
                    </div>
                    
                    {/* Informationen */}
                    <div className="space-y-4">
                      <Label className="text-trendy-navy font-medium">Design-System Information</Label>
                      <div className="p-4 border rounded-lg bg-trendy-navy/5">
                        <div className="flex items-start gap-3">
                          <Settings className="w-5 h-5 text-trendy-navy mt-0.5" />
                          <div>
                            <h5 className="font-medium text-trendy-navy">Slot-Design Umschaltung</h5>
                            <p className="text-sm text-muted-foreground mt-1">
                              In den Einstellungen kann zwischen dem klassischen Design und dem 
                              trendy Style Center Design umgeschaltet werden. Die Änderung 
                              wirkt sich sofort auf alle Slot-Darstellungen im Wochenkalender aus.
                            </p>
                            <div className="mt-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => document.querySelector('[data-section="design"]')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-trendy-navy border-trendy-navy hover:bg-trendy-navy/10"
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Zu den Design-Einstellungen
                              </Button>
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       {/* Trendy Slot Farbwerte Dokumentation */}
                       <div className="p-4 border rounded-lg bg-trendy-cyan/5">
                         <div className="flex items-start gap-3">
                           <Palette className="w-5 h-5 text-trendy-cyan mt-0.5" />
                           <div className="w-full">
                             <h5 className="font-medium text-trendy-navy mb-3">Trendy Slot Farbwerte</h5>
                             
                             {/* Available Slot */}
                             <div className="mb-4">
                               <h6 className="text-sm font-semibold text-trendy-green mb-2">Available (Verfügbar)</h6>
                               <div className="grid grid-cols-2 gap-2 text-xs">
                                 <div>
                                   <span className="font-medium">Hintergrund:</span> hsl(133, 28%, 68%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Schriftfarbe:</span> hsl(0, 0%, 100%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Icons:</span> hsl(0, 0%, 100%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Label-Farbe:</span> hsl(133, 28%, 58%)
                                 </div>
                                 <div className="col-span-2">
                                   <span className="font-medium">Label-Schriftfarbe:</span> hsl(0, 0%, 100%)
                                 </div>
                               </div>
                             </div>
                             
                             {/* Booked Slot */}
                             <div className="mb-4">
                               <h6 className="text-sm font-semibold text-trendy-cyan mb-2">Booked (Gebucht)</h6>
                               <div className="grid grid-cols-2 gap-2 text-xs">
                                 <div>
                                   <span className="font-medium">Hintergrund:</span> hsl(202, 85%, 23%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Schriftfarbe:</span> hsl(0, 0%, 100%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Icons:</span> hsl(0, 0%, 100%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Label-Farbe:</span> hsl(194, 99%, 47%)
                                 </div>
                                 <div className="col-span-2">
                                   <span className="font-medium">Label-Schriftfarbe:</span> hsl(0, 0%, 100%)
                                 </div>
                               </div>
                             </div>
                             
                             {/* Blocked Slot */}
                             <div>
                               <h6 className="text-sm font-semibold text-trendy-pink mb-2">Blocked (Gesperrt)</h6>
                               <div className="grid grid-cols-2 gap-2 text-xs">
                                 <div>
                                   <span className="font-medium">Hintergrund:</span> hsl(348, 77%, 67%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Schriftfarbe:</span> hsl(0, 0%, 100%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Icons:</span> hsl(0, 0%, 100%)
                                 </div>
                                 <div>
                                   <span className="font-medium">Label-Farbe:</span> hsl(348, 77%, 57%)
                                 </div>
                                 <div className="col-span-2">
                                   <span className="font-medium">Label-Schriftfarbe:</span> hsl(0, 0%, 100%)
                                 </div>
                               </div>
                             </div>
                             
                             <div className="mt-3 p-2 bg-trendy-navy/5 rounded text-xs text-muted-foreground">
                               <strong>Hinweis:</strong> Diese Farbwerte werden für alle trendy Slot-Darstellungen 
                               in der Wochenansicht, Slot-Verwaltung und Design-Einstellungen verwendet.
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-trendy-navy">Slider & Progress</h4>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-trendy-navy font-medium">Wert-Slider: {sliderValue[0]}</Label>
                      <Slider
                        value={sliderValue}
                        onValueChange={setSliderValue}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-trendy-navy font-medium">Fortschritt</Label>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Card Layouts */}
          <section id="cards">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Layers className="h-6 w-6 text-trendy-navy" />
                  Karten-Layouts & Design
                </CardTitle>
                <CardDescription className="text-base">
                  Verschiedene Karten-Layouts mit reduzierten Rundungen und subtilen Schatten-Effekten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="shadow-card-maritime hover-grow transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-trendy-navy">
                        <Users className="h-5 w-5" />
                        Benutzer-Info
                      </CardTitle>
                      <CardDescription>Erweiterte Benutzerinformationen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-trendy-pink text-white">JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">John Doe</p>
                          <p className="text-sm text-muted-foreground">Administrator</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="success">Aktiv</Badge>
                        <Badge variant="outline" className="border-trendy-cyan text-trendy-cyan">Premium</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-elevated-maritime hover-lift border-l-4 border-l-trendy-pink">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-trendy-pink">
                        <AlertTriangle className="h-5 w-5" />
                        Wichtiger Hinweis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Alert className="border-trendy-pink bg-pink-50 dark:bg-pink-950/10">
                        <AlertTriangle className="h-4 w-4 text-trendy-pink" />
                        <AlertDescription className="text-trendy-navy">
                          Dies ist eine wichtige Benachrichtigung, die besondere Aufmerksamkeit erfordert.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card-maritime hover-glow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-trendy-cyan">
                        <Bell className="h-5 w-5" />
                        Benachrichtigungen
                      </CardTitle>
                      <CardDescription>Aktuelle System-Updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/10 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-trendy-green mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Update erfolgreich</p>
                          <p className="text-muted-foreground">Version 2.1.0 installiert</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/10 rounded-lg">
                        <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Wartung geplant</p>
                          <p className="text-muted-foreground">Morgen 03:00 - 04:00</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Spezial-Karten</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-trendy-pink/10 to-trendy-cyan/10 border-trendy-pink hover-lift">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-trendy-pink">
                          <Star className="h-5 w-5" />
                          Premium Feature
                        </CardTitle>
                        <CardDescription>Exklusive Funktionen für Premium-Benutzer</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-trendy-green" />
                            <span className="text-sm">Erweiterte Analytik</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-trendy-green" />
                            <span className="text-sm">Priority Support</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-trendy-green" />
                            <span className="text-sm">Custom Branding</span>
                          </div>
                        </div>
                        <Button className="w-full bg-trendy-pink text-white hover:bg-trendy-pink/90">
                          Upgrade jetzt
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover-grow border-2 border-dashed border-trendy-cyan">
                      <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-trendy-cyan">
                          <Upload className="h-5 w-5" />
                          Datei Upload
                        </CardTitle>
                        <CardDescription>Drag & Drop Bereich</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <div className="border-2 border-dashed border-trendy-cyan rounded-lg p-8 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors">
                          <Upload className="h-8 w-8 text-trendy-cyan mx-auto mb-3" />
                          <p className="text-trendy-navy font-medium">Dateien hier ablegen</p>
                          <p className="text-sm text-muted-foreground mt-1">oder klicken zum Auswählen</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Micro Animations */}
          <section id="animations">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Move className="h-6 w-6 text-trendy-pink" />
                  Micro-Animationen & Interaktive Effekte
                </CardTitle>
                <CardDescription className="text-base">
                  Klicke auf die Buttons um verschiedene Animationen zu testen - jede Animation wird einzeln ausgelöst
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Bewegungsanimationen</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Button 
                      variant="outline"
                      className={`border-trendy-cyan text-trendy-cyan hover:bg-trendy-cyan hover:text-white transition-all duration-300 ${animationStates.bounce ? 'micro-bounce' : ''}`}
                      onClick={() => triggerAnimation('bounce')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Bounce
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className={`border-trendy-pink text-trendy-pink hover:bg-trendy-pink hover:text-white transition-all duration-300 ${animationStates.wiggle ? 'wiggle' : ''}`}
                      onClick={() => triggerAnimation('wiggle')}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Wiggle
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className={`border-trendy-green text-trendy-green hover:bg-trendy-green hover:text-white transition-all duration-300 ${animationStates.slideUp ? 'slide-up' : ''}`}
                      onClick={() => triggerAnimation('slideUp')}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Slide Up
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className={`border-trendy-navy text-trendy-navy hover:bg-trendy-navy hover:text-white transition-all duration-300 ${animationStates.slideDown ? 'slide-down' : ''}`}
                      onClick={() => triggerAnimation('slideDown')}
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Slide Down
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-pink text-trendy-pink hover:bg-trendy-pink hover:text-white transition-all duration-300 ${animationStates.slideLeft ? 'slide-left' : ''}`}
                      onClick={() => triggerAnimation('slideLeft')}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Slide Left
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-cyan text-trendy-cyan hover:bg-trendy-cyan hover:text-white transition-all duration-300 ${animationStates.slideRight ? 'slide-right' : ''}`}
                      onClick={() => triggerAnimation('slideRight')}
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Slide Right
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-green text-trendy-green hover:bg-trendy-green hover:text-white transition-all duration-300 ${animationStates.pulse ? 'animate-pulse' : ''}`}
                      onClick={() => triggerAnimation('pulse')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Pulse
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-navy text-trendy-navy hover:bg-trendy-navy hover:text-white transition-all duration-300 ${animationStates.spin ? 'animate-spin' : ''}`}
                      onClick={() => triggerAnimation('spin', 2000)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Spin
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-pink text-trendy-pink hover:bg-trendy-pink hover:text-white transition-all duration-300 ${animationStates.fade ? 'animate-fade-in' : ''}`}
                      onClick={() => triggerAnimation('fade')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Fade In
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-cyan text-trendy-cyan hover:bg-trendy-cyan hover:text-white transition-all duration-300 ${animationStates.scale ? 'animate-scale-in' : ''}`}
                      onClick={() => triggerAnimation('scale')}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Scale In
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-green text-trendy-green hover:bg-trendy-green hover:text-white transition-all duration-300 ${animationStates.scaleUp ? 'scale-up' : ''}`}
                      onClick={() => triggerAnimation('scaleUp')}
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Scale Up
                    </Button>

                    <Button 
                      variant="outline"
                      className={`border-trendy-navy text-trendy-navy hover:bg-trendy-navy hover:text-white transition-all duration-300 ${animationStates.rotateIn ? 'rotate-in' : ''}`}
                      onClick={() => triggerAnimation('rotateIn')}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotate In
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Kombinierte Animationen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                      className={`p-6 border-2 border-dashed border-trendy-cyan rounded-lg text-center cursor-pointer transition-all duration-500 hover:shadow-lg ${
                        animationStates.multiAnimation1 ? 'animate-bounce scale-110' : ''
                      }`}
                      onClick={() => triggerAnimation('multiAnimation1', 1500)}
                    >
                      <CornerDownRight className="h-8 w-8 mx-auto mb-3 text-trendy-cyan" />
                      <h5 className="font-semibold text-trendy-cyan">Bounce + Scale</h5>
                      <p className="text-sm text-muted-foreground mt-1">Klicken zum Testen</p>
                    </div>

                    <div 
                      className={`p-6 border-2 border-dashed border-trendy-pink rounded-lg text-center cursor-pointer transition-all duration-700 hover:shadow-lg ${
                        animationStates.multiAnimation2 ? 'animate-fade-in wiggle' : ''
                      }`}
                      onClick={() => triggerAnimation('multiAnimation2', 1800)}
                    >
                      <Sparkles className="h-8 w-8 mx-auto mb-3 text-trendy-pink" />
                      <h5 className="font-semibold text-trendy-pink">Fade + Wiggle</h5>
                      <p className="text-sm text-muted-foreground mt-1">Klicken zum Testen</p>
                    </div>

                    <div 
                      className={`p-6 border-2 border-dashed border-trendy-green rounded-lg text-center cursor-pointer transition-all duration-600 hover:shadow-lg ${
                        animationStates.multiAnimation3 ? 'slide-up animate-pulse' : ''
                      }`}
                      onClick={() => triggerAnimation('multiAnimation3', 2000)}
                    >
                      <Star className="h-8 w-8 mx-auto mb-3 text-trendy-green" />
                      <h5 className="font-semibold text-trendy-green">Slide + Pulse</h5>
                      <p className="text-sm text-muted-foreground mt-1">Klicken zum Testen</p>
                    </div>
                  </div>
                </div>

                <h5 className="text-md font-semibold mb-4 text-trendy-navy">Erweiterte Kombinationen</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div 
                    className={`p-4 border-2 border-dashed border-trendy-navy rounded-lg text-center cursor-pointer transition-all duration-800 hover:shadow-lg ${
                      animationStates.multiAnimation4 ? 'animate-spin scale-125 animate-fade-in' : ''
                    }`}
                    onClick={() => triggerAnimation('multiAnimation4', 2500)}
                  >
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 text-trendy-navy" />
                    <h6 className="font-semibold text-sm text-trendy-navy">Spin + Scale + Fade</h6>
                  </div>

                  <div 
                    className={`p-4 border-2 border-dashed border-trendy-pink rounded-lg text-center cursor-pointer transition-all duration-1000 hover:shadow-lg ${
                      animationStates.multiAnimation5 ? 'wiggle slide-up hover-glow' : ''
                    }`}
                    onClick={() => triggerAnimation('multiAnimation5', 2200)}
                  >
                    <Zap className="h-6 w-6 mx-auto mb-2 text-trendy-pink" />
                    <h6 className="font-semibold text-sm text-trendy-pink">Wiggle + Slide + Glow</h6>
                  </div>

                  <div 
                    className={`p-4 border-2 border-dashed border-trendy-cyan rounded-lg text-center cursor-pointer transition-all duration-900 hover:shadow-lg ${
                      animationStates.multiAnimation6 ? 'animate-bounce rotate-in scale-110' : ''
                    }`}
                    onClick={() => triggerAnimation('multiAnimation6', 2000)}
                  >
                    <RotateCw className="h-6 w-6 mx-auto mb-2 text-trendy-cyan" />
                    <h6 className="font-semibold text-sm text-trendy-cyan">Bounce + Rotate + Scale</h6>
                  </div>

                  <div 
                    className={`p-4 border-2 border-dashed border-trendy-green rounded-lg text-center cursor-pointer transition-all duration-1200 hover:shadow-lg ${
                      animationStates.multiAnimation7 ? 'animate-pulse slide-left hover-lift' : ''
                    }`}
                    onClick={() => triggerAnimation('multiAnimation7', 2400)}
                  >
                    <Heart className="h-6 w-6 mx-auto mb-2 text-trendy-green" />
                    <h6 className="font-semibold text-sm text-trendy-green">Pulse + Slide + Lift</h6>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Hover-Effekte (permanente CSS-Klassen)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg hover-lift cursor-pointer text-center">
                      <ArrowUp className="h-6 w-6 mx-auto mb-2 text-trendy-cyan" />
                      <p className="text-sm font-medium">Hover Lift</p>
                    </div>
                    <div className="p-4 border rounded-lg hover-grow cursor-pointer text-center">
                      <Plus className="h-6 w-6 mx-auto mb-2 text-trendy-pink" />
                      <p className="text-sm font-medium">Hover Grow</p>
                    </div>
                    <div className="p-4 border rounded-lg hover-glow cursor-pointer text-center">
                      <Sparkles className="h-6 w-6 mx-auto mb-2 text-trendy-green" />
                      <p className="text-sm font-medium">Hover Glow</p>
                    </div>
                    <div className="p-4 border rounded-lg hover-shrink cursor-pointer text-center">
                      <Minus className="h-6 w-6 mx-auto mb-2 text-trendy-navy" />
                      <p className="text-sm font-medium">Hover Shrink</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Loading States</h4>
                  <div className="flex gap-4 items-center">
                    <Button disabled className="bg-trendy-cyan text-white">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Lädt...
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-trendy-pink rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-trendy-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-trendy-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="w-8 h-8 border-2 border-trendy-navy border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Drag & Drop Section */}
          <section id="drag-drop">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MoveHorizontal className="h-6 w-6 text-trendy-cyan" />
                  Drag & Drop Funktionen
                </CardTitle>
                <CardDescription className="text-base">
                  Interaktive Drag & Drop Elemente und sortierbare Listen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Sortierbare Elemente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="font-medium mb-4 text-trendy-cyan">Aufgaben Liste</h5>
                      <div 
                        className="space-y-2"
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.preventDefault();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const elements = Array.from(e.currentTarget.children);
                          const targetIndex = elements.findIndex(element => {
                            const elemRect = element.getBoundingClientRect();
                            return y < elemRect.top - rect.top + elemRect.height / 2;
                          });
                          handleDrop(e, targetIndex === -1 ? tasks.length : targetIndex, 'task');
                        }}
                      >
                        {tasks.map((task, index) => (
                          <div 
                            key={task.id}
                            className={`p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-move hover:border-${task.color} hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 ${
                              draggedItem?.id === task.id ? 'opacity-50 scale-95 transform rotate-1' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task, 'task')}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <MousePointer2 className="h-4 w-4 text-gray-400" />
                                  <div className="w-1 h-6 bg-gray-300 rounded mx-auto mt-1"></div>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                                  <p className="text-sm text-gray-500">Priorität: {task.priority}</p>
                                </div>
                              </div>
                              <Badge variant="warning">{task.priority}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-4 text-trendy-pink">Benutzer Kategorien</h5>
                      <div 
                        className="space-y-2"
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.preventDefault();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const elements = Array.from(e.currentTarget.children);
                          const targetIndex = elements.findIndex(element => {
                            const elemRect = element.getBoundingClientRect();
                            return y < elemRect.top - rect.top + elemRect.height / 2;
                          });
                          handleDrop(e, targetIndex === -1 ? categories.length : targetIndex, 'category');
                        }}
                      >
                        {categories.map((category, index) => (
                          <div 
                            key={category.id}
                            className={`p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-move hover:border-trendy-pink hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 ${
                              draggedItem?.id === category.id ? 'opacity-50 scale-95 transform rotate-1' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, category, 'category')}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Move className="h-4 w-4 text-gray-400" />
                                <category.icon className="h-5 w-5 text-trendy-navy" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                                  <p className="text-sm text-gray-500">{category.count} Benutzer</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Interaktive Drop Zones mit Animation</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Ziehe die Demo-Elemente zwischen den Zonen - sie springen mit Bounce-Animation in ihre neue Position!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Backlog Zone */}
                    <div 
                      className="border-2 border-dashed border-trendy-cyan rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors min-h-[200px]"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropZoneDrop(e, 'backlog')}
                    >
                      <div className="flex flex-col items-center mb-4">
                        <Clock className="h-6 w-6 text-trendy-cyan mb-2" />
                        <h5 className="font-semibold text-trendy-cyan">Backlog</h5>
                        <p className="text-xs text-muted-foreground">Geplante Aufgaben</p>
                      </div>
                      
                      <div className="space-y-2">
                        {dropZones.backlog.map((item) => (
                          <div 
                            key={item.id}
                            className={`p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                              draggedItem?.id === item.id ? 'opacity-50' : ''
                            } ${
                              animatingItems.has(item.id) ? 'animate-bounce scale-110' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDropZoneStart(e, item)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${item.color}`}></div>
                              <span className="text-xs font-medium truncate">{item.title}</span>
                            </div>
                          </div>
                        ))}
                        {dropZones.backlog.length === 0 && (
                          <div className="text-xs text-gray-400 italic py-4">
                            Elemente hier ablegen...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* In Progress Zone */}
                    <div 
                      className="border-2 border-dashed border-trendy-green rounded-lg p-6 text-center hover:bg-green-50 dark:hover:bg-green-950/10 transition-colors min-h-[200px]"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropZoneDrop(e, 'inProgress')}
                    >
                      <div className="flex flex-col items-center mb-4">
                        <RefreshCw className="h-6 w-6 text-trendy-green mb-2" />
                        <h5 className="font-semibold text-trendy-green">In Bearbeitung</h5>
                        <p className="text-xs text-muted-foreground">Aktuelle Aufgaben</p>
                      </div>
                      
                      <div className="space-y-2">
                        {dropZones.inProgress.map((item) => (
                          <div 
                            key={item.id}
                            className={`p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                              draggedItem?.id === item.id ? 'opacity-50' : ''
                            } ${
                              animatingItems.has(item.id) ? 'animate-bounce scale-110' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDropZoneStart(e, item)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${item.color}`}></div>
                              <span className="text-xs font-medium truncate">{item.title}</span>
                            </div>
                          </div>
                        ))}
                        {dropZones.inProgress.length === 0 && (
                          <div className="text-xs text-gray-400 italic py-4">
                            Elemente hier ablegen...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed Zone */}
                    <div 
                      className="border-2 border-dashed border-trendy-pink rounded-lg p-6 text-center hover:bg-pink-50 dark:hover:bg-pink-950/10 transition-colors min-h-[200px]"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropZoneDrop(e, 'completed')}
                    >
                      <div className="flex flex-col items-center mb-4">
                        <CheckCircle className="h-6 w-6 text-trendy-pink mb-2" />
                        <h5 className="font-semibold text-trendy-pink">Abgeschlossen</h5>
                        <p className="text-xs text-muted-foreground">Fertige Aufgaben</p>
                      </div>
                      
                      <div className="space-y-2">
                        {dropZones.completed.map((item) => (
                          <div 
                            key={item.id}
                            className={`p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                              draggedItem?.id === item.id ? 'opacity-50' : ''
                            } ${
                              animatingItems.has(item.id) ? 'animate-bounce scale-110' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleDropZoneStart(e, item)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${item.color}`}></div>
                              <span className="text-xs font-medium truncate">{item.title}</span>
                            </div>
                          </div>
                        ))}
                        {dropZones.completed.length === 0 && (
                          <div className="text-xs text-gray-400 italic py-4">
                            Elemente hier ablegen...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-trendy-cyan/10 to-trendy-pink/10 rounded-lg border border-trendy-cyan/20">
                    <h5 className="text-sm font-semibold text-trendy-navy mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Animationsdetails
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Beim Verschieben zwischen Zonen wird eine Bounce-Animation ausgelöst. 
                      Elemente springen beim Eintreffen in die neue Zone und skalieren sich kurz auf 110%.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Drag Handles & Indikationen</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex flex-col items-center cursor-move">
                        <div className="w-1 h-2 bg-gray-400 rounded mb-1"></div>
                        <div className="w-1 h-2 bg-gray-400 rounded mb-1"></div>
                        <div className="w-1 h-2 bg-gray-400 rounded"></div>
                      </div>
                      <span className="font-medium">Vertikaler Drag Handle</span>
                    </div>

                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center cursor-move">
                        <div className="w-2 h-1 bg-gray-400 rounded mr-1"></div>
                        <div className="w-2 h-1 bg-gray-400 rounded mr-1"></div>
                        <div className="w-2 h-1 bg-gray-400 rounded"></div>
                      </div>
                      <span className="font-medium">Horizontaler Drag Handle</span>
                    </div>

                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <Move className="h-5 w-5 text-gray-400 cursor-move" />
                      <span className="font-medium">Icon Drag Handle</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Switch Elements Section */}
          <section id="switches">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <RefreshCw className="h-6 w-6 text-trendy-green" />
                  Switch Elemente & Toggle
                </CardTitle>
                <CardDescription className="text-base">
                  Verschiedene Switch-Varianten und Toggle-Komponenten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Standard Switches</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="notifications" className="font-medium">Benachrichtigungen</Label>
                          <p className="text-sm text-muted-foreground">E-Mail Benachrichtigungen erhalten</p>
                        </div>
                        <Switch id="notifications" />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="auto-save" className="font-medium">Auto-Speichern</Label>
                          <p className="text-sm text-muted-foreground">Änderungen automatisch speichern</p>
                        </div>
                        <Switch id="auto-save" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="privacy" className="font-medium">Privater Modus</Label>
                          <p className="text-sm text-muted-foreground">Profil für andere ausblenden</p>
                        </div>
                        <Switch id="privacy" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="sync" className="font-medium">Kalender Sync</Label>
                          <p className="text-sm text-muted-foreground">Mit externen Kalendern synchronisieren</p>
                        </div>
                        <Switch id="sync" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="alerts" className="font-medium">System Alerts</Label>
                          <p className="text-sm text-muted-foreground">Wichtige System-Meldungen anzeigen</p>
                        </div>
                        <Switch id="alerts" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="analytics" className="font-medium">Analytik</Label>
                          <p className="text-sm text-muted-foreground">Nutzungsstatistiken sammeln</p>
                        </div>
                        <Switch id="analytics" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Kategorisierte Switches</h4>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium mb-4 text-trendy-cyan flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Benachrichtigungen
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="email-alerts" className="text-sm">E-Mail Alerts</Label>
                          <Switch id="email-alerts" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="sms-alerts" className="text-sm">SMS Alerts</Label>
                          <Switch id="sms-alerts" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="push-notifications" className="text-sm">Push Benachrichtigungen</Label>
                          <Switch id="push-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="browser-notifications" className="text-sm">Browser Benachrichtigungen</Label>
                          <Switch id="browser-notifications" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-4 text-trendy-pink flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Sicherheit & Datenschutz
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="two-factor" className="text-sm">Zwei-Faktor-Authentifizierung</Label>
                          <Switch id="two-factor" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="session-timeout" className="text-sm">Automatischer Logout</Label>
                          <Switch id="session-timeout" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="data-sharing" className="text-sm">Daten Teilen</Label>
                          <Switch id="data-sharing" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="tracking" className="text-sm">Tracking erlauben</Label>
                          <Switch id="tracking" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-4 text-trendy-green flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Anwendungseinstellungen
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="compact-view" className="text-sm">Kompakte Ansicht</Label>
                          <Switch id="compact-view" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="animations" className="text-sm">Animationen</Label>
                          <Switch id="animations" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="sound-effects" className="text-sm">Sound Effekte</Label>
                          <Switch id="sound-effects" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label htmlFor="high-contrast" className="text-sm">Hoher Kontrast</Label>
                          <Switch id="high-contrast" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Switch Stile & Varianten</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-4">
                      <h5 className="font-medium mb-4 text-center">Standard</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Aktiviert</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Deaktiviert</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Disabled</Label>
                          <Switch disabled />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h5 className="font-medium mb-4 text-center">Mit Icons</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            <Label className="text-sm">Hell</Label>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-blue-500" />
                            <Label className="text-sm">Dunkel</Label>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <Label className="text-sm">Energiesparmodus</Label>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h5 className="font-medium mb-4 text-center">Kompakt</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Label>Option A</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Label>Option B</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Label>Option C</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Label>Option D</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Slot Designs */}
          <section id="slots">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Anchor className="h-6 w-6 text-trendy-cyan" />
                  Slot-Darstellungen & Vergleich
                </CardTitle>
                <CardDescription className="text-base">
                  Aktuelle Slot-Designs vs. alternative Trendy-Varianten mit der neuen Farbpalette
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Aktuelle Slot-Farben (Original System)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className="p-6 border-2 hover-lift cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(34, 197, 94, 0.1)", // green-500 with 10% opacity
                        borderColor: "rgba(34, 197, 94, 0.5)", // green-500 with 50% opacity
                        color: "rgba(21, 128, 61, 1)" // green-700
                      }}
                    >
                      <div className="font-bold text-lg" style={{ color: "rgba(34, 197, 94, 1)" }}>
                        <CheckCircle className="h-5 w-5 inline mr-2" />
                        Verfügbar
                      </div>
                      <div className="text-sm mt-2" style={{ color: "rgba(21, 128, 61, 1)" }}>
                        15:00 - 17:00<br />
                        Boot #123<br />
                        <span className="text-xs">Jetzt buchbar</span>
                      </div>
                    </div>
                    
                    <div 
                      className="p-6 border-2 hover-lift cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.1)", // blue-500 with 10% opacity
                        borderColor: "rgba(59, 130, 246, 0.5)", // blue-500 with 50% opacity
                        color: "rgba(29, 78, 216, 1)" // blue-700
                      }}
                    >
                      <div className="font-bold text-lg" style={{ color: "rgba(59, 130, 246, 1)" }}>
                        <Clock className="h-5 w-5 inline mr-2" />
                        Gebucht
                      </div>
                      <div className="text-sm mt-2" style={{ color: "rgba(29, 78, 216, 1)" }}>
                        10:00 - 12:00<br />
                        Max Mustermann<br />
                        <span className="text-xs">Reserviert</span>
                      </div>
                    </div>
                    
                    <div 
                      className="p-6 border-2 hover-lift cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)", // red-500 with 10% opacity
                        borderColor: "rgba(239, 68, 68, 0.5)", // red-500 with 50% opacity
                        color: "rgba(185, 28, 28, 1)" // red-700
                      }}
                    >
                      <div className="font-bold text-lg" style={{ color: "rgba(239, 68, 68, 1)" }}>
                        <XCircle className="h-5 w-5 inline mr-2" />
                        Blockiert
                      </div>
                      <div className="text-sm mt-2" style={{ color: "rgba(185, 28, 28, 1)" }}>
                        08:00 - 10:00<br />
                        Wartung<br />
                        <span className="text-xs">Nicht verfügbar</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-pink">Alternative Slot-Farben (Trendy Palette)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 hover-lift cursor-pointer transition-all duration-200 shadow-lg rounded-lg" 
                         style={{ backgroundColor: "hsl(133, 28%, 68%)", color: "white" }}>
                      <div className="font-bold text-lg">
                        <CheckCircle className="h-5 w-5 inline mr-2 text-white" />
                        Verfügbar
                      </div>
                      <div className="text-sm mt-2 opacity-90">
                        15:00 - 17:00<br />
                        Boot #123<br />
                        <Badge className="mt-2 bg-primary-foreground/20 text-primary-foreground">Jetzt buchbar</Badge>
                      </div>
                      {/* Bottom right icons */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="p-6 hover-lift cursor-pointer transition-all duration-200 shadow-lg rounded-lg relative" 
                         style={{ backgroundColor: "hsl(202, 85%, 23%)", color: "white" }}>
                      <div className="font-bold text-lg">
                        <Clock className="h-5 w-5 inline mr-2 text-white" />
                        Gebucht
                      </div>
                      <div className="text-sm mt-2 opacity-90">
                        10:00 - 12:00<br />
                        Max Mustermann<br />
                        <Badge className="mt-2 bg-primary-foreground/20 text-primary-foreground">Reserviert</Badge>
                      </div>
                      {/* Bottom right icons */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-white" />
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="p-6 hover-lift cursor-pointer transition-all duration-200 shadow-lg rounded-lg relative" 
                         style={{ backgroundColor: "hsl(348, 77%, 67%)", color: "white" }}>
                      <div className="font-bold text-lg">
                        <XCircle className="h-5 w-5 inline mr-2 text-white" />
                        Blockiert
                      </div>
                      <div className="text-sm mt-2 opacity-90">
                        08:00 - 10:00<br />
                        Wartung<br />
                        <Badge className="mt-2 bg-primary-foreground/20 text-primary-foreground">Nicht verfügbar</Badge>
                      </div>
                      {/* Bottom right icons */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Farbwerte Dokumentation */}
                  <div className="mt-8 p-6 bg-trendy-navy/5 rounded-lg">
                    <h5 className="text-lg font-semibold mb-4 text-trendy-navy flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Trendy Slot Farbwerte
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Available */}
                      <div className="p-4 border rounded-lg bg-trendy-green/5">
                        <h6 className="font-semibold text-trendy-green mb-3">Available (Verfügbar)</h6>
                        <div className="space-y-1 text-sm">
                          <div><strong>Hintergrund:</strong> hsl(133, 28%, 68%)</div>
                          <div><strong>Schriftfarbe:</strong> hsl(0, 0%, 100%)</div>
                          <div><strong>Icons:</strong> hsl(0, 0%, 100%)</div>
                          <div><strong>Label-Farbe:</strong> hsl(133, 28%, 58%)</div>
                          <div><strong>Label-Text:</strong> hsl(0, 0%, 100%)</div>
                        </div>
                      </div>
                      
                      {/* Booked */}
                      <div className="p-4 border rounded-lg bg-trendy-navy/5">
                        <h6 className="font-semibold text-trendy-cyan mb-3">Booked (Gebucht)</h6>
                        <div className="space-y-1 text-sm">
                          <div><strong>Hintergrund:</strong> hsl(202, 85%, 23%)</div>
                          <div><strong>Schriftfarbe:</strong> hsl(0, 0%, 100%)</div>
                          <div><strong>Icons:</strong> hsl(0, 0%, 100%)</div>
                          <div><strong>Label-Farbe:</strong> hsla(210, 25%, 98%, 0.2)</div>
                          <div><strong>Label-Text:</strong> hsl(0, 0%, 100%)</div>
                        </div>
                      </div>
                      
                      {/* Blocked */}
                      <div className="p-4 border rounded-lg bg-trendy-pink/5">
                        <h6 className="font-semibold text-trendy-pink mb-3">Blocked (Gesperrt)</h6>
                        <div className="space-y-1 text-sm">
                          <div><strong>Hintergrund:</strong> hsl(348, 77%, 67%)</div>
                          <div><strong>Schriftfarbe:</strong> hsl(0, 0%, 100%)</div>
                          <div><strong>Icons:</strong> hsl(0, 0%, 100%)</div>
                          <div><strong>Label-Farbe:</strong> hsla(348, 77%, 87%, 0.4)</div>
                          <div><strong>Label-Text:</strong> hsl(0, 0%, 100%)</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-trendy-cyan/10 rounded text-sm">
                      <strong className="text-trendy-navy">Hinweis:</strong> Diese Farbwerte werden in der Slot-Verwaltung, 
                      Wochenansicht und den Design-Einstellungen für alle trendy Slot-Darstellungen verwendet.
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Erweiterte Slot-Zustände</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 hover-lift cursor-pointer">
                      <div className="font-bold text-yellow-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Warnung
                      </div>
                      <div className="text-sm mt-2 text-yellow-600">
                        Wetter-Warnung
                      </div>
                    </div>

                    <div className="p-4 border-2 border-purple-400 bg-purple-50 dark:bg-purple-950/20 hover-lift cursor-pointer">
                      <div className="font-bold text-purple-700 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Premium
                      </div>
                      <div className="text-sm mt-2 text-purple-600">
                        VIP Reservierung
                      </div>
                    </div>

                    <div className="p-4 border-2 border-gray-400 bg-gray-50 dark:bg-gray-800 hover-lift cursor-pointer">
                      <div className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Pause className="h-4 w-4" />
                        Inaktiv
                      </div>
                      <div className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                        Temporär gesperrt
                      </div>
                    </div>

                    <div className="p-4 border-2 border-trendy-navy bg-trendy-navy/10 hover-lift cursor-pointer">
                      <div className="font-bold text-trendy-navy flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Wartung
                      </div>
                      <div className="text-sm mt-2 text-trendy-navy/80">
                        Planned Maintenance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Slot Verhalten Section */}
          <section id="slots">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Anchor className="h-6 w-6 text-trendy-navy" />
                  Slot Verhalten & Zustände
                </CardTitle>
                <CardDescription className="text-base">
                  Slot-System Verhalten und verschiedene Zustände - wird später befüllt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Construction className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">In Entwicklung</h4>
                  <p className="text-muted-foreground">
                    Diese Section wird später mit Slot-Verhalten, Buchungslogik und Zustandsmanagement befüllt.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="h-6 w-6 text-trendy-cyan mx-auto mb-2" />
                      <p className="text-xs font-medium">Zeitfenster</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-trendy-green mx-auto mb-2" />
                      <p className="text-xs font-medium">Buchungen</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-trendy-pink mx-auto mb-2" />
                      <p className="text-xs font-medium">Konflikte</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Settings className="h-6 w-6 text-trendy-navy mx-auto mb-2" />
                      <p className="text-xs font-medium">Validierung</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Additional Components */}
          <section id="components">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Settings className="h-6 w-6 text-trendy-green" />
                  Weitere Komponenten & Elemente
                </CardTitle>
                <CardDescription className="text-base">
                  Zusätzliche UI-Elemente, Badges, Kalender und responsive Design-Beispiele
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Badges & Status</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Alle Badge-Elemente verwenden leicht abgerundete Ecken statt Pillen-Form für ein modernes, maritimes Design.
                  </p>
                  
                  {/* Standard Badges */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Standard Farb-Varianten</Label>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="destructive" className="hover:bg-destructive/90">
                          <Star className="w-3 h-3 mr-1" />
                          Neu
                        </Badge>
                        <Badge variant="available" className="hover:bg-status-available/90">
                          <Info className="w-3 h-3 mr-1" />
                          Info
                        </Badge>
                        <Badge variant="success" className="hover:bg-success/90">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Erfolg
                        </Badge>
                        <Badge variant="default" className="hover:bg-primary/90">
                          <Anchor className="w-3 h-3 mr-1" />
                          Standard
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Outline Varianten</Label>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="border-trendy-pink text-trendy-pink hover:bg-trendy-pink/10">
                          <Heart className="w-3 h-3 mr-1" />
                          Outline Pink
                        </Badge>
                        <Badge variant="outline" className="border-trendy-cyan text-trendy-cyan hover:bg-trendy-cyan/10">
                          <Waves className="w-3 h-3 mr-1" />
                          Outline Cyan
                        </Badge>
                        <Badge variant="outline" className="border-trendy-green text-trendy-green hover:bg-trendy-green/10">
                          <Sailboat className="w-3 h-3 mr-1" />
                          Outline Grün
                        </Badge>
                        <Badge variant="outline" className="border-trendy-navy text-trendy-navy hover:bg-trendy-navy/10">
                          <Ship className="w-3 h-3 mr-1" />
                          Outline Navy
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">System Varianten</Label>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary">
                          <Settings className="w-3 h-3 mr-1" />
                          Secondary
                        </Badge>
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Warnung
                        </Badge>
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Status-Badges mit Größen</Label>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="text-xs px-2 py-0.5" variant="available">Klein</Badge>
                        <Badge className="text-sm px-3 py-1" variant="success">Standard</Badge>
                        <Badge className="text-base px-4 py-1.5" variant="default">
                          <Anchor className="w-4 h-4 mr-2" />
                          Groß
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-6 text-trendy-navy">Responsive Design Beispiele</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover-lift">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-trendy-cyan">
                          <Smartphone className="h-5 w-5" />
                          Mobile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-2 bg-trendy-cyan rounded-full"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover-lift">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-trendy-green">
                          <Tablet className="h-5 w-5" />
                          Tablet
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-2 bg-trendy-green rounded-full"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover-lift">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-trendy-pink">
                          <Monitor className="h-5 w-5" />
                          Desktop
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-2 bg-trendy-pink rounded-full"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-trendy-cyan/10 to-trendy-green/10 rounded-lg border border-trendy-cyan/20">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Design-Hinweis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Die komplette Icon-Bibliothek finden Sie im Abschnitt "Icons" weiter oben. 
                    Alle Icons folgen den maritimen Design-Prinzipien mit konsistenter Strichstärke.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Time Picker & Calendar Section */}
          <section id="timepicker">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Clock className="h-6 w-6 text-trendy-green" />
                  Kalender & Zeit-Auswahl
                </CardTitle>
                <CardDescription className="text-base">
                  Datum- und Zeitauswahl-Komponenten für Terminverwaltung
                </CardDescription>
              </CardHeader>
               <CardContent className="space-y-8">
                 <div>
                   <h4 className="text-lg font-semibold mb-6 text-foreground">Zeit-Auswahl Komponenten</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-4">
                       <h5 className="font-medium text-muted-foreground">Start-Zeit</h5>
                       <TimePicker 
                         placeholder="Startzeit wählen"
                         onChange={(time) => console.log('Startzeit:', time)}
                       />
                     </div>
                     <div className="space-y-4">
                       <h5 className="font-medium text-muted-foreground">End-Zeit</h5>
                       <TimePicker 
                         placeholder="Endzeit wählen"
                         onChange={(time) => console.log('Endzeit:', time)}
                       />
                     </div>
                     <div className="space-y-4">
                       <h5 className="font-medium text-muted-foreground">Reminder</h5>
                       <TimePicker 
                         placeholder="Erinnerung"
                         onChange={(time) => console.log('Reminder:', time)}
                       />
                     </div>
                   </div>
                 </div>

                 <Separator />

                 <div>
                   <h4 className="text-lg font-semibold mb-6 text-foreground">Kombinierte Termin-Auswahl</h4>
                   <div className="p-6 bg-gradient-to-br from-trendy-cyan/10 to-trendy-green/10 rounded-lg border border-trendy-cyan/20">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                         <Label className="text-base font-medium">Datum & Zeit für Krantermin</Label>
                         <div className="flex gap-2">
                           <Button variant="outline" className="flex-1">
                             <CalendarIcon className="h-4 w-4 mr-2" />
                             Datum wählen
                           </Button>
                           <TimePicker 
                             placeholder="Zeit"
                             className="flex-1"
                           />
                         </div>
                       </div>
                       <div className="space-y-4">
                         <Label className="text-base font-medium">Dauer & Erinnerung</Label>
                         <div className="flex gap-2">
                           <TimePicker 
                             placeholder="Dauer"
                             className="flex-1"
                           />
                           <TimePicker 
                             placeholder="Reminder"
                             className="flex-1"
                           />
                         </div>
                       </div>
                     </div>
                     <Button className="w-full mt-4 bg-trendy-navy text-white hover:bg-trendy-navy/90">
                       <Plus className="h-4 w-4 mr-2" />
                       Krantermin erstellen
                     </Button>
                   </div>
                 </div>
               </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <Card className="bg-gradient-to-r from-trendy-navy/10 to-trendy-cyan/10 border-trendy-navy">
            <CardContent className="text-center py-8">
              <h3 className="text-2xl font-bold text-trendy-navy mb-4">
                Style Center Complete
              </h3>
              <p className="text-muted-foreground mb-6">
                Alle Designelemente wurden erfolgreich geladen. Verwende diese Komponenten für ein konsistentes und modernes UI-Design.
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  className="bg-trendy-pink text-white hover:bg-trendy-pink/90"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Nach oben
                </Button>
                <Button variant="outline" className="border-trendy-cyan text-trendy-cyan">
                  <Download className="h-4 w-4 mr-2" />
                  Design exportieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}