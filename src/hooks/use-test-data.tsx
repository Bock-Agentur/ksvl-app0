import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { format } from "date-fns";
import { User, UserRole, Slot, TestDataScenario, TestDataContextType, generateRolesFromPrimary } from "@/types";

const TestDataContext = createContext<TestDataContextType | undefined>(undefined);

// Mock data generators
const generateUsers = (count: number, craneOperatorCount: number): User[] => {
  const memberNames = [
    "Hans Müller", "Maria Schmidt", "Peter Wagner", "Anna Bauer", "Thomas Huber",
    "Lisa Weber", "Michael Fischer", "Sarah Moser", "Christian Gruber", "Julia Steiner",
    "Daniel Pichler", "Nina Hofer", "Martin Fuchs", "Petra Leitner", "Andreas Berger",
    "Claudia Mayer", "Stefan Brunner", "Sandra Eder", "Wolfgang Reiter", "Manuela Hauser",
    "Robert Winkler", "Sabine Koller", "Franz Egger", "Brigitte Lang", "Helmut Mayr"
  ];

  const boatNames = [
    "Seeadler", "Windspiel", "Neptun", "Aurora", "Delphin", "Sturmvogel", 
    "Seestern", "Poseidon", "Meerblick", "Wellenreiter", "Seemöwe", "Triton"
  ];

  const users: User[] = [];
  
  // Generate crane operators first
  for (let i = 0; i < craneOperatorCount; i++) {
    const role: UserRole = "kranfuehrer";
    users.push({
      id: `crane-${i + 1}`,
      name: memberNames[i],
      email: `${memberNames[i].toLowerCase().replace(' ', '.')}@hafen.com`,
      phone: `+43 664 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      memberNumber: `KSVL${(i + 1).toString().padStart(3, '0')}`,
      role,
      roles: generateRolesFromPrimary(role),
      status: "active",
      joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      joinedAt: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      isActive: true
    });
  }

  // Generate regular members
  for (let i = craneOperatorCount; i < count; i++) {
    const role: UserRole = "mitglied";
    users.push({
      id: `member-${i + 1}`,
      name: memberNames[i % memberNames.length],
      email: `${memberNames[i % memberNames.length].toLowerCase().replace(' ', '.')}@email.com`,
      phone: `+43 664 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      boatName: boatNames[Math.floor(Math.random() * boatNames.length)],
      memberNumber: `KSVL${(i + 1).toString().padStart(3, '0')}`,
      role,
      roles: generateRolesFromPrimary(role),
      status: Math.random() > 0.1 ? "active" : "inactive",
      joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      joinedAt: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      isActive: Math.random() > 0.1
    });
  }

  return users;
};

const generateConsecutiveSlots = (craneOperators: User[]): Slot[] => {
  const slots: Slot[] = [];
  const today = new Date();
  // Use Monday of current week to ensure slots appear in week view
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7); // Get Monday
  const todayString = currentWeekStart.toISOString().split('T')[0];
  
  console.log('🗓️ GENERATING CONSECUTIVE SLOTS:');
  console.log('📅 Today:', today.toISOString().split('T')[0]);
  console.log('📅 Current week start (Monday):', todayString);
  console.log('📅 Week days:', Array.from({length: 7}, (_, i) => {
    const day = new Date(currentWeekStart);
    day.setDate(currentWeekStart.getDate() + i);
    return day.toISOString().split('T')[0];
  }));
  
  // Sicherstellen, dass wir mindestens 2 Kranführer haben
  if (craneOperators.length < 2) {
    console.warn("Nicht genügend Kranführer für Slot-Block Demo");
    return [];
  }
  
  // Kranführer 1: Slots über mehrere Tage verteilt
  const operator1 = craneOperators[0];
  const block1Slots = [
    // Montag
    {
      id: `slot-1`,
      date: todayString, // Montag
      time: `08:00`,
      duration: 60 as 30 | 45 | 60,
      craneOperator: {
        id: operator1.id,
        name: operator1.name,
        email: operator1.email
      },
      isBooked: true,
      bookedBy: "Max Mustermann",
      member: {
        id: "member-1",
        name: "Max Mustermann", 
        email: "max.mustermann@email.com",
        memberNumber: "KSVL001"
      },
      notes: `Montag 8:00 - gebucht`
    },
    {
      id: `slot-2`,
      date: todayString,
      time: `09:00`,
      duration: 60 as 30 | 45 | 60,
      craneOperator: {
        id: operator1.id,
        name: operator1.name,
        email: operator1.email
      },
      isBooked: true,
      bookedBy: "Anna Weber",
      member: {
        id: "member-2", 
        name: "Anna Weber",
        email: "anna.weber@email.com",
        memberNumber: "KSVL002"
      },
      notes: `Montag 9:00 - gebucht`
    },
    {
      id: `slot-3`,
      date: todayString,
      time: `10:00`,
      duration: 60 as 30 | 45 | 60,
      craneOperator: {
        id: operator1.id,
        name: operator1.name,
        email: operator1.email
      },
      isBooked: false,
      notes: `Montag 10:00 - verfügbar`
    }
  ];
  
  // Dienstag
  const tuesdayDate = new Date(currentWeekStart);
  tuesdayDate.setDate(currentWeekStart.getDate() + 1);
  const tuesdayString = tuesdayDate.toISOString().split('T')[0];
  
  const operator2 = craneOperators[1];
  const tuesdaySlots = [
    {
      id: `slot-4`,
      date: tuesdayString,
      time: `11:00`,
      duration: 60 as 30 | 45 | 60,
      craneOperator: {
        id: operator2.id,
        name: operator2.name,
        email: operator2.email
      },
      isBooked: true,
      bookedBy: "Lisa Schmidt",
      member: {
        id: "member-3",
        name: "Lisa Schmidt",
        email: "lisa.schmidt@email.com",
        memberNumber: "KSVL003"
      },
      notes: `Dienstag 11:00 - gebucht`
    },
    {
      id: `slot-5`,
      date: tuesdayString,
      time: `12:00`,
      duration: 60 as 30 | 45 | 60,
      craneOperator: {
        id: operator2.id,
        name: operator2.name,
        email: operator2.email
      },
      isBooked: false,
      notes: `Dienstag 12:00 - verfügbar`
    }
  ];
  
  
  slots.push(...block1Slots, ...tuesdaySlots);
  
  console.log('✅ GENERATED SLOTS:', slots.length, 'slots');
  console.log('📋 SLOT DETAILS:', slots.map(s => `${s.id}: ${s.date} ${s.time} (${s.isBooked ? 'booked' : 'available'})`));
  
  return slots;
};

