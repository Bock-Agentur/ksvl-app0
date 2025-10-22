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

    const { userId, action } = await req.json();

    // Check if Monday.com sync is enabled
    const { data: settings } = await supabase
      .from('monday_settings')
      .select('*')
      .single();

    if (!settings?.auto_sync_enabled) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Monday.com sync not enabled',
          synced: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log sync attempt
    await supabase
      .from('monday_sync_logs')
      .insert({
        sync_type: 'manual',
        direction: 'app_to_monday',
        user_id: userId,
        action: action || 'sync',
        success: true,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // TODO: Implement Monday.com API calls here
    // This is a skeleton for future implementation
    console.log('Monday.com sync would happen here for user:', userId);
    console.log('Settings:', settings);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sync prepared (Monday.com integration pending)',
        synced: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    
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
