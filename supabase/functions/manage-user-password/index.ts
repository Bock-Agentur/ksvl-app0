import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Structured logger for consistent log output
const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() }));
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...data, timestamp: new Date().toISOString() }));
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, ...data, timestamp: new Date().toISOString() }));
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body first
    const { userId, password, action, email, name, adminKey } = await req.json();
    
    logger.info('Request received', { action, userId, hasAdminKey: !!adminKey });

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
    
    logger.info('Checking admin key', { 
      hasEnvKey: !!envAdminKey,
      keysMatch: adminKey === envAdminKey 
    });

    // Check if admin key is provided and valid
    if (adminKey && envAdminKey && adminKey === envAdminKey) {
      logger.info('Admin key validated');
      isAuthorized = true;
    } else {
      logger.info('Admin key not valid, checking JWT token');
      // Check JWT token
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        logger.error('No authorization header and no valid admin key');
        throw new Error('Unauthorized - Missing authorization or admin key');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        logger.error('Auth error', { error: authError?.message });
        throw new Error('Unauthorized - Invalid token');
      }

      // Allow users to change their OWN password without admin role
      if (action === 'update' && userId === user.id) {
        logger.info('User changing own password - allowed', { userId: user.id });
        isAuthorized = true;
      } else {
        // For other operations or changing OTHER user's passwords, require admin role
        const { data: roles, error: roleError } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleError || !roles?.some(r => r.role === 'admin')) {
          logger.error('User is not admin', { userId: user.id, roles: roles?.map(r => r.role) });
          throw new Error('Unauthorized - Admin access required');
        }
        
        logger.info('Admin JWT token validated', { userId: user.id });
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      logger.error('Not authorized');
      throw new Error('Unauthorized');
    }

    if (action === 'update') {
      logger.info('Updating password', { userId });
      
      // Update user password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (error) {
        logger.error('Error updating password', { error: error.message, userId });
        throw error;
      }

      logger.info('Password updated successfully', { userId });
      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'create') {
      logger.info('Creating new user', { email });
      
      // This is called during user creation
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) {
        logger.error('Error creating user', { error: authError.message, email });
        throw authError;
      }

      logger.info('User created successfully', { userId: authData.user?.id, email });
      return new Response(
        JSON.stringify({ success: true, user: authData.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in manage-user-password', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
