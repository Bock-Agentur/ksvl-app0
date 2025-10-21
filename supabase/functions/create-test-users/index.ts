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

    const { craneOperatorCount, memberCount } = await req.json()

    console.log(`Creating ${craneOperatorCount} crane operators and ${memberCount} members`)

    const createdUsers = []

    // Create Crane Operators
    for (let i = 1; i <= craneOperatorCount; i++) {
      const email = `kranfuehrer${i}@test.hafen.com`
      const password = `Test1234!${i}`
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users.find(u => u.email === email)
      
      if (userExists) {
        console.log(`User ${email} already exists, skipping...`)
        createdUsers.push({ id: userExists.id, email, role: 'kranfuehrer', existed: true })
        continue
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: `Test Kranführer ${i}`
        }
      })

      if (authError) {
        console.error(`Error creating crane operator ${i}:`, authError)
        continue
      }

      if (!authData.user) continue

      // Update profile
      await supabaseAdmin
        .from('profiles')
        .update({ 
          name: `Test Kranführer ${i}`,
          email: email,
          is_test_data: true
        })
        .eq('id', authData.user.id)

      // Add kranfuehrer role
      await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'kranfuehrer'
        })

      createdUsers.push({ id: authData.user.id, email, role: 'kranfuehrer', existed: false })
    }

    // Create Members
    for (let i = 1; i <= memberCount; i++) {
      const email = `mitglied${i}@test.hafen.com`
      const password = `Test1234!${i}`
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users.find(u => u.email === email)
      
      if (userExists) {
        console.log(`User ${email} already exists, skipping...`)
        createdUsers.push({ id: userExists.id, email, role: 'mitglied', existed: true })
        continue
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: `Test Mitglied ${i}`
        }
      })

      if (authError) {
        console.error(`Error creating member ${i}:`, authError)
        continue
      }

      if (!authData.user) continue

      // Update profile
      await supabaseAdmin
        .from('profiles')
        .update({ 
          name: `Test Mitglied ${i}`,
          email: email,
          is_test_data: true
        })
        .eq('id', authData.user.id)

      // Member role is added automatically by trigger
      createdUsers.push({ id: authData.user.id, email, role: 'mitglied', existed: false })
    }

    console.log(`Successfully created ${createdUsers.length} test users`)

    return new Response(
      JSON.stringify({ 
        success: true,
        created: createdUsers.length,
        users: createdUsers
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})