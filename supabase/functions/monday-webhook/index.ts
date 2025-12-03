import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate Monday.com webhook signature using HMAC-SHA256
async function validateMondaySignature(
  body: string,
  signature: string | null,
  signingSecret: string
): Promise<boolean> {
  if (!signature || !signingSecret) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(signingSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === signature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signingSecret = Deno.env.get('MONDAY_SIGNING_SECRET');
    const body = await req.text();
    
    // Validate webhook signature if signing secret is configured
    if (signingSecret) {
      const signature = req.headers.get('x-monday-signature');
      const isValid = await validateMondaySignature(body, signature, signingSecret);
      
      if (!isValid) {
        console.warn('Monday.com webhook signature validation failed');
        return new Response(
          JSON.stringify({ error: 'Invalid signature', success: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn('MONDAY_SIGNING_SECRET not configured - webhook signature validation skipped');
    }

    const payload = JSON.parse(body);
    
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

    // Log webhook receipt
    console.log('Monday.com webhook received:', {
      challenge: payload.challenge,
      event: payload.event,
      timestamp: new Date().toISOString()
    });

    // Handle Monday.com webhook challenge (must respond without signature check for initial setup)
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

    console.log('Monday.com webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed'
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
