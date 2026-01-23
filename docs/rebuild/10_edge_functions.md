# KSVL Slot Manager - Edge Functions

## 1. Übersicht

| Function | Beschreibung | JWT Required |
|----------|--------------|--------------|
| `harbor-chat` | AI-Chat mit Lovable AI | Ja |
| `manage-user` | Benutzer CRUD | Ja |
| `manage-user-password` | Passwort-Management | Ja |
| `reset-password-admin` | Admin Passwort-Reset | Ja |
| `create-admin` | Admin erstellen | Ja |
| `monday-webhook` | Monday.com Webhook | Nein |
| `sync-monday` | Monday.com Sync | Ja |
| `migrate-storage-files` | Storage-Migration | Ja |

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

- Verwendet Lovable AI Gateway: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-2.5-flash`
- Lädt Slot- und Mitgliederdaten für Kontext

---

**Letzte Aktualisierung**: 2026-01-23