const generateSlots = (totalSlots: number, bookedSlots: number, craneOperators: User[]): Slot[] => {
  const slots: Slot[] = [];
  const today = new Date();
  const usedTimeSlots = new Set<string>(); // Track ALL used date-time combinations globally
  
  let attempts = 0;
  const maxAttempts = totalSlots * 50; // More attempts to handle strict conflicts
  
  while (slots.length < totalSlots && attempts < maxAttempts) {
    attempts++;
    
    // Generate slots for current week (Monday to Sunday) to ensure visibility
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7); // Get Monday
    const daysOffset = Math.floor(Math.random() * 7); // 0-6 days from Monday
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + daysOffset);
    const dateString = date.toISOString().split('T')[0];
    
    const hour = Math.floor(Math.random() * 15) + 6; // 6-20 Uhr (kompatibel mit Wochenkalender 6:00-21:00)
    const time = `${hour.toString().padStart(2, '0')}:00`; // ONLY full hours (:00) - NO :30 slots
    
    const craneOperator = craneOperators[Math.floor(Math.random() * craneOperators.length)];
    
    // CRITICAL: Create unique key for date-time (GLOBAL conflict prevention)
    // NO two slots can exist at the same date-time, regardless of operator
    const globalTimeKey = `${dateString}-${time}`;
    
    // Skip if ANY slot already exists at this date-time
    if (usedTimeSlots.has(globalTimeKey)) {
      continue;
    }
    
    usedTimeSlots.add(globalTimeKey);
    
    // Calculate how many should be booked based on target
    const currentBooked = slots.filter(s => s.isBooked).length;
    const remainingSlots = totalSlots - slots.length;
    const remainingToBook = bookedSlots - currentBooked;
    const shouldBook = remainingToBook > 0 && (remainingToBook / remainingSlots) > Math.random();
    
    slots.push({
      id: `slot-${slots.length + 1}`,
      date: dateString,
      time,
      duration: 60 as 30 | 45 | 60,
      craneOperator: {
        id: craneOperator.id,
        name: craneOperator.name,
        email: craneOperator.email
      },
      isBooked: shouldBook,
      bookedBy: shouldBook ? `Mitglied ${Math.floor(Math.random() * 100) + 1}` : undefined,
      member: shouldBook ? {
        id: `member-${Math.floor(Math.random() * 20) + 1}`,
        name: `Mitglied ${Math.floor(Math.random() * 100) + 1}`,
        email: `mitglied${Math.floor(Math.random() * 100) + 1}@email.com`,
        memberNumber: `KSVL${Math.floor(Math.random() * 999) + 1}`
      } : undefined,
      notes: shouldBook && Math.random() > 0.7 
        ? "Sondertermin" 
        : undefined
    });
  }
  
  return slots;
};

