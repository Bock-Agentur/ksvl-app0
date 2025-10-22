import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const payload = await req.json();
    
    // Log webhook receipt
    console.log('Monday.com webhook received:', {
      challenge: payload.challenge,
      event: payload.event,
      timestamp: new Date().toISOString()
    });

    // Handle Monday.com webhook challenge
    if (payload.challenge) {
      return new Response(
        JSON.stringify({ challenge: payload.challenge }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log webhook event (for future processing)
    await supabase
      .from('monday_sync_logs')
      .insert({
        sync_type: 'webhook',
        direction: 'monday_to_app',
        board_id: payload.event?.boardId?.toString(),
        item_id: payload.event?.pulseId?.toString(),
        action: payload.event?.type || 'unknown',
        success: true,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // TODO: Implement webhook processing here
    // Parse event type, update user data, sync custom fields, etc.
    console.log('Monday.com webhook would be processed here');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook logged (processing pending)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
