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

    // Check if Monday.com sync is enabled
    const { data: settings } = await supabase
      .from('monday_settings')
      .select('*')
      .single();

    if (!settings?.auto_sync_enabled) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Monday.com sync not enabled',
          synced: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting Monday.com sync...');

    // Fetch data from Monday.com
    const boardData = await getMitgliedsdaten(mondayApiKey, settings.board_id);
    
    if (!boardData || boardData.length === 0) {
      throw new Error('No data retrieved from Monday.com');
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
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', existingProfile.id);

          if (updateError) throw updateError;
          console.log(`Updated profile for ${profileData.email}`);
        } else {
          // Create new profile with Monday.com data
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (insertError) {
            // If insert fails due to duplicate, try update
            if (insertError.code === '23505') {
              const { error: retryError } = await supabase
                .from('profiles')
                .update(profileData)
                .ilike('email', profileData.email);
              
              if (retryError) throw retryError;
              console.log(`Updated profile for ${profileData.email} (retry)`);
            } else {
              throw insertError;
            }
          } else {
            console.log(`Created new profile for ${profileData.email}`);
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
async function getMitgliedsdaten(apiToken: string, boardId?: string) {
  const url = "https://api.monday.com/v2";
  
  const query = `
    query {
      boards (limit: 50) {
        id
        name
        items_page {
          items {
            id
            name
            column_values {
              id
              title
              text
            }
          }
        }
      }
    }
  `;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": apiToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`Monday.com API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Find the board by name or use provided boardId
  let board;
  if (boardId) {
    board = data.data.boards.find((b: any) => b.id === boardId);
  }
  
  if (!board) {
    board = data.data.boards.find(
      (b: any) => b.name === "APP_SYNC_Mitgliedsdaten"
    );
  }

  if (!board) {
    throw new Error("Board 'APP_SYNC_Mitgliedsdaten' nicht gefunden.");
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

  // Extract data
  const items = board.items_page?.items || [];
  const result = items.map((item: any) => {
    const row: any = { id: item.id };

    item.column_values.forEach((col: any) => {
      if (allowedColumns.includes(col.title)) {
        row[col.title] = col.text || "";
      }
    });

    return row;
  });

  return result;
}
