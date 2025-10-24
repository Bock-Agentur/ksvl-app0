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
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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
    )

    // Verify JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify admin role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { craneOperatorCount, memberCount } = await req.json()

    // Add reasonable limits
    if (craneOperatorCount > 50 || memberCount > 200) {
      return new Response(
        JSON.stringify({ error: 'Limits exceeded: max 50 crane operators, 200 members' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Creating ${craneOperatorCount} crane operators and ${memberCount} members`)

    const createdUsers = []

    // Data pools for variation
    const firstNames = ['Max', 'Anna', 'Tom', 'Lisa', 'Peter', 'Sarah', 'Klaus', 'Maria', 'Stefan', 'Julia', 'Michael', 'Sophie', 'Daniel', 'Emma', 'Christian']
    const lastNames = ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Fischer', 'Schneider', 'Hofmann', 'Schwarz', 'Zimmermann', 'Braun', 'Hartmann', 'Lange', 'Werner']
    const streets = ['Hafenstraße', 'Seeweg', 'Wellenplatz', 'Bootsweg', 'Ankerstraße', 'Meerblick', 'Strandpromenade', 'Kaigasse']
    const cities = ['Hafenstadt', 'Seestadt', 'Küstenort', 'Meerblick', 'Wellenhafen']
    const boatTypes = ['Segelboot', 'Motorboot', 'Katamaran', 'Kajütboot', 'Jolle']
    const boatNames = ['Seeadler', 'Windrose', 'Meeresblick', 'Wellenreiter', 'Neptun', 'Poseidon', 'Atlantis', 'Odyssee', 'Horizont', 'Freiheit']
    const berthTypes = ['Dauerliegeplatz', 'Saisonliegeplatz', 'Gastliegeplatz']

    const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const getRandomDate = (startYear: number, endYear: number) => {
      const year = getRandomNumber(startYear, endYear)
      const month = String(getRandomNumber(1, 12)).padStart(2, '0')
      const day = String(getRandomNumber(1, 28)).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // Create Crane Operators with complete data
    for (let i = 1; i <= craneOperatorCount; i++) {
      const email = `kranfuehrer${i}@test.hafen.com`
      const password = `Test1234!${i}`
      const firstName = getRandomElement(firstNames)
      const lastName = getRandomElement(lastNames)
      const name = `${firstName} ${lastName}`
      
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
          name,
          first_name: firstName,
          last_name: lastName,
        }
      })

      if (authError) {
        console.error(`Error creating crane operator ${i}:`, authError)
        continue
      }

      if (!authData.user) continue

      // Update profile with complete data
      await supabaseAdmin
        .from('profiles')
        .update({ 
          is_test_data: true,
          name,
          first_name: firstName,
          last_name: lastName,
          email: email,
          username: `kranfuehrer${i}`,
          phone: `+43 664 ${getRandomNumber(1000000, 9999999)}`,
          street_address: `${getRandomElement(streets)} ${getRandomNumber(1, 99)}`,
          postal_code: String(getRandomNumber(1000, 9999)),
          city: getRandomElement(cities),
          member_number: `TEST-KF-${String(i).padStart(3, '0')}`,
          birth_date: getRandomDate(1960, 1990),
          entry_date: getRandomDate(2010, 2023),
          boat_name: `MY ${getRandomElement(boatNames)}`,
          boat_type: 'Motorboot',
          boat_length: getRandomNumber(70, 120) / 10,
          boat_width: getRandomNumber(24, 35) / 10,
          berth_number: `B-${String(i).padStart(2, '0')}`,
          berth_type: getRandomElement(berthTypes),
          dinghy_berth_number: `D-${String(i).padStart(2, '0')}`,
          parking_permit_number: `P-${String(100 + i).padStart(3, '0')}`,
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: `BC-${String(100 + i).padStart(3, '0')}`,
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: `OESV-${getRandomNumber(20000, 29999)}`,
          emergency_contact: `${getRandomElement(firstNames)} ${lastName}, +43 664 ${getRandomNumber(1000000, 9999999)}`,
          notes: `Test-Kranführer ${i}`,
          status: 'active',
          data_public_in_ksvl: true,
          contact_public_in_ksvl: true,
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

    // Create Members with complete data
    for (let i = 1; i <= memberCount; i++) {
      const email = `mitglied${i}@test.hafen.com`
      const password = `Test1234!${i}`
      const firstName = getRandomElement(firstNames)
      const lastName = getRandomElement(lastNames)
      const name = `${firstName} ${lastName}`
      const boatType = getRandomElement(boatTypes)
      const boatPrefix = boatType === 'Segelboot' ? 'SY' : boatType === 'Motorboot' ? 'MY' : ''
      
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
          name,
          first_name: firstName,
          last_name: lastName,
        }
      })

      if (authError) {
        console.error(`Error creating member ${i}:`, authError)
        continue
      }

      if (!authData.user) continue

      // Update profile with complete data
      await supabaseAdmin
        .from('profiles')
        .update({ 
          is_test_data: true,
          name,
          first_name: firstName,
          last_name: lastName,
          email: email,
          username: `mitglied${i}`,
          phone: `+43 664 ${getRandomNumber(1000000, 9999999)}`,
          street_address: `${getRandomElement(streets)} ${getRandomNumber(1, 99)}`,
          postal_code: String(getRandomNumber(1000, 9999)),
          city: getRandomElement(cities),
          member_number: `TEST-M-${String(i).padStart(3, '0')}`,
          birth_date: getRandomDate(1965, 1995),
          entry_date: getRandomDate(2015, 2024),
          boat_name: boatPrefix ? `${boatPrefix} ${getRandomElement(boatNames)}` : getRandomElement(boatNames),
          boat_type: boatType,
          boat_length: getRandomNumber(60, 110) / 10,
          boat_width: getRandomNumber(22, 32) / 10,
          berth_number: `C-${String(i).padStart(2, '0')}`,
          berth_type: getRandomElement(berthTypes),
          dinghy_berth_number: Math.random() > 0.3 ? `D-${String(100 + i).padStart(3, '0')}` : null,
          parking_permit_number: `P-${String(200 + i).padStart(3, '0')}`,
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: `BC-${String(200 + i).padStart(3, '0')}`,
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: Math.random() > 0.2 ? `OESV-${getRandomNumber(30000, 39999)}` : null,
          emergency_contact: `${getRandomElement(firstNames)} ${lastName}, +43 664 ${getRandomNumber(1000000, 9999999)}`,
          notes: `Test-Mitglied ${i}`,
          status: 'active',
          data_public_in_ksvl: Math.random() > 0.3,
          contact_public_in_ksvl: Math.random() > 0.4,
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