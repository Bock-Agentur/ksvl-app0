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
          boat_type: userData.boatType || null,
          boat_length: userData.boatLength || null,
          boat_width: userData.boatWidth || null,
          boat_color: userData.boatColor || null,
          berth_length: userData.berthLength || null,
          berth_width: userData.berthWidth || null,
          buoy_radius: userData.buoyRadius || null,
          has_dinghy_berth: userData.hasDinghyBerth === true,
          dinghy_berth_number: userData.dinghyBerthNumber || null,
          parking_permit_number: userData.parkingPermitNumber || null,
          parking_permit_issue_date: userData.parkingPermitIssueDate || null,
          beverage_chip_number: userData.beverageChipNumber || null,
          beverage_chip_issue_date: userData.beverageChipIssueDate || null,
          beverage_chip_status: userData.beverageChipStatus || 'Aktiv',
          emergency_contact: userData.emergencyContact || null,
          emergency_contact_name: userData.emergencyContactName || null,
          emergency_contact_phone: userData.emergencyContactPhone || null,
          emergency_contact_relationship: userData.emergencyContactRelationship || null,
          notes: userData.notes || null,
          membership_type: userData.membershipType || null,
          membership_status: userData.membershipStatus || 'Aktiv',
          board_position_start_date: userData.boardPositionStartDate || null,
          board_position_end_date: userData.boardPositionEndDate || null,
          password_change_required: userData.passwordChangeRequired === true,
          two_factor_method: userData.twoFactorMethod || 'Aus',
          statute_accepted: userData.statuteAccepted === true,
          privacy_accepted: userData.privacyAccepted === true,
          newsletter_optin: userData.newsletterOptin === true,
          data_public_in_ksvl: userData.dataPublicInKsvl === true,
          contact_public_in_ksvl: userData.contactPublicInKsvl === true,
          document_bfa: userData.documentBfa || null,
          document_insurance: userData.documentInsurance || null,
          document_berth_contract: userData.documentBerthContract || null,
          document_member_photo: userData.documentMemberPhoto || null
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
          boat_type: userData.boatType || null,
          boat_length: userData.boatLength || null,
          boat_width: userData.boatWidth || null,
          boat_color: userData.boatColor || null,
          berth_length: userData.berthLength || null,
          berth_width: userData.berthWidth || null,
          buoy_radius: userData.buoyRadius || null,
          has_dinghy_berth: userData.hasDinghyBerth === true,
          dinghy_berth_number: userData.dinghyBerthNumber || null,
          parking_permit_number: userData.parkingPermitNumber || null,
          parking_permit_issue_date: userData.parkingPermitIssueDate || null,
          beverage_chip_number: userData.beverageChipNumber || null,
          beverage_chip_issue_date: userData.beverageChipIssueDate || null,
          beverage_chip_status: userData.beverageChipStatus || 'Aktiv',
          emergency_contact: userData.emergencyContact || null,
          emergency_contact_name: userData.emergencyContactName || null,
          emergency_contact_phone: userData.emergencyContactPhone || null,
          emergency_contact_relationship: userData.emergencyContactRelationship || null,
          notes: userData.notes || null,
          membership_type: userData.membershipType || null,
          membership_status: userData.membershipStatus || 'Aktiv',
          board_position_start_date: userData.boardPositionStartDate || null,
          board_position_end_date: userData.boardPositionEndDate || null,
          password_change_required: userData.passwordChangeRequired === true,
          two_factor_method: userData.twoFactorMethod || 'Aus',
          statute_accepted: userData.statuteAccepted === true,
          privacy_accepted: userData.privacyAccepted === true,
          newsletter_optin: userData.newsletterOptin === true,
          data_public_in_ksvl: userData.dataPublicInKsvl === true,
          contact_public_in_ksvl: userData.contactPublicInKsvl === true,
          ai_info_enabled: userData.aiInfoEnabled === true,
          document_bfa: userData.documentBfa || null,
          document_insurance: userData.documentInsurance || null,
          document_berth_contract: userData.documentBerthContract || null,
          document_member_photo: userData.documentMemberPhoto || null
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
