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
    // Parse request body first
    const { userId, password, action, email, name, adminKey } = await req.json();
    
    console.log('Received request:', { action, userId, hasAdminKey: !!adminKey });

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

    // Check authorization
    let isAuthorized = false;
    const envAdminKey = Deno.env.get('ADMIN_PASSWORD_RESET_KEY');
    
    console.log('Checking admin key:', { 
      hasEnvKey: !!envAdminKey,
      providedKey: adminKey,
      keysMatch: adminKey === envAdminKey 
    });

    // Check if admin key is provided and valid
    if (adminKey && envAdminKey && adminKey === envAdminKey) {
      console.log('✅ Admin key validated');
      isAuthorized = true;
    } else {
      console.log('Admin key not valid, checking JWT token');
      // Check JWT token
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        console.error('❌ No authorization header and no valid admin key');
        throw new Error('Unauthorized - Missing authorization or admin key');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        console.error('❌ Auth error:', authError);
        throw new Error('Unauthorized - Invalid token');
      }

      // Allow users to change their OWN password without admin role
      if (action === 'update' && userId === user.id) {
        console.log('✅ User changing own password - allowed');
        isAuthorized = true;
      } else {
        // For other operations or changing OTHER user's passwords, require admin role
        const { data: roles, error: roleError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleError || !roles?.some(r => r.role === 'admin')) {
          console.error('❌ User is not admin:', { userId: user.id, roles });
          throw new Error('Unauthorized - Admin access required');
        }
        
        console.log('✅ Admin JWT token validated');
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.error('❌ Not authorized');
      throw new Error('Unauthorized');
    }

    if (action === 'update') {
      console.log('Updating password for user:', userId);
      
      // Update user password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (error) {
        console.error('❌ Error updating password:', error);
        throw error;
      }

      console.log('✅ Password updated successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'create') {
      console.log('Creating new user with email:', email);
      
      // This is called during user creation
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) {
        console.error('❌ Error creating user:', authError);
        throw authError;
      }

      console.log('✅ User created successfully');
      return new Response(
        JSON.stringify({ success: true, user: authData.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('❌ Error in manage-user-password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
