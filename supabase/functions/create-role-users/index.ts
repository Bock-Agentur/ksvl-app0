import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if requester is admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Only admins can create role users');
    }

    const roleUsers = [
      { email: 'mitglied-rolle@ksvl.test', role: 'mitglied', name: 'Mitglied Rolle' },
      { email: 'kranfuehrer-rolle@ksvl.test', role: 'kranfuehrer', name: 'Kranführer Rolle' },
      { email: 'gastmitglied-rolle@ksvl.test', role: 'gastmitglied', name: 'Gastmitglied Rolle' },
      { email: 'vorstand-rolle@ksvl.test', role: 'vorstand', name: 'Vorstand Rolle' },
    ];

    const results = [];

    for (const roleUser of roleUsers) {
      // Check if user already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', roleUser.email)
        .single();

      if (existingProfile) {
        console.log(`Role user ${roleUser.email} already exists, skipping...`);
        results.push({ email: roleUser.email, status: 'already_exists' });
        continue;
      }

      // Create user in auth
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: roleUser.email,
        password: '123456',
        email_confirm: true,
        user_metadata: {
          name: roleUser.name
        }
      });

      if (createError) {
        console.error(`Error creating auth user for ${roleUser.email}:`, createError);
        results.push({ email: roleUser.email, status: 'error', error: createError.message });
        continue;
      }

      // Update profile to mark as role user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: roleUser.name,
          is_role_user: true,
          status: 'active',
          member_number: `ROLE-${roleUser.role.toUpperCase()}`
        })
        .eq('id', authUser.user.id);

      if (profileError) {
        console.error(`Error updating profile for ${roleUser.email}:`, profileError);
      }

      // Add role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: roleUser.role
        });

      if (roleError) {
        console.error(`Error adding role for ${roleUser.email}:`, roleError);
      }

      results.push({ email: roleUser.email, status: 'created', id: authUser.user.id });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});