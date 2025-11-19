import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const mondayApiKey = Deno.env.get('MONDAY_API_KEY');
    if (!mondayApiKey) {
      throw new Error('MONDAY_API_KEY not configured');
    }

    const { action } = await req.json();
    const startTime = new Date().toISOString();

    console.log('Sync request received:', { action, timestamp: startTime });

    // Check if Monday.com settings exist
    const { data: settings } = await supabase
      .from('monday_settings')
      .select('*')
      .single();

    if (!settings) {
      console.error('Monday.com settings not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Monday.com settings not configured. Please configure in Settings.',
          synced: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Settings loaded:', { 
      board_id: settings.board_id, 
      auto_sync_enabled: settings.auto_sync_enabled,
      api_key_set: settings.api_key_set 
    });

    // Check if board_id is configured
    if (!settings.board_id) {
      console.error('Board-ID not configured in monday_settings');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Board-ID nicht konfiguriert. Bitte in Monday.com Settings eintragen.',
          synced: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Only check auto_sync for automatic syncs, not manual ones
    if (action !== 'sync' && !settings.auto_sync_enabled) {
      console.log('Auto-sync is disabled, skipping automatic sync');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auto-sync is disabled',
          synced: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting Monday.com sync...');

    // Fetch data from Monday.com
    console.log('Calling Monday.com API...', { board_id: settings.board_id });
    const boardData = await getMitgliedsdaten(mondayApiKey, settings.board_id);
    
    if (!boardData || boardData.length === 0) {
      console.error('No data retrieved from Monday.com');
      throw new Error('No data retrieved from Monday.com. Check board ID and API key.');
    }

    console.log(`Retrieved ${boardData.length} items from Monday.com`);

    // Sync data to profiles table
    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const item of boardData) {
      try {
        // Skip items without email
        if (!item.eMail) {
          console.log(`Skipping item ${item.id}: No email address`);
          continue;
        }

        console.log(`Processing item ${item.id}:`, { email: item.eMail, name: `${item.Vorname} ${item.Nachname}` });

        // Map Monday.com columns to profile fields - replace ALL data
        const profileData = {
          email: item.eMail,
          first_name: item.Vorname || null,
          last_name: item.Nachname || null,
          postal_code: item.PLZ || null,
          city: item.ORT || null,
          phone: item.Telefon || null,
          name: `${item.Vorname || ''} ${item.Nachname || ''}`.trim() || item.eMail,
          monday_item_id: item.id,
          updated_at: new Date().toISOString()
        };

        // Find existing profile by email (case-insensitive)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', profileData.email)
          .maybeSingle();

        if (existingProfile) {
          // REPLACE existing profile data completely with Monday.com data
          console.log(`Updating existing profile ${existingProfile.id} for ${profileData.email}`);
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', existingProfile.id);

          if (updateError) throw updateError;
          console.log(`✅ Updated profile for ${profileData.email}`);
        } else {
          // Create new profile with Monday.com data
          console.log(`Creating new profile for ${profileData.email}`);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (insertError) {
            // If insert fails due to duplicate, try update
            if (insertError.code === '23505') {
              console.log(`Duplicate detected, retrying as update for ${profileData.email}`);
              const { error: retryError } = await supabase
                .from('profiles')
                .update(profileData)
                .ilike('email', profileData.email);
              
              if (retryError) throw retryError;
              console.log(`✅ Updated profile for ${profileData.email} (retry)`);
            } else {
              throw insertError;
            }
          } else {
            console.log(`✅ Created new profile for ${profileData.email}`);
          }
        }

        syncedCount++;
      } catch (itemError) {
        console.error(`Error syncing item ${item.id}:`, itemError);
        errorCount++;
        errors.push({
          item_id: item.id,
          email: item.eMail || 'unknown',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        });
      }
    }

    // Update last sync time
    await supabase
      .from('monday_settings')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', settings.id);

    // Log sync result
    await supabase
      .from('monday_sync_logs')
      .insert({
        sync_type: 'manual',
        direction: 'monday_to_app',
        board_id: settings.board_id,
        action: action || 'sync',
        success: errorCount === 0,
        error_details: errorCount > 0 ? { errors } : null,
        started_at: startTime,
        completed_at: new Date().toISOString()
      });

    console.log(`Sync completed: ${syncedCount} synced, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sync completed: ${syncedCount} items synced${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        synced: true,
        stats: {
          total: boardData.length,
          synced: syncedCount,
          errors: errorCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Function to fetch Mitgliedsdaten from Monday.com
async function getMitgliedsdaten(apiToken: string, boardId: string) {
  const query = `
    query {
      boards (ids: [${boardId}]) {
        id
        name
        groups {
          id
          title
        }
        columns {
          id
          title
        }
        items_page (limit: 500) {
          items {
            id
            name
            group {
              id
            }
            column_values {
              id
              text
            }
          }
        }
      }
    }
  `;

  console.log('Monday.com API request:', { boardId });

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiToken,
      'API-Version': '2024-10'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Monday.com API HTTP error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Monday.com API HTTP error: ${response.status} ${response.statusText}`);
  }

  const apiResponse = await response.json();
  console.log('Monday.com API response:', JSON.stringify(apiResponse, null, 2));

  if (apiResponse.errors) {
    console.error('Monday.com GraphQL errors:', apiResponse.errors);
    throw new Error(`Monday.com GraphQL error: ${JSON.stringify(apiResponse.errors)}`);
  }

  if (!apiResponse.data || !apiResponse.data.boards || apiResponse.data.boards.length === 0) {
    console.error('Board not found or unexpected response structure:', apiResponse);
    throw new Error(`Board mit ID '${boardId}' nicht gefunden. Bitte Board-ID überprüfen.`);
  }

  const board = apiResponse.data.boards[0];
  console.log('Board found:', { id: board.id, name: board.name });

  // Log available groups
  if (board.groups) {
    console.log('Available groups:', board.groups.map((g: any) => ({ id: g.id, title: g.title })));
  }

  // Find "Stammdaten" group
  const stammdatenGroup = board.groups?.find((g: any) => g.title === "Stammdaten");
  if (!stammdatenGroup) {
    console.warn('Group "Stammdaten" not found. Available groups:', 
      board.groups?.map((g: any) => g.title) || []
    );
    console.log('Processing all items without group filter');
  } else {
    console.log('Found "Stammdaten" group:', { id: stammdatenGroup.id, title: stammdatenGroup.title });
  }

  // Define allowed columns
  const allowedColumns = [
    "Nachname",
    "Vorname",
    "PLZ",
    "ORT",
    "Telefon",
    "eMail"
  ];

  // Create a map of column IDs to titles
  const columnMap = new Map();
  if (board.columns) {
    board.columns.forEach((col: any) => {
      columnMap.set(col.id, col.title);
    });
  }
  console.log('Column mapping:', Object.fromEntries(columnMap));

  // Extract and filter items
  let items = board.items_page?.items || [];
  console.log(`Total items in board: ${items.length}`);

  // Filter by "Stammdaten" group if found
  if (stammdatenGroup) {
    const beforeFilter = items.length;
    items = items.filter((item: any) => item.group?.id === stammdatenGroup.id);
    console.log(`Filtered items from "Stammdaten" group: ${items.length} (before: ${beforeFilter})`);
  }

  const result = items.map((item: any) => {
    const row: any = { id: item.id };

    item.column_values.forEach((col: any) => {
      const columnTitle = columnMap.get(col.id);
      if (columnTitle && allowedColumns.includes(columnTitle)) {
        row[columnTitle] = col.text || "";
      }
    });

    return row;
  });

  console.log(`Extracted ${result.length} items from Monday.com`);
  return result;
}
