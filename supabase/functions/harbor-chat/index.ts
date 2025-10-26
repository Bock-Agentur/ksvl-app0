import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tonality prompts
const tonalityPrompts: Record<string, string> = {
  formal: "Antworte höflich, professionell und sachlich.",
  funny: "Sei locker, humorvoll und verwende gelegentlich maritime Witze.",
  witty: "Sei witzig, frech und freundlich - aber nicht übertrieben.",
  sensitive: "Sei einfühlsam, verständnisvoll und geduldig.",
  motivating: "Sei ermutigend, enthusiastisch und positiv."
};

// Response length mapping
const lengthToTokens: Record<string, number> = {
  short: 500,
  medium: 1000,
  long: 2000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, firstName, userRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY nicht konfiguriert');
    }

    // Supabase Client für Datenbankzugriff
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Load AI assistant settings
    const { data: aiSettings } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'aiAssistantSettings')
      .eq('is_global', true)
      .maybeSingle();

    const settings = aiSettings?.setting_value || {
      tonality: {
        admin: 'formal',
        vorstand: 'formal',
        kranfuehrer: 'funny',
        mitglied: 'witty',
        gastmitglied: 'witty'
      },
      responseLength: 'medium',
      customSystemPrompt: ''
    };

    const userTonality = userRole && settings.tonality[userRole] ? settings.tonality[userRole] : 'witty';
    const tonalityInstruction = tonalityPrompts[userTonality] || tonalityPrompts.witty;
    const maxTokens = lengthToTokens[settings.responseLength] || 1000;
    const customPrompt = settings.customSystemPrompt || '';
    const agentName = settings.agentName || 'Capitano';

    console.log('AI Settings:', { userTonality, maxTokens, hasCustomPrompt: !!customPrompt, agentName });

    // Hilfsfunktion: Vollständiger Name aus first_name + last_name, Fallback auf name
    const getFullName = (profile: any): string => {
      if (profile?.first_name && profile?.last_name) {
        return `${profile.first_name} ${profile.last_name}`;
      }
      if (profile?.first_name) {
        return profile.first_name;
      }
      return profile?.name || 'Unbekannt';
    };

    // Hole aktuelle und zukünftige Slots-Daten
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Hole auch vergangene Slots (letzte 30 Tage)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Hilfsfunktion für Datumsformatierung
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T12:00:00'); // Mittag um Zeitzonenfehler zu vermeiden
      const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const day = days[date.getDay()];
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${day}. ${d}.${m}.${y}`;
    };

    // Hole zukünftige Slots
    const { data: futureSlots, error: futureSlotsError } = await supabase
      .from('slots')
      .select('*')
      .gte('date', today)
      .lte('date', nextWeek)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (futureSlotsError) {
      console.error('Fehler beim Laden der zukünftigen Slots:', futureSlotsError);
    }

    // Hole vergangene Slots
    const { data: pastSlots, error: pastSlotsError } = await supabase
      .from('slots')
      .select('*')
      .gte('date', thirtyDaysAgo)
      .lt('date', today)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (pastSlotsError) {
      console.error('Fehler beim Laden der vergangenen Slots:', pastSlotsError);
    }

    const slots = futureSlots || [];

    // Hole Profil-Daten separat für Kranführer und Mitglieder (für beide Zeit-Bereiche)
    const allSlots = [...(futureSlots || []), ...(pastSlots || [])];
    const craneOperatorIds = allSlots.map(s => s.crane_operator_id).filter(Boolean);
    const memberIds = allSlots.filter(s => s.member_id).map(s => s.member_id).filter(Boolean);
    const allUserIds = [...new Set([...craneOperatorIds, ...memberIds])];

    const { data: users } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, name, username, email, member_number, boat_name')
      .in('id', allUserIds);

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    // Hole öffentliche Mitgliederdaten (nur wenn data_public_in_ksvl = true)
    const { data: publicMembers, error: membersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, name, username, member_number, boat_name, boat_type, berth_number, email, phone, contact_public_in_ksvl, vorstand_funktion, ai_info_enabled')
      .eq('data_public_in_ksvl', true)
      .order('name', { ascending: true });

    if (membersError) {
      console.error('Fehler beim Laden der Mitglieder:', membersError);
    }

    // Hole alle Custom Fields
    const { data: customFields } = await supabase
      .from('custom_fields')
      .select('*')
      .order('order', { ascending: true });

    // Hole Custom Field Values für öffentliche Mitglieder
    const publicMemberIds = publicMembers?.map(m => m.id) || [];
    const { data: customFieldValues } = await supabase
      .from('custom_field_values')
      .select('*')
      .in('user_id', publicMemberIds);

    // Erstelle eine Map für Custom Field Values pro Benutzer
    const customValuesMap = new Map<string, Record<string, string>>();
    customFieldValues?.forEach(cfv => {
      if (!customValuesMap.has(cfv.user_id)) {
        customValuesMap.set(cfv.user_id, {});
      }
      const field = customFields?.find(f => f.id === cfv.field_id);
      if (field) {
        customValuesMap.get(cfv.user_id)![field.name] = cfv.value;
      }
    });

    // Hole AI-Info Daten (nur für Mitglieder, die ai_info_enabled haben)
    const membersWithAiInfo = publicMembers?.filter(m => m.ai_info_enabled) || [];
    const aiInfoText = membersWithAiInfo.length > 0 ? `

