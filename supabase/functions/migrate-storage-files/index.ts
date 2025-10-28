import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bucketName = 'login-media' } = await req.json().catch(() => ({}));

    console.log(`Starting migration for bucket: ${bucketName}`);

    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      skippedCount: 0,
      errors: []
    };

    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000 });

    if (listError) {
      console.error('Error listing files:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list files', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${files.length} files in bucket`);

    // Process each file
    for (const file of files) {
      try {
        const storagePath = file.name;
        
        // Check if metadata already exists
        const { data: existing } = await supabase
          .from('file_metadata')
          .select('id')
          .eq('storage_path', storagePath)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping ${storagePath} - metadata already exists`);
          result.skippedCount++;
          continue;
        }

        // Determine file type from metadata
        const mimeType = file.metadata?.mimetype || 'application/octet-stream';
        let fileType = 'other';
        let category = bucketName === 'login-media' ? 'login_media' : 'document';

        if (mimeType.startsWith('image/')) {
          fileType = 'image';
        } else if (mimeType.startsWith('video/')) {
          fileType = 'video';
        } else if (mimeType === 'application/pdf') {
          fileType = 'pdf';
        }

        // Create metadata entry with full storage path including bucket prefix
        const fullStoragePath = bucketName === 'login-media' 
          ? `login-media/${file.name}`
          : storagePath;

        const { error: insertError } = await supabase
          .from('file_metadata')
          .insert({
            filename: file.name,
            storage_path: fullStoragePath,
            file_type: fileType,
            mime_type: mimeType,
            file_size: file.metadata?.size || 0,
            category: category,
            is_public: bucketName === 'login-media',
            owner_id: user.id,
            description: `Migrated from ${bucketName} bucket`,
            tags: ['migrated']
          });

        if (insertError) {
          console.error(`Error creating metadata for ${storagePath}:`, insertError);
          result.errors.push(`${storagePath}: ${insertError.message}`);
          result.success = false;
        } else {
          console.log(`Successfully migrated ${storagePath}`);
          result.migratedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing file ${file.name}:`, error);
        result.errors.push(`${file.name}: ${errorMessage}`);
        result.success = false;
      }
    }

    console.log(`Migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errors.length} errors`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: 'Migration failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
