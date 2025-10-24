import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can regenerate role users');
    }

    console.log('Starting role users regeneration...');

    // Step 1: Delete all existing role users
    console.log('Step 1: Deleting existing role users...');
    
    const { data: existingRoleUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_role_user', true);

    if (existingRoleUsers && existingRoleUsers.length > 0) {
      console.log(`Found ${existingRoleUsers.length} existing role users to delete`);
      
      for (const roleUser of existingRoleUsers) {
        try {
          // Delete from auth.users (this will cascade to profiles and user_roles)
          await supabaseAdmin.auth.admin.deleteUser(roleUser.id);
          console.log(`Deleted role user: ${roleUser.id}`);
        } catch (error) {
          console.error(`Error deleting user ${roleUser.id}:`, error);
        }
      }
    }

    // Step 2: Create 5 new role users with complete data
    console.log('Step 2: Creating new role users...');

    const roleUsersData = [
      {
        email: 'admin-rolle@ksvl.test',
        password: '123456',
        role: 'admin',
        profile: {
          first_name: 'Thomas',
          last_name: 'Administrator',
          name: 'Thomas Administrator',
          username: 'admin-rolle',
          phone: '+43 664 1234567',
          street_address: 'Seestraße 1',
          postal_code: '1234',
          city: 'Hafenstadt',
          member_number: 'ROLE-ADMIN',
          birth_date: '1975-03-10',
          entry_date: '2010-01-01',
          boat_name: 'MS Kapitän',
          boat_type: 'Motorboot',
          boat_length: 9.5,
          boat_width: 3.2,
          berth_number: 'A-01',
          berth_type: 'Dauerliegeplatz',
          dinghy_berth_number: 'D-01',
          parking_permit_number: 'P-001',
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: 'BC-001',
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: 'OESV-10001',
          emergency_contact: 'Maria Administrator, +43 664 7654321',
          notes: 'Admin-Test-Account für Systemverwaltung',
          vorstand_funktion: null,
          status: 'active',
          is_role_user: true,
          is_test_data: false,
          data_public_in_ksvl: true,
          contact_public_in_ksvl: true,
        }
      },
      {
        email: 'vorstand-rolle@ksvl.test',
        password: '123456',
        role: 'vorstand',
        profile: {
          first_name: 'Stefan',
          last_name: 'Vorstand',
          name: 'Stefan Vorstand',
          username: 'vorstand-rolle',
          phone: '+43 664 2234567',
          street_address: 'Hafenplatz 5',
          postal_code: '1234',
          city: 'Hafenstadt',
          member_number: 'ROLE-VORSTAND',
          birth_date: '1978-07-15',
          entry_date: '2012-03-15',
          boat_name: 'SY Windrose',
          boat_type: 'Segelboot',
          boat_length: 11.0,
          boat_width: 3.5,
          berth_number: 'A-05',
          berth_type: 'Dauerliegeplatz',
          dinghy_berth_number: 'D-05',
          parking_permit_number: 'P-005',
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: 'BC-005',
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: 'OESV-10005',
          emergency_contact: 'Anna Vorstand, +43 664 8765432',
          notes: 'Vorstand-Test-Account',
          vorstand_funktion: 'Obmann-Stellvertreter',
          status: 'active',
          is_role_user: true,
          is_test_data: false,
          data_public_in_ksvl: true,
          contact_public_in_ksvl: true,
        }
      },
      {
        email: 'kranfuehrer-rolle@ksvl.test',
        password: '123456',
        role: 'kranfuehrer',
        profile: {
          first_name: 'Klaus',
          last_name: 'Kranführer',
          name: 'Klaus Kranführer',
          username: 'kranfuehrer-rolle',
          phone: '+43 664 3234567',
          street_address: 'Kranweg 12',
          postal_code: '1234',
          city: 'Hafenstadt',
          member_number: 'ROLE-KRANFUEHRER',
          birth_date: '1982-11-22',
          entry_date: '2015-05-20',
          boat_name: 'MY Seeteufel',
          boat_type: 'Motorboot',
          boat_length: 7.8,
          boat_width: 2.6,
          berth_number: 'B-12',
          berth_type: 'Dauerliegeplatz',
          dinghy_berth_number: 'D-12',
          parking_permit_number: 'P-012',
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: 'BC-012',
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: 'OESV-10012',
          emergency_contact: 'Petra Kranführer, +43 664 9876543',
          notes: 'Kranführer-Test-Account mit Spezialberechtigung',
          vorstand_funktion: null,
          status: 'active',
          is_role_user: true,
          is_test_data: false,
          data_public_in_ksvl: true,
          contact_public_in_ksvl: true,
        }
      },
      {
        email: 'mitglied-rolle@ksvl.test',
        password: '123456',
        role: 'mitglied',
        profile: {
          first_name: 'Max',
          last_name: 'Mitglied',
          name: 'Max Mitglied',
          username: 'mitglied-rolle',
          phone: '+43 664 4234567',
          street_address: 'Hafenstraße 23',
          postal_code: '1234',
          city: 'Hafenstadt',
          member_number: 'ROLE-MITGLIED',
          birth_date: '1985-05-15',
          entry_date: '2018-08-10',
          boat_name: 'SY Seeadler',
          boat_type: 'Segelboot',
          boat_length: 8.5,
          boat_width: 2.8,
          berth_number: 'C-23',
          berth_type: 'Dauerliegeplatz',
          dinghy_berth_number: 'D-23',
          parking_permit_number: 'P-023',
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: 'BC-023',
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: 'OESV-10023',
          emergency_contact: 'Anna Mitglied, +43 664 5432109',
          notes: 'Standard-Mitglied-Test-Account',
          vorstand_funktion: null,
          status: 'active',
          is_role_user: true,
          is_test_data: false,
          data_public_in_ksvl: true,
          contact_public_in_ksvl: true,
        }
      },
      {
        email: 'gastmitglied-rolle@ksvl.test',
        password: '123456',
        role: 'gastmitglied',
        profile: {
          first_name: 'Gerd',
          last_name: 'Gast',
          name: 'Gerd Gast',
          username: 'gastmitglied-rolle',
          phone: '+43 664 5234567',
          street_address: 'Gaststraße 45',
          postal_code: '5678',
          city: 'Gaststadt',
          member_number: 'ROLE-GASTMITGLIED',
          birth_date: '1990-09-05',
          entry_date: '2023-06-01',
          boat_name: 'MY Meeresblick',
          boat_type: 'Motorboot',
          boat_length: 6.5,
          boat_width: 2.3,
          berth_number: 'G-45',
          berth_type: 'Gastliegeplatz',
          dinghy_berth_number: null,
          parking_permit_number: 'P-045',
          parking_permit_issue_date: '2024-01-01',
          beverage_chip_number: 'BC-045',
          beverage_chip_issue_date: '2024-01-01',
          oesv_number: null,
          emergency_contact: 'Maria Gast, +43 664 6543210',
          notes: 'Gastmitglied-Test-Account mit eingeschränkten Rechten',
          vorstand_funktion: null,
          status: 'active',
          is_role_user: true,
          is_test_data: false,
          data_public_in_ksvl: false,
          contact_public_in_ksvl: false,
        }
      }
    ];

    const createdUsers = [];

    for (const userData of roleUsersData) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === userData.email);

        if (existingUser) {
          console.log(`User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Create user in auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.profile.name,
            first_name: userData.profile.first_name,
            last_name: userData.profile.last_name,
          }
        });

        if (authError) {
          console.error(`Error creating auth user ${userData.email}:`, authError);
          continue;
        }

        console.log(`Created auth user: ${userData.email}`);

        // Update profile with complete data
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            ...userData.profile,
            email: userData.email,
          })
          .eq('id', authUser.user.id);

        if (profileError) {
          console.error(`Error updating profile for ${userData.email}:`, profileError);
        }

        // Insert role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: userData.role,
          });

        if (roleError) {
          console.error(`Error inserting role for ${userData.email}:`, roleError);
        }

        createdUsers.push({
          email: userData.email,
          role: userData.role,
          name: userData.profile.name,
        });

        console.log(`Successfully created role user: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }

    console.log(`Regeneration complete. Created ${createdUsers.length} role users.`);

    return new Response(
      JSON.stringify({
        success: true,
        created: createdUsers.length,
        users: createdUsers,
        message: `${createdUsers.length} Rollen-Benutzer wurden neu generiert`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in regenerate-role-users:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
