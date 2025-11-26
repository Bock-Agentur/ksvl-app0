import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const { userId, password, action, email, name, adminKey } = await req.json();

    // Check authorization - either valid JWT token or admin key
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;

    // Check if admin key is provided and valid
    if (adminKey && adminKey === Deno.env.get('ADMIN_PASSWORD_RESET_KEY')) {
      isAuthorized = true;
    } else if (authHeader) {
      // Verify the requesting user is an admin via JWT
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (!authError && user) {
        // Check if user is admin
        const { data: roles, error: roleError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (!roleError && roles?.some(r => r.role === 'admin')) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      throw new Error('Unauthorized - Admin access required');
    }

    if (action === 'update') {
      // Update user password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'create') {
      // This is called during user creation
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) throw authError;

      return new Response(
        JSON.stringify({ success: true, user: authData.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