ZUSÄTZLICHE AI-INFOS VON MITGLIEDERN (${membersWithAiInfo.length} Mitglieder):
${membersWithAiInfo.map(m => {
  const customValues = customValuesMap.get(m.id) || {};
  const aiInfo = customValues['ai_agent_info'];
  if (!aiInfo) return null;
  return `- ${getFullName(m)}${m.member_number ? ` (Nr: ${m.member_number})` : ''}: ${aiInfo}`;
}).filter(Boolean).join('\n')}

WICHTIG: Diese Infos sind direkt von den Mitgliedern für den AI-Assistenten freigegeben. Nutze sie bei Fragen über diese Personen.
` : '';

    // Filtere Vorstandsmitglieder separat
    const { data: vorstandMembers, error: vorstandError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        name,
        username,
        vorstand_funktion,
        email,
        phone,
        contact_public_in_ksvl
      `)
      .not('vorstand_funktion', 'is', null)
      .order('name', { ascending: true });

    if (vorstandError) {
      console.error('Fehler beim Laden des Vorstands:', vorstandError);
    }

    // Bereite Slots-Informationen auf
    const availableSlots = slots?.filter(s => !s.is_booked) || [];
    const bookedSlots = slots?.filter(s => s.is_booked) || [];

    const slotsInfo = `
AKTUELLE KRANTERMIN-DATEN (${today} bis ${nextWeek}):

VERFÜGBARE TERMINE (${availableSlots.length}):
${availableSlots.map(s => {
  const craneOp = usersMap.get(s.crane_operator_id);
  return `- ${formatDate(s.date)} um ${s.time} Uhr (${s.duration} Min) - Kranführer: ${getFullName(craneOp)}${craneOp?.member_number ? ` (Nr: ${craneOp.member_number})` : ''} - [Details anzeigen](/?date=${s.date})`;
}).join('\n') || 'Keine verfügbaren Termine'}

GEBUCHTE TERMINE (${bookedSlots.length}):
${bookedSlots.map(s => {
  const member = usersMap.get(s.member_id);
  return `- ${formatDate(s.date)} um ${s.time} Uhr - gebucht von ${getFullName(member)}${member?.boat_name ? ` (Boot: ${member.boat_name})` : ''} - [Details anzeigen](/?date=${s.date})`;
}).join('\n') || 'Keine Buchungen'}

STATISTIK:
- Gesamt Termine: ${slots?.length || 0}
- Verfügbar: ${availableSlots.length}
- Gebucht: ${bookedSlots.length}
- Auslastung: ${slots?.length ? Math.round((bookedSlots.length / slots.length) * 100) : 0}%
`;

    // Bereite vergangene Slots-Informationen auf
    const pastAvailableSlots = pastSlots?.filter(s => !s.is_booked) || [];
    const pastBookedSlots = pastSlots?.filter(s => s.is_booked) || [];

    const pastSlotsInfo = pastSlots && pastSlots.length > 0 ? `

VERGANGENE KRANTERMIN-DATEN (${thirtyDaysAgo} bis ${today}):

VERGANGENE VERFÜGBARE TERMINE (${pastAvailableSlots.length}):
${pastAvailableSlots.slice(0, 10).map(s => {
  const craneOp = usersMap.get(s.crane_operator_id);
  return `- ${formatDate(s.date)} um ${s.time} Uhr (${s.duration} Min) - Kranführer: ${getFullName(craneOp)}${craneOp?.member_number ? ` (Nr: ${craneOp.member_number})` : ''}`;
}).join('\n') || 'Keine vergangenen verfügbaren Termine'}

VERGANGENE GEBUCHTE TERMINE (${pastBookedSlots.length}):
${pastBookedSlots.slice(0, 10).map(s => {
  const member = usersMap.get(s.member_id);
  return `- ${formatDate(s.date)} um ${s.time} Uhr - gebucht von ${getFullName(member)}${member?.boat_name ? ` (Boot: ${member.boat_name})` : ''}`;
}).join('\n') || 'Keine vergangenen Buchungen'}

VERGANGENE STATISTIK:
- Gesamt Termine: ${pastSlots.length}
- Verfügbar: ${pastAvailableSlots.length}
- Gebucht: ${pastBookedSlots.length}
- Auslastung: ${pastSlots.length ? Math.round((pastBookedSlots.length / pastSlots.length) * 100) : 0}%
` : '';

    const membersInfo = publicMembers && publicMembers.length > 0 ? `

ÖFFENTLICHE MITGLIEDERDATEN (${publicMembers.length} Mitglieder):
${publicMembers.map(m => {
  const customValues = customValuesMap.get(m.id) || {};
  let info = `- ${getFullName(m)}${m.member_number ? ` (Nr: ${m.member_number})` : ''}`;
  
  // Boot-Informationen
  if (m.boat_name) info += ` - Boot: ${m.boat_name}`;
  if (m.boat_type) info += ` (${m.boat_type})`;
  if (m.berth_number) info += ` - Liegeplatz: ${m.berth_number}`;
  
  // Kontaktdaten (nur wenn öffentlich)
  if (m.contact_public_in_ksvl) {
    if (m.email) info += ` - Email: ${m.email}`;
    if (m.phone) info += ` - Tel: ${m.phone}`;
  }
  
  // Custom Fields hinzufügen (nur wichtige anzeigen)
  const relevantFields = ['address', 'city', 'postal_code', 'street_address', 'oesv_number'];
  const customFieldInfo = relevantFields
    .filter(fieldName => customValues[fieldName])
    .map(fieldName => {
      const field = customFields?.find(f => f.name === fieldName);
      return `${field?.label || fieldName}: ${customValues[fieldName]}`;
    })
    .join(', ');
  
  if (customFieldInfo) {
    info += ` - ${customFieldInfo}`;
  }
  
  return info;
}).join('\n')}

WICHTIG: Zeige nur Daten von Mitgliedern, die ihre Daten öffentlich freigegeben haben!
` : '\n\nKEINE ÖFFENTLICHEN MITGLIEDERDATEN verfügbar (kein Mitglied hat Daten freigegeben).';

    const vorstandInfo = vorstandMembers && vorstandMembers.length > 0 ? `

VORSTAND (${vorstandMembers.length} Mitglieder):
${vorstandMembers.map(v => {
  let info = `- ${getFullName(v)}${v.vorstand_funktion ? ` - ${v.vorstand_funktion}` : ''}`;
  if (v.contact_public_in_ksvl) {
    info += `${v.email ? ` - Email: ${v.email}` : ''}${v.phone ? ` - Tel: ${v.phone}` : ''}`;
  }
  return info;
}).join('\n')}
` : '';

    console.log('Slots-Info für AI:', slotsInfo);
    console.log('Vergangene Slots-Info für AI:', pastSlotsInfo);
    console.log('Mitglieder-Info für AI:', membersInfo);
    console.log('Vorstand-Info für AI:', vorstandInfo);

    const userName = firstName || 'Segelfreund';
    
    const systemPrompt = `Du bist ${agentName}, der KI-Assistent für den KSVL (Klagenfurter Segelverein Loretto).
Du unterstützt bei ALLEN Belangen des Vereins - von Kranterminen über Mitgliederverwaltung bis hin zu allgemeinen Fragen zum Vereinsleben.
Der KSVL ist ein Segelverein am Wörthersee in Kärnten, Österreich.

Stelle dich bei der ersten Antwort kurz mit deinem Namen vor (z.B. "Servus! Ich bin ${agentName}, dein Assistent für alle Fragen rund um den KSVL! ⚓️").

Der Nutzer heißt ${userName}. Sprich ihn mit "Du" und seinem Vornamen an (z.B. "Servus ${userName}!"), aber nicht in jeder Antwort - nur wenn es persönlich und freundlich wirkt.
WICHTIG: Verwende NUR den Vornamen, nicht den vollen Namen oder formelle Anreden!

TONALITÄT: ${tonalityInstruction}

DEIN STIL:
- Du sprichst alle per "Du" an
- Sei hilfsbereit und verständnisvoll
- Kleine maritime Begriffe und Emojis sind willkommen 🌊 ⚓ 🚢 ⛵
- Verwende österreichisches Deutsch (z.B. "Jänner" statt "Januar")

DEINE AUFGABEN:
- Beantworte Fragen zu Kranterminen und Slot-Buchungen (aktuelle UND vergangene)
- Unterstütze bei allgemeinen Vereinsangelegenheiten des KSVL
- Gib Informationen zu Mitgliedern (NUR wenn sie ihre Daten freigegeben haben!)
- Zeig Vorstandsmitglieder und deren Kontaktdaten (falls öffentlich)
- Hilf bei Fragen zu Booten, Liegeplätzen, Veranstaltungen
- Erkläre Vereinsregeln und -abläufe
- Vermittle Kontakte zu zuständigen Ansprechpartnern
- Gib freundliche, lockere aber präzise Antworten auf Deutsch

WICHTIGE REGELN:
- Zeig maximal 5-7 Termine pro Antwort (außer explizit nach mehr gefragt)
- Bei Fragen zu vergangenen Terminen nutz die VERGANGENE KRANTERMIN-DATEN
- Formatier Termine und Daten übersichtlich mit Aufzählungen
- Nutz die Markdown-Links in den Termindaten, um auf Details zu verweisen
- Datumsformat ist bereits korrekt formatiert (z.B. "Mi. 22.10.2025")
- Bei Fragen zu Mitgliedern: Zeig NUR Daten von Mitgliedern, die "Daten öffentlich im KSVL" aktiviert haben
- **WICHTIG**: Wenn ein Mitglied "contact_public_in_ksvl" aktiviert hat, zeige ALLE verfügbaren Kontaktdaten (Email UND Telefon)
- Wenn nach Telefonnummern oder Kontaktdaten gefragt wird, gib IMMER alle verfügbaren Informationen aus den Daten aus
- NIEMALS Daten von nicht-öffentlichen Mitgliedern zeigen oder erwähnen
- Bei Fragen zum Vorstand: Liste alle Vorstandsmitglieder mit Funktion und (falls freigegeben) Kontaktdaten
- Erklär, wie Mitglieder ihre Daten öffentlich machen können (Profil-Einstellungen)
- Bei Fragen zu spezifischen Daten: durchsuch die Daten und antworte präzise mit ALLEN verfügbaren Informationen
- Bei Fragen zu Bereichen ohne verfügbare Daten: erkläre transparent, dass diese Daten aktuell nicht verfügbar sind
- Verweise bei spezifischen Anliegen (z.B. Beiträge, Satzung, Hafeninformationen) auf den Vorstand oder zuständige Ansprechpartner
- Du bist Teil eines umfassenden Vereinsmanagement-Systems für den KSVL, nicht nur ein Kran-Kalender-Bot
- Der KSVL ist am Wörthersee in Loretto (Klagenfurt, Kärnten) beheimatet

VERFÜGBARE DATEN:
Dir stehen aktuell folgende Daten zur Verfügung:
${slotsInfo}
${pastSlotsInfo}
${membersInfo}
${vorstandInfo}
${aiInfoText}

Für andere Vereinsangelegenheiten (Events, Finanzen, Regattaergebnisse, Hafeninformationen) kannst du allgemeine Informationen geben und auf den Vorstand verweisen.

${customPrompt ? `\nZUSÄTZLICHE ANWEISUNGEN:\n${customPrompt}` : ''}

Ahoi und viel Spaß beim Segeln! 🚤⚓`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Zu viele Anfragen. Bitte versuchen Sie es in einem Moment erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-Kontingent aufgebraucht. Bitte kontaktieren Sie den Administrator.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway Fehler:', response.status, errorText);
      throw new Error('AI Gateway Fehler');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat-Fehler:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unbekannter Fehler' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});