const scenarios: TestDataScenario[] = [
  {
    id: "consecutive-slots",
    name: "Slot-Blöcke Demo",
    description: "Block 1 (10-13h): 2 gebucht, 1 verfügbar | Block 2 (14-16h): beide verfügbar, nur erster buchbar",
    active: true,
    stats: {
      members: 10,
      craneOperators: 2,
      totalSlots: 5,
      bookedSlots: 2,
      availableSlots: 3
    }
  },
  {
    id: "normal-week",
    name: "Normale Woche",
    description: "Typische Auslastung mit gemischten Buchungen",
    active: false,
    stats: {
      members: 24,
      craneOperators: 3,
      totalSlots: 84,
      bookedSlots: 52,
      availableSlots: 32
    }
  },
  {
    id: "peak-season", 
    name: "Hochsaison",
    description: "Hohe Nachfrage, wenig freie Slots",
    active: false,
    stats: {
      members: 31,
      craneOperators: 4,
      totalSlots: 96,
      bookedSlots: 89,
      availableSlots: 7
    }
  },
  {
    id: "rain-weather",
    name: "Regenwetter",
    description: "Viele Stornierungen, niedrige Auslastung",
    active: false,
    stats: {
      members: 18,
      craneOperators: 2,
      totalSlots: 56,
      bookedSlots: 12,
      availableSlots: 44
    }
  },
  {
    id: "holiday-weekend",
    name: "Feiertags-Wochenende",
    description: "Erhöhte Nachfrage, Wartelisten",
    active: false,
    stats: {
      members: 42,
      craneOperators: 5,
      totalSlots: 120,
      bookedSlots: 118,
      availableSlots: 2
    }
  },
  {
    id: "maintenance-day",
    name: "Wartungstag",
    description: "Eingeschränkte Verfügbarkeit",
    active: false,
    stats: {
      members: 15,
      craneOperators: 1,
      totalSlots: 28,
      bookedSlots: 8,
      availableSlots: 20
    }
  },
];

