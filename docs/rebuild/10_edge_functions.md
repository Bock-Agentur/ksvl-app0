# KSVL Slot Manager - Edge Functions

## 1. Übersicht

| Function | Beschreibung | JWT Required | Secret |
|----------|--------------|--------------|--------|
| `harbor-chat` | AI-Chat mit Google Gemini | Ja | `GOOGLE_API_KEY` |
| `manage-user` | Benutzer CRUD | Ja | - |
| `manage-user-password` | Passwort-Management | Ja | - |
| `reset-password-admin` | Admin Passwort-Reset | Ja | `ADMIN_PASSWORD_RESET_KEY` |
| `create-admin` | Admin erstellen | Ja | - |
| `monday-webhook` | Monday.com Webhook | Nein | `MONDAY_SIGNING_SECRET` |
| `sync-monday` | Monday.com Sync | Ja | `MONDAY_API_KEY` |
| `migrate-storage-files` | Storage-Migration | Ja | - |

## 2. Standard Template

```typescript
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );
    
    if (error || !user) throw new Error('Nicht autorisiert');
    
    // Business logic...
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

## 3. harbor-chat (AI)

### Konfiguration

- **API**: Google Gemini API (generativelanguage.googleapis.com)
- **Model**: `gemini-2.0-flash` (oder `gemini-2.5-flash`)
- **Secret**: `GOOGLE_API_KEY` (von Google AI Studio)

### API-Aufruf

```typescript
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  }
);
```

### Kontext-Daten

Die Funktion lädt automatisch:
- Slot-Daten (kommende Buchungen)
- Mitglieder-Statistiken
- Vereins-Informationen

## 4. Erforderliche Secrets

| Secret | Beschreibung | Wo erhalten |
|--------|--------------|-------------|
| `GOOGLE_API_KEY` | Google AI Studio API Key | [ai.google.dev](https://ai.google.dev) |
| `ADMIN_PASSWORD_RESET_KEY` | Sicherer Reset-Key (selbst generieren) | Eigene Generierung |
| `MONDAY_API_KEY` | Monday.com API Key | Monday.com Dashboard |
| `MONDAY_SIGNING_SECRET` | Webhook-Signatur-Secret | Monday.com Webhook-Setup |

### Secrets konfigurieren (Supabase Dashboard)

1. Project Settings → Edge Functions → Secrets
2. "Add new secret" klicken
3. Name und Wert eingeben
4. Speichern

## 5. Deployment (externe Supabase-Instanz)

### Voraussetzungen

```bash
# Supabase CLI installieren
npm install -g supabase

# Mit Projekt verbinden
supabase login
supabase link --project-ref <project-id>
```

### Alle Functions deployen

```bash
# Einzeln deployen
supabase functions deploy harbor-chat
supabase functions deploy manage-user
supabase functions deploy manage-user-password
supabase functions deploy reset-password-admin
supabase functions deploy create-admin
supabase functions deploy monday-webhook
supabase functions deploy sync-monday
supabase functions deploy migrate-storage-files

# Oder alle auf einmal (aus dem Projektroot)
supabase functions deploy
```

### Deployment verifizieren

```bash
# Function-Status prüfen
supabase functions list

# Logs anzeigen
supabase functions logs harbor-chat
```

## 6. Testing

### harbor-chat testen

```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/harbor-chat \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Wann sind die nächsten freien Krantermine?"}'
```

### create-admin testen

```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/create-admin \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ksvl.at",
    "password": "sicheres-passwort",
    "name": "Administrator"
  }'
```

## 7. Troubleshooting

| Problem | Lösung |
|---------|--------|
| "GOOGLE_API_KEY not set" | Secret in Supabase Dashboard hinzufügen |
| "401 Unauthorized" | JWT-Token prüfen, User muss eingeloggt sein |
| "Function not found" | `supabase functions deploy` ausführen |
| CORS-Fehler | corsHeaders in der Function prüfen |

---

**Letzte Aktualisierung**: 2026-01-26
