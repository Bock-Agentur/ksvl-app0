import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper function to save custom field values
async function saveCustomFieldValues(supabaseAdmin: any, userId: string, userData: any) {
  const customFieldMappings: Record<string, any> = {
    phone: userData.phone,
    street_address: userData.streetAddress,
    postal_code: userData.postalCode,
    city: userData.city,
    emergency_contact: userData.emergencyContact,
    birth_date: userData.birthDate,
    oesv_number: userData.oesvNumber,
    entry_date: userData.entryDate,
    vorstand_funktion: userData.vorstandFunktion,
    boat_name: userData.boatName,
    boat_type: userData.boatType,
    boat_length: userData.boatLength,
    boat_width: userData.boatWidth,
    berth_number: userData.berthNumber,
    berth_type: userData.berthType,
    dinghy_berth_number: userData.dinghyBerthNumber,
    parking_permit_number: userData.parkingPermitNumber,
    parking_permit_issue_date: userData.parkingPermitIssueDate,
    beverage_chip_number: userData.beverageChipNumber,
    beverage_chip_issue_date: userData.beverageChipIssueDate,
    notes: userData.notes
  };

  // Get custom field IDs
  const { data: customFields, error: fieldsError } = await supabaseAdmin
    .from('custom_fields')
    .select('id, name')
    .in('name', Object.keys(customFieldMappings));

  if (fieldsError) {
    console.error('Error fetching custom fields:', fieldsError);
    return;
  }

  // Save custom field values
  for (const field of customFields || []) {
    const value = customFieldMappings[field.name];
    if (value != null && value !== '') {
      const { error: upsertError } = await supabaseAdmin
        .from('custom_field_values')
        .upsert({
          user_id: userId,
          field_id: field.id,
          value: String(value)
        }, {
          onConflict: 'user_id,field_id'
        });

      if (upsertError) {
        console.error(`Error saving custom field ${field.name}:`, upsertError);
      }
    }
  }
}

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

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !roles?.some(r => r.role === 'admin')) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { action, userId, userData } = await req.json();

    if (action === 'create') {
      console.log('Creating new user:', userData);
      
      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { name: userData.name }
      });

      if (authError) {
        console.error('Auth creation error:', authError);
        throw authError;
      }
      if (!authData.user) throw new Error('User creation failed');

      console.log('User created in auth:', authData.user.id);

      // Update profile with all fields
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: userData.name,
          first_name: userData.firstName || null,
          last_name: userData.lastName || null,
          phone: userData.phone || null,
          member_number: userData.memberNumber || null,
          boat_name: userData.boatName || null,
          street_address: userData.streetAddress || null,
          postal_code: userData.postalCode || null,
          city: userData.city || null,
          status: userData.status || 'active',
          oesv_number: userData.oesvNumber || null,
          address: userData.address || null,
          berth_number: userData.berthNumber || null,
          berth_type: userData.berthType || null,
          birth_date: userData.birthDate || null,
          entry_date: userData.entryDate || null,
          vorstand_funktion: userData.vorstandFunktion || null,
          data_public_in_ksvl: userData.dataPublicInKsvl === true,
          contact_public_in_ksvl: userData.contactPublicInKsvl === true
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Profile updated');

      // Save custom field values
      await saveCustomFieldValues(supabaseAdmin, authData.user.id, userData);

      // Add roles (mitglied is already added by trigger)
      if (userData.roles && userData.roles.length > 0) {
        for (const role of userData.roles) {
          if (role !== 'mitglied') {
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .insert({ user_id: authData.user.id, role });
            
            if (roleError) {
              console.error('Role insert error:', roleError);
              throw roleError;
            }
          }
        }
      }

      console.log('User created successfully');

      return new Response(
        JSON.stringify({ success: true, user: authData.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'update') {
      console.log('Updating user:', userId, userData);

      // Prevent admins from removing their own admin role
      if (userId === user.id && userData.roles) {
        const hasAdminRole = userData.roles.includes('admin');
        if (!hasAdminRole) {
          throw new Error('Admins können sich nicht selbst die Admin-Rolle entziehen');
        }
      }

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: userData.name,
          first_name: userData.firstName || null,
          last_name: userData.lastName || null,
          phone: userData.phone || null,
          member_number: userData.memberNumber || null,
          boat_name: userData.boatName || null,
          street_address: userData.streetAddress || null,
          postal_code: userData.postalCode || null,
          city: userData.city || null,
          status: userData.status || 'active',
          oesv_number: userData.oesvNumber || null,
          address: userData.address || null,
          berth_number: userData.berthNumber || null,
          berth_type: userData.berthType || null,
          birth_date: userData.birthDate || null,
          entry_date: userData.entryDate || null,
          vorstand_funktion: userData.vorstandFunktion || null,
          data_public_in_ksvl: userData.dataPublicInKsvl === true,
          contact_public_in_ksvl: userData.contactPublicInKsvl === true,
          ai_info_enabled: userData.aiInfoEnabled === true
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Profile updated');

      // Save custom field values
      await saveCustomFieldValues(supabaseAdmin, userId, userData);

      // Update roles - delete old ones first
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Role delete error:', deleteError);
        throw deleteError;
      }

      // Insert new roles
      if (userData.roles && userData.roles.length > 0) {
        for (const role of userData.roles) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: userId, role });
          
          if (roleError) {
            console.error('Role insert error:', roleError);
            throw roleError;
          }
        }
      }

      console.log('User updated successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in manage-user:', errorMessage, error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
