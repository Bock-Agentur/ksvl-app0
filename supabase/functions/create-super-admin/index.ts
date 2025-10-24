import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    // Check if any real admin exists (not role users)
    const { data: existingAdmins } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, profiles!inner(is_role_user)')
      .eq('role', 'admin')
      .eq('profiles.is_role_user', false)

    const hasRealAdmin = existingAdmins && existingAdmins.length > 0

    // If real admin exists, require authentication
    if (hasRealAdmin) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Admin bereits vorhanden. Authentifizierung erforderlich.' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userAuthError } = await supabaseAdmin.auth.getUser(token)

      if (userAuthError || !user) {
        return new Response(
          JSON.stringify({ error: 'Ungültige Authentifizierung' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify admin role
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Admin-Berechtigung erforderlich' }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    const { email, password, name, first_name, last_name } = await req.json()

    console.log('Creating super admin:', email)

    // Create user in Auth
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email,
        first_name: first_name || '',
        last_name: last_name || ''
      }
    })

    if (createUserError) {
      console.error('Auth error:', createUserError)
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Benutzer-Erstellung fehlgeschlagen' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User created, ID:', authData.user.id)

    // Update profile with super admin flags
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        name: name || email,
        first_name: first_name || '',
        last_name: last_name || '',
        email: email,
        is_role_user: false,
        is_test_data: false,
        status: 'active'
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Role error:', roleError)
      return new Response(
        JSON.stringify({ error: 'Admin-Rolle konnte nicht zugewiesen werden: ' + roleError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Super admin created successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email
        },
        message: hasRealAdmin ? 'Admin erfolgreich angelegt' : 'Super Admin erfolgreich angelegt (erster Admin)'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
