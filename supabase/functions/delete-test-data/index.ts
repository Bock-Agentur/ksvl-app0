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

    console.log('Starting deletion of test data...')

    // Delete test slots
    const { error: slotsError } = await supabaseAdmin
      .from('slots')
      .delete()
      .eq('is_test_data', true)

    if (slotsError) {
      console.error('Error deleting slots:', slotsError)
      throw slotsError
    }

    // Get test user IDs - check both is_test_data flag AND email pattern
    const { data: testUsers, error: usersSelectError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .or('is_test_data.eq.true,email.like.%@test.hafen.com')

    if (usersSelectError) {
      console.error('Error selecting test users:', usersSelectError)
      throw usersSelectError
    }

    console.log(`Found ${testUsers?.length || 0} test users to delete`)

    if (testUsers && testUsers.length > 0) {
      const userIds = testUsers.map(u => u.id)
      
      console.log('Deleting user roles...')
      // Delete user roles
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .in('user_id', userIds)

      console.log('Deleting profiles...')
      // Delete profiles
      await supabaseAdmin
        .from('profiles')
        .delete()
        .in('id', userIds)

      console.log('Deleting auth users...')
      // Delete auth users
      for (const userId of userIds) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
          console.log(`Deleted auth user ${userId}`)
        } catch (error) {
          console.error(`Error deleting auth user ${userId}:`, error)
        }
      }

      console.log(`Successfully deleted ${userIds.length} test users`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        deleted: testUsers?.length || 0
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