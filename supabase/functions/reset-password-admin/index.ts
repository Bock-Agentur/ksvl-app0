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
    const { userId, newPassword, resetKey } = await req.json();
    
    console.log('Password reset request:', { userId, hasResetKey: !!resetKey });

    // Validate reset key
    const validResetKey = Deno.env.get('ADMIN_PASSWORD_RESET_KEY');
    if (!resetKey || resetKey !== validResetKey) {
      console.error('Invalid reset key');
      return new Response(
        JSON.stringify({ error: 'Invalid reset key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Updating password for user:', userId);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }

    console.log('Password updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Passwort erfolgreich aktualisiert' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
