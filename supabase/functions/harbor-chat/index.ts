import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY nicht konfiguriert');
    }

    // Supabase Client für Datenbankzugriff
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Hole aktuelle Slots-Daten
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        *,
        crane_operator:crane_operator_id(id, name, email),
        member:member_id(id, name, email)
      `)
      .gte('date', today)
      .lte('date', nextWeek)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      console.error('Fehler beim Laden der Slots:', slotsError);
    }

    // Bereite Slots-Informationen auf
    const availableSlots = slots?.filter(s => !s.is_booked) || [];
    const bookedSlots = slots?.filter(s => s.is_booked) || [];

    const slotsInfo = `
AKTUELLE KRANTERMIN-DATEN (${today} bis ${nextWeek}):

VERFÜGBARE TERMINE (${availableSlots.length}):
${availableSlots.map(s => `- ${s.date} um ${s.time} Uhr (${s.duration} Min) - Kranführer: ${s.crane_operator?.name || 'Unbekannt'}`).join('\n') || 'Keine verfügbaren Termine'}

GEBUCHTE TERMINE (${bookedSlots.length}):
${bookedSlots.map(s => `- ${s.date} um ${s.time} Uhr - gebucht von ${s.member?.name || 'Unbekannt'}`).join('\n') || 'Keine Buchungen'}

STATISTIK:
- Gesamt Termine: ${slots?.length || 0}
- Verfügbar: ${availableSlots.length}
- Gebucht: ${bookedSlots.length}
- Auslastung: ${slots?.length ? Math.round((bookedSlots.length / slots.length) * 100) : 0}%
`;

    console.log('Slots-Info für AI:', slotsInfo);

    const systemPrompt = `Du bist ein hilfreicher Assistent für das Hafenverwaltungssystem.

DEINE AUFGABE:
- Beantworte Fragen zu Kranterminen
- Zeige verfügbare Termine an
- Erkläre Buchungsoptionen
- Gib freundliche, präzise Antworten auf Deutsch

WICHTIGE REGELN:
- Zeige maximal 5 Termine pro Antwort (außer explizit nach mehr gefragt)
- Formatiere Termine übersichtlich
- Erkläre, wie Mitglieder buchen können
- Bei Fragen zu spezifischen Daten: durchsuche die Daten und antworte präzise

${slotsInfo}

Antworte immer höflich und hilfsbereit auf Deutsch.`;

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
        max_tokens: 1000,
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