export function TestDataProvider({ children }: { children: ReactNode }) {
  const [isTestMode, setIsTestMode] = useState(true);
  const [currentScenarios, setCurrentScenarios] = useState(() => [...scenarios]);
  
  // Initialize users and slots with fresh data
  const [users, setUsers] = useState<User[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const activeScenario = currentScenarios.find(s => s.active) || null;

  const setTestMode = (enabled: boolean) => {
    setIsTestMode(enabled);
  };

  const activateScenario = (scenarioId: string) => {
    // Update scenarios to mark the new one as active
    const newScenarios = currentScenarios.map(s => ({
      ...s,
      active: s.id === scenarioId
    }));
    
    setCurrentScenarios(newScenarios);
    
    const scenario = newScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      // Generate fresh data
      const newUsers = generateUsers(scenario.stats.members, scenario.stats.craneOperators);
      const craneOperators = newUsers.filter(u => u.role === "kranfuehrer" || u.role === "admin");
      
      // Use special generator for consecutive slots scenario
      const newSlots = scenario.id === "consecutive-slots" 
        ? generateConsecutiveSlots(craneOperators)
        : generateSlots(scenario.stats.totalSlots, scenario.stats.bookedSlots, craneOperators);
      
      // Update users and slots
      setUsers(newUsers);
      setSlots(newSlots);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    const activeScenario = currentScenarios.find(s => s.active);
    if (!activeScenario) {
      // If no scenario is active, activate the first one
      activateScenario(currentScenarios[0].id);
    } else if (users.length === 0 || slots.length === 0) {
      // If active scenario exists but no data, generate it
      activateScenario(activeScenario.id);
    }
  }, []);

  const generateRandomData = () => {
    const scenario = activeScenario;
    if (scenario) {
      const newUsers = generateUsers(scenario.stats.members, scenario.stats.craneOperators);
      const craneOperators = newUsers.filter(u => u.role === "kranfuehrer" || u.role === "admin");
      const newSlots = generateSlots(scenario.stats.totalSlots, scenario.stats.bookedSlots, craneOperators);
      
      setUsers(newUsers);
      setSlots(newSlots);
    }
  };

  const generateUsersOnly = () => {
    // Erstelle nur die 4 Test-Personas aus dem UI (keine zusätzlichen Benutzer)
    const testPersonas: User[] = [
      // Harald - Administrator mit allen Rollen
      {
        id: "admin-harald",
        name: "Harald",
        email: "harald@hafen.com",
        phone: "+43 664 100 0001",
        memberNumber: "ADMIN001",
        role: "admin",
        roles: generateRolesFromPrimary("admin"), // Admin, Kranführer, Mitglied
        status: "active",
        joinDate: "2020-01-01",
        isActive: true
      },
      
      // Peter Schmidt - Erfahrener Kranführer
      {
        id: "crane-peter",
        name: "Peter Schmidt",
        email: "peter.schmidt@hafen.com",
        phone: "+43 664 200 0001",
        memberNumber: "KRAN001",
        role: "kranfuehrer",
        roles: generateRolesFromPrimary("kranfuehrer"),
        status: "active",
        joinDate: "2021-02-14",
        isActive: true
      },
      
      // Max Mustermann - Aktives Mitglied, Boot "Seeadler"
      {
        id: "member-max",
        name: "Max Mustermann",
        email: "max.mustermann@email.com",
        phone: "+43 664 300 0001",
        boatName: "Seeadler",
        memberNumber: "KSVL001",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2022-04-10",
        isActive: true
      },
      
      // Anna Weber - Neue Mitglied, Boot "Windspiel"
      {
        id: "member-anna",
        name: "Anna Weber",
        email: "anna.weber@email.com",
        phone: "+43 664 300 0002",
        boatName: "Windspiel",
        memberNumber: "KSVL002",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2023-01-05",
        isActive: true
      }
    ];
    
    setUsers(testPersonas);
    // Slots nicht ändern bei reiner User-Erstellung
  };

  const generatePersonaMembers = () => {
    // Erstelle eine erweiterte Liste diverser Persona-Mitglieder
    const personaMembers: User[] = [
      // Administratoren
      {
        id: "admin-elena",
        name: "Elena Hofmann",
        email: "elena.hofmann@hafen.com",
        phone: "+43 664 100 0010",
        memberNumber: "ADMIN010",
        role: "admin",
        roles: generateRolesFromPrimary("admin"),
        status: "active",
        joinDate: "2019-03-15",
        isActive: true
      },
      {
        id: "admin-klaus",
        name: "Klaus Berger",
        email: "klaus.berger@hafen.com", 
        phone: "+43 664 100 0011",
        memberNumber: "ADMIN011",
        role: "admin",
        roles: generateRolesFromPrimary("admin"),
        status: "active",
        joinDate: "2020-08-20",
        isActive: true
      },

      // Kranführer
      {
        id: "crane-maria",
        name: "Maria Steiner",
        email: "maria.steiner@hafen.com",
        phone: "+43 664 200 0010",
        memberNumber: "KRAN010",
        role: "kranfuehrer",
        roles: generateRolesFromPrimary("kranfuehrer"),
        status: "active",
        joinDate: "2020-05-10",
        isActive: true
      },
      {
        id: "crane-thomas",
        name: "Thomas Winkler",
        email: "thomas.winkler@hafen.com",
        phone: "+43 664 200 0011",
        memberNumber: "KRAN011",
        role: "kranfuehrer",
        roles: generateRolesFromPrimary("kranfuehrer"),
        status: "active",
        joinDate: "2021-11-05",
        isActive: true
      },
      {
        id: "crane-sandra",
        name: "Sandra Fuchs",
        email: "sandra.fuchs@hafen.com",
        phone: "+43 664 200 0012",
        memberNumber: "KRAN012",
        role: "kranfuehrer",
        roles: generateRolesFromPrimary("kranfuehrer"),
        status: "active",
        joinDate: "2022-01-18",
        isActive: true
      },

      // Mitglieder mit vielfältigen Booten und Profilen
      {
        id: "member-christina",
        name: "Christina Moser",
        email: "christina.moser@email.com",
        phone: "+43 664 300 0010",
        boatName: "Neptun",
        memberNumber: "KSVL010",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2021-03-22",
        isActive: true
      },
      {
        id: "member-michael",
        name: "Michael Gruber",
        email: "michael.gruber@email.com",
        phone: "+43 664 300 0011",
        boatName: "Delphin",
        memberNumber: "KSVL011",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2020-07-14",
        isActive: true
      },
      {
        id: "member-julia",
        name: "Julia Leitner",
        email: "julia.leitner@email.com",
        phone: "+43 664 300 0012",
        boatName: "Aurora",
        memberNumber: "KSVL012",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2023-02-08",
        isActive: true
      },
      {
        id: "member-stefan",
        name: "Stefan Wagner",
        email: "stefan.wagner@email.com",
        phone: "+43 664 300 0013",
        boatName: "Sturmvogel",
        memberNumber: "KSVL013",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2019-09-30",
        isActive: true
      },
      {
        id: "member-petra",
        name: "Petra Huber",
        email: "petra.huber@email.com",
        phone: "+43 664 300 0014",
        boatName: "Seestern",
        memberNumber: "KSVL014",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2022-06-12",
        isActive: true
      },
      {
        id: "member-wolfgang",
        name: "Wolfgang Fischer",
        email: "wolfgang.fischer@email.com",
        phone: "+43 664 300 0015",
        boatName: "Poseidon",
        memberNumber: "KSVL015",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2021-12-03",
        isActive: true
      },
      {
        id: "member-sabine",
        name: "Sabine Mayer",
        email: "sabine.mayer@email.com",
        phone: "+43 664 300 0016",
        boatName: "Meerblick",
        memberNumber: "KSVL016",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2023-04-25",
        isActive: true
      },
      {
        id: "member-robert",
        name: "Robert Brunner",
        email: "robert.brunner@email.com",
        phone: "+43 664 300 0017",
        boatName: "Wellenreiter",
        memberNumber: "KSVL017",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "inactive",
        joinDate: "2020-11-11",
        isActive: false
      },
      {
        id: "member-claudia",
        name: "Claudia Egger",
        email: "claudia.egger@email.com",
        phone: "+43 664 300 0018",
        boatName: "Seemöwe",
        memberNumber: "KSVL018",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2022-08-17",
        isActive: true
      },
      {
        id: "member-franz",
        name: "Franz Koller",
        email: "franz.koller@email.com",
        phone: "+43 664 300 0019",
        boatName: "Triton",
        memberNumber: "KSVL019",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2023-01-19",
        isActive: true
      }
    ];
    
    setUsers(personaMembers);
  };

  const generateSlotVariants = () => {
    const craneOperators = users.filter(u => u.role === "kranfuehrer" || u.role === "admin");
    
    if (craneOperators.length === 0) {
      // Fallback: erstelle Kranführer falls keine vorhanden
      const fallbackOperators: User[] = [
        {
          id: "crane-fallback-1",
          name: "Peter Schmidt",
          email: "peter.schmidt@hafen.com",
          phone: "+43 664 200 0001",
          memberNumber: "KRAN001",
          role: "kranfuehrer",
          roles: generateRolesFromPrimary("kranfuehrer"),
          status: "active",
          joinDate: "2021-02-14",
          isActive: true
        },
        {
          id: "crane-fallback-2", 
          name: "Maria Steiner",
          email: "maria.steiner@hafen.com",
          phone: "+43 664 200 0010",
          memberNumber: "KRAN010",
          role: "kranfuehrer",
          roles: generateRolesFromPrimary("kranfuehrer"),
          status: "active",
          joinDate: "2020-05-10",
          isActive: true
        }
      ];
      
      setUsers(prev => [...prev, ...fallbackOperators]);
      craneOperators.push(...fallbackOperators);
    }
    
    const today = new Date();
    const slotVariants: Slot[] = [];
    const durations: (30 | 45 | 60)[] = [30, 45, 60];
    const times = [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", 
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00"
    ];
    
    const memberNames = [
      "Lisa Schmidt", "Martin Bauer", "Nicole Weber", "Florian Huber",
      "Carmen Moser", "Daniel Gruber", "Melanie Steiner", "Alexander Fuchs",
      "Katharina Leitner", "Sebastian Berger", "Vanessa Mayer", "Dominik Brunner"
    ];
    
    const notes = [
      "Schwerer Segelkran benötigt", "Nottermin - dringend", "Boot Reparatur",
      "Saisonstart Vorbereitung", "Winterlager Aktion", "Regatta Vorbereitung",
      "Vereinstermin", "Wartung erforderlich", "Gästeboot", "Sondertermin",
      "", "", "", "", "", "" // Viele Slots ohne Notes
    ];
    
    // Erstelle 30 verschiedene Slot-Varianten
    for (let i = 0; i < 30; i++) {
      const daysOffset = Math.floor(Math.random() * 21) - 10; // ±10 days
      const date = new Date(today);
      date.setDate(date.getDate() + daysOffset);
      const dateString = date.toISOString().split('T')[0];
      
      const time = times[i % times.length];
      const duration = durations[i % durations.length];
      const craneOperator = craneOperators[i % craneOperators.length];
      const isBooked = Math.random() > 0.4; // 60% Buchungsrate
      const memberName = memberNames[i % memberNames.length];
      const note = notes[i % notes.length];
      
      slotVariants.push({
        id: `variant-slot-${i + 1}`,
        date: dateString,
        time,
        duration,
        craneOperator: {
          id: craneOperator.id,
          name: craneOperator.name,
          email: craneOperator.email
        },
        isBooked,
        bookedBy: isBooked ? memberName : undefined,
        member: isBooked ? {
          id: `variant-member-${i + 1}`,
          name: memberName,
          email: `${memberName.toLowerCase().replace(' ', '.')}@email.com`,
          memberNumber: `KSVL${(i + 100).toString().padStart(3, '0')}`
        } : undefined,
        notes: note || undefined,
        // Füge verschiedene Slot-Eigenschaften hinzu
        isMiniSlot: duration === 30 ? Math.random() > 0.7 : false,
        miniSlotCount: duration === 30 ? 2 : undefined,
        startMinute: duration === 30 ? (Math.random() > 0.5 ? 0 : 30) as 0 | 15 | 30 | 45 : undefined
      });
    }
    
    setSlots(slotVariants);
  };

  const generatePersonaWithSlots = () => {
    // Zuerst alle bestehenden Daten löschen
    clearAllData();
    
    // Erweiterte Personas generieren (Basis + zusätzliche)
    const extendedPersonas: User[] = [
      // === ORIGINAL BASIS-PERSONAS (bleiben unverändert) ===
      {
        id: "admin-harald",
        name: "Harald",
        email: "harald@hafen.com", 
        phone: "+43 664 100 0001",
        memberNumber: "ADMIN001",
        role: "admin",
        roles: generateRolesFromPrimary("admin"),
        status: "active",
        joinDate: "2019-01-15",
        isActive: true
      },
      {
        id: "crane-peter",
        name: "Peter Schmidt",
        email: "peter.schmidt@hafen.com",
        phone: "+43 664 200 0001", 
        memberNumber: "KRAN001",
        role: "kranfuehrer",
        roles: generateRolesFromPrimary("kranfuehrer"),
        status: "active",
        joinDate: "2020-03-10",
        isActive: true
      },
      {
        id: "member-max",
        name: "Max Mustermann",
        email: "max.mustermann@email.com",
        phone: "+43 664 300 0001",
        boatName: "Seeadler",
        memberNumber: "KSVL001",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2022-04-10",
        isActive: true
      },
      {
        id: "member-anna",
        name: "Anna Weber",
        email: "anna.weber@email.com",
        phone: "+43 664 300 0002",
        boatName: "Windspiel", 
        memberNumber: "KSVL002",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2023-01-05",
        isActive: true
      },
      
      // === NEUE PERSONAS ===
      // Zusätzlicher Kranführer
      {
        id: "crane-maria",
        name: "Maria Steiner",
        email: "maria.steiner@hafen.com",
        phone: "+43 664 200 0010",
        memberNumber: "KRAN010",
        role: "kranfuehrer",
        roles: generateRolesFromPrimary("kranfuehrer"),
        status: "active",
        joinDate: "2020-05-10",
        isActive: true
      },
      
      // Zwei zusätzliche Mitglieder
      {
        id: "member-thomas",
        name: "Thomas Müller",
        email: "thomas.mueller@email.com",
        phone: "+43 664 300 0010",
        boatName: "Neptun",
        memberNumber: "KSVL010",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2021-08-15",
        isActive: true
      },
      {
        id: "member-lisa", 
        name: "Lisa Schmitt",
        email: "lisa.schmitt@email.com",
        phone: "+43 664 300 0011",
        boatName: "Delphin",
        memberNumber: "KSVL011",
        role: "mitglied",
        roles: generateRolesFromPrimary("mitglied"),
        status: "active",
        joinDate: "2023-03-20",
        isActive: true
      }
    ];
    
    setUsers(extendedPersonas);
    
    // Generiere Slots für 3 Tage VOR bis 6 Tage NACH heute
    const today = new Date();
    const slots: Slot[] = [];
    let slotIdCounter = 0;
    
    // Kranführer für Slot-Erstellung
    const craneOperators = [
      { id: "admin-harald", name: "Harald", email: "harald@hafen.com" },
      { id: "crane-peter", name: "Peter Schmidt", email: "peter.schmidt@hafen.com" },
      { id: "crane-maria", name: "Maria Steiner", email: "maria.steiner@hafen.com" }
    ];
    
    // Mitglieder für Buchungen
    const memberOptions = extendedPersonas.filter(u => u.role === "mitglied");
    
    // Generiere für jeden Tag von -3 bis +6
    for (let dayOffset = -3; dayOffset <= 6; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Anzahl Termine pro Tag: 15-30 (zufällig)
      const slotsPerDay = 15 + Math.floor(Math.random() * 16); // 15-30 Slots
      
      // Generiere verschiedene Slot-Typen für jeden Tag
      const daySlots: Slot[] = [];
      let slotIndex = 0;
      
      // Block-Strukturen für realistische Verteilung
      const blockStructures = [
        { type: 'superblock', size: 5 + Math.floor(Math.random() * 4) }, // 5-8 Slots Superblock
        { type: 'block', size: 3 + Math.floor(Math.random() * 2) },      // 3-4 Slots normaler Block  
        { type: 'block', size: 2 + Math.floor(Math.random() * 2) },      // 2-3 Slots kleiner Block
        { type: 'single', size: 1 },                                      // Einzelslots
        { type: 'single', size: 1 },
        { type: 'single', size: 1 }
      ];
      
      // Mische die Block-Strukturen für Variation
      const shuffledStructures = [...blockStructures].sort(() => Math.random() - 0.5);
      
      // Zeitslots über den Tag verteilt (6:00 - 20:00)
      const timeSlots = [];
      for (let hour = 6; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 15) { // Alle 15 Minuten
          timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }
      
      let currentTimeIndex = 0;
      
      // Erstelle Blocks und Einzelslots bis wir genügend Slots haben
      for (const structure of shuffledStructures) {
        if (slotIndex >= slotsPerDay) break;
        
        const operator = craneOperators[Math.floor(Math.random() * craneOperators.length)];
        
        if (structure.type === 'superblock') {
          // SUPERBLOCK: 5-8 aufeinanderfolgende Slots
          const actualBlockSize = Math.min(structure.size, slotsPerDay - slotIndex);
          const blockId = `superblock-${dateString}-${operator.id}-${Date.now()}`;
          
          for (let blockIndex = 0; blockIndex < actualBlockSize; blockIndex++) {
            if (currentTimeIndex >= timeSlots.length) break;
            
            const time = timeSlots[currentTimeIndex++];
            const isBooked = Math.random() > 0.25; // 75% Buchungsrate für Superblocks
            const bookedMember = isBooked ? memberOptions[Math.floor(Math.random() * memberOptions.length)] : undefined;
            
            daySlots.push({
              id: `slot-${++slotIdCounter}`,
              date: dateString,
              time,
              duration: 60 as 60,
              craneOperator: operator,
              blockId,
              isBooked,
              bookedBy: bookedMember?.name,
              member: bookedMember,
              notes: isBooked ? `Superblock ${blockIndex + 1}/${actualBlockSize}` : undefined
            });
            slotIndex++;
          }
          
        } else if (structure.type === 'block') {
          // NORMALER BLOCK: 2-4 aufeinanderfolgende Slots
          const actualBlockSize = Math.min(structure.size, slotsPerDay - slotIndex);
          const blockId = `block-${dateString}-${operator.id}-${Date.now()}`;
          
          for (let blockIndex = 0; blockIndex < actualBlockSize; blockIndex++) {
            if (currentTimeIndex >= timeSlots.length) break;
            
            const time = timeSlots[currentTimeIndex++];
            const isBooked = Math.random() > 0.4; // 60% Buchungsrate für normale Blocks
            const bookedMember = isBooked ? memberOptions[Math.floor(Math.random() * memberOptions.length)] : undefined;
            
            daySlots.push({
              id: `slot-${++slotIdCounter}`,
              date: dateString,
              time,
              duration: 60 as 60,
              craneOperator: operator,
              blockId,
              isBooked,
              bookedBy: bookedMember?.name,
              member: bookedMember,
              notes: isBooked ? `Block ${blockIndex + 1}/${actualBlockSize}` : undefined
            });
            slotIndex++;
          }
          
        } else {
          // EINZELSLOT: Zufällige Dauer und Position
          if (currentTimeIndex >= timeSlots.length) continue;
          
          const durations = [30, 45, 60, 60, 90] as (30 | 45 | 60 | 90)[]; // Mehr Variation in Dauer
          const duration = durations[Math.floor(Math.random() * durations.length)];
          const time = timeSlots[currentTimeIndex++];
          const isBooked = Math.random() > 0.5; // 50% Buchungsrate für Einzelslots
          const bookedMember = isBooked ? memberOptions[Math.floor(Math.random() * memberOptions.length)] : undefined;
          
          daySlots.push({
            id: `slot-${++slotIdCounter}`,
            date: dateString,
            time,
            duration: duration as 60, // TypeScript fix
            craneOperator: operator,
            isBooked,
            bookedBy: bookedMember?.name,
            member: bookedMember,
            notes: isBooked ? `Einzeltermin (${duration}min)` : undefined
          });
          slotIndex++;
        }
      }
      
      // Fülle restliche Slots mit Einzelslots auf
      while (slotIndex < slotsPerDay && currentTimeIndex < timeSlots.length) {
        const operator = craneOperators[slotIndex % craneOperators.length];
        const durations = [30, 45, 60] as (30 | 45 | 60)[];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const time = timeSlots[currentTimeIndex++];
        const isBooked = Math.random() > 0.6; // 40% Buchungsrate für Füllslots
        const bookedMember = isBooked ? memberOptions[Math.floor(Math.random() * memberOptions.length)] : undefined;
        
        daySlots.push({
          id: `slot-${++slotIdCounter}`,
          date: dateString,
          time,
          duration,
          craneOperator: operator,
          isBooked,
          bookedBy: bookedMember?.name,
          member: bookedMember,
          notes: isBooked ? `Zusatztermin (${duration}min)` : undefined
        });
        slotIndex++;
      }
      
      slots.push(...daySlots);
    }
    
    console.log(`🎯 Neues Komplettset erstellt: ${slots.length} Slots für ${format(new Date(today.getTime() - 3*24*60*60*1000), 'dd.MM')} bis ${format(new Date(today.getTime() + 6*24*60*60*1000), 'dd.MM.yyyy')}`);
    console.log(`👥 ${extendedPersonas.length} Personas: ${extendedPersonas.filter(u => u.role === 'admin').length} Admin, ${extendedPersonas.filter(u => u.role === 'kranfuehrer').length} Kranführer, ${extendedPersonas.filter(u => u.role === 'mitglied').length} Mitglieder`);
    console.log(`📊 Slot-Verteilung: ${slots.filter(s => s.blockId).length} Block-Slots, ${slots.filter(s => !s.blockId).length} Einzelslots`);
    console.log(`✅ Gebuchte Slots: ${slots.filter(s => s.isBooked).length}/${slots.length} (${Math.round((slots.filter(s => s.isBooked).length / slots.length) * 100)}%)`);
    
    // Slots setzen
    setSlots(slots);
    
    // Force re-render für UI-Update
    setTimeout(() => {
      setSlots(prevSlots => [...prevSlots]); 
    }, 100);
  };

  // ===== AUTOMATISCHE INITIALISIERUNG BEIM APP-START =====
  useEffect(() => {
    console.log('🚀 App gestartet - Initialisiere automatisch Komplettset...');
    
    // Kurze Verzögerung für bessere UX
    const initTimer = setTimeout(() => {
      generatePersonaWithSlots();
      console.log('✅ Automatische Initialisierung abgeschlossen');
    }, 500);
    
    return () => clearTimeout(initTimer);
  }, []); // Nur einmal beim Mount

  const generateRandomCredentials = () => {
    const scenario = activeScenario;
    if (scenario) {
      const newUsers = generateUsers(scenario.stats.members, scenario.stats.craneOperators);
      const craneOperators = newUsers.filter(u => u.role === "kranfuehrer" || u.role === "admin");
      const newSlots = generateSlots(scenario.stats.totalSlots, scenario.stats.bookedSlots, craneOperators);
      
      setUsers(newUsers);
      setSlots(newSlots);
    }
  };

  const clearAllData = () => {
    setUsers([]);
    setSlots([]);
    // CRITICAL: Deactivate all scenarios when clearing data AND reset current scenario state
    setCurrentScenarios(prev => prev.map(s => ({ ...s, active: false })));
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const updateSlot = (slotId: string, updatedData: Partial<Slot>) => {
    setSlots(prev => {
      const newSlots = prev.map(slot => 
        slot.id === slotId ? { ...slot, ...updatedData } : slot
      );
      return newSlots;
    });
  };

  const deleteSlot = (slotId: string) => {
    setSlots(prev => {
      const newSlots = prev.filter(slot => slot.id !== slotId);
      return newSlots;
    });
  };

  const addSlot = (newSlotData: Partial<Slot>) => {
    console.log('🚀 ADD_SLOT called with:', newSlotData);
    
    const newSlot: Slot = {
      id: `slot-${Date.now()}`,
      date: newSlotData.date || format(new Date(), 'yyyy-MM-dd'),
      time: newSlotData.time || '08:00',
      duration: newSlotData.duration || 60,
      craneOperator: newSlotData.craneOperator || { id: '', name: '', email: '' },
      isBooked: newSlotData.isBooked || false,
      bookedBy: newSlotData.bookedBy,
      member: newSlotData.member,
      notes: newSlotData.notes
    };
    
    console.log('📅 CREATED NEW SLOT:', {
      id: newSlot.id,
      date: newSlot.date,
      time: newSlot.time,
      duration: newSlot.duration,
      craneOperator: newSlot.craneOperator.name
    });
    
    setSlots(prev => {
      const newSlots = [...prev, newSlot];
      console.log('💾 SLOTS STATE UPDATED. Total slots now:', newSlots.length);
      console.log('📊 Latest 5 slots:', newSlots.slice(-5).map(s => `${s.date} ${s.time} (${s.id})`));
      return newSlots;
    });
  };

  const addSlotBlock = (slotDataArray: Partial<Slot>[]) => {
    // Generate unique timestamp for this block
    const blockTimestamp = Date.now();
    
    console.log('🚀 ADD_SLOT_BLOCK called with:', {
      slotCount: slotDataArray.length,
      blockTimestamp,
      firstSlot: slotDataArray[0]
    });
    
    const newSlots: Slot[] = slotDataArray.map((slotData, index) => ({
      id: `block-${blockTimestamp}-${index + 1}`,
      date: slotData.date || format(new Date(), 'yyyy-MM-dd'),
      time: slotData.time || '08:00',
      duration: slotData.duration || 60,
      craneOperator: slotData.craneOperator || { id: '', name: '', email: '' },
      isBooked: slotData.isBooked || false,
      bookedBy: slotData.bookedBy,
      member: slotData.member,
      notes: slotData.notes
    }));
    
    console.log('📊 GENERATED SLOTS with IDs:', newSlots.map(s => `${s.time} (${s.id})`));
    console.log('📋 FULL SLOT DATA:', newSlots);
    
    setSlots(prev => {
      const newSlotsList = [...prev, ...newSlots];
      console.log('💾 SLOTS STATE UPDATED. Total slots now:', newSlotsList.length);
      return newSlotsList;
    });
  };

  return (
    <TestDataContext.Provider value={{
      users,
      slots,
      scenarios: currentScenarios,
      activeScenario,
      isTestMode,
      setTestMode,
      activateScenario,
      generateRandomData,
      generateUsersOnly,
      generatePersonaMembers,
      generateSlotVariants,
      generatePersonaWithSlots,
      generateRandomCredentials,
      clearAllData,
      addUser,
      updateUser,
      deleteUser,
      addSlot,
      addSlotBlock,
      updateSlot,
      deleteSlot
    }}>
      {children}
    </TestDataContext.Provider>
  );
}

export function useTestData() {
  const context = useContext(TestDataContext);
  if (context === undefined) {
    throw new Error('useTestData must be used within a TestDataProvider');
  }
  return context;